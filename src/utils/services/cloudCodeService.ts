import { useCFStore } from '../../zustand/useCFStore';
import { toast } from 'sonner';
import { browserAPI } from '../browser/browserDetect';
import { API_BASE_URL } from '../apiConfig';

const lastSyncedCloudCode = new Map<string, string>();
const inFlightSaves = new Map<string, { code: string; promise: Promise<boolean> }>();

/**
 * Checks if the given code differs from the last successfully synced cloud code
 * and is not already currently being saved with the same content.
 */
export const hasCloudCodeChanged = (slug: string, code: string): boolean => {
    if (lastSyncedCloudCode.get(slug) === code) {
        return false;
    }
    const inFlight = inFlightSaves.get(slug);
    if (inFlight && inFlight.code === code) {
        return false;
    }
    return true;
};

/**
 * Sets the last synced cloud code cache for a slug.
 */
export const setLastSyncedCloudCode = (slug: string, code: string) => {
    lastSyncedCloudCode.set(slug, code);
};

/**
 * Retrieves valid authentication token and headers for backend API requests.
 */
const getAuthHeaders = async (): Promise<{ headers: Record<string, string>; token: string } | null> => {
    try {
        const storageRes = await new Promise<any>((resolve) =>
            browserAPI.storage.local.get(['authToken', 'session', 'isLoggedIn', 'isPlusUser'], resolve)
        );

        const store = useCFStore.getState();
        const isLoggedIn = store.isLoggedIn || storageRes.isLoggedIn;
        const isPlusUser = store.isPlusUser || storageRes.isPlusUser;
        const token = storageRes.authToken || storageRes.session?.access_token || localStorage.getItem('authToken');

        if (!isLoggedIn || !token) {
            return null;
        }

        return {
            token,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
    } catch (err) {
        console.error('[CloudCodeService] Failed to get auth headers:', err);
        return null;
    }
};

export const handleDowngrade = () => {
    useCFStore.getState().setIsPlusUser(false);
    browserAPI.storage.local.set({ isPlusUser: false });
    localStorage.setItem('isPlusUser', 'false');
    useCFStore.getState().setShowDowngradePopup(true);
};

/**
 * Fetches the saved code for a problem slug or template from the backend database.
 */
export const fetchCloudCode = async (slug: string, showToast: boolean = true): Promise<string | null> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return null;

        const auth = await getAuthHeaders();
        if (!auth) return null;

        const res = await fetch(`${API_BASE_URL}/code/${encodeURIComponent(slug)}`, {
            headers: auth.headers
        });

        if (res.status === 403) {
            handleDowngrade();
            return null;
        }

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        if (data && data.content) {
            lastSyncedCloudCode.set(slug, data.content);
            if (showToast && slug !== 'user_template') {
                toast.success('Loaded code from cloud!', { duration: 2000 });
            }
            return data.content;
        }

        return null;
    } catch (err: any) {
        console.error('[CloudCodeService] Failed to fetch code from cloud:', err);
        return null;
    }
};

/**
 * Gets the total number of problem codes saved in the cloud (excluding user_template).
 */
export const getCloudCodeCount = async (): Promise<number> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return 0;

        const auth = await getAuthHeaders();
        if (!auth) return 0;

        const res = await fetch(`${API_BASE_URL}/code/count`, {
            headers: auth.headers
        });

        if (res.status === 403) {
            handleDowngrade();
            return 0;
        }

        if (!res.ok) return 0;
        const data = await res.json();
        return data?.count || 0;
    } catch (err: any) {
        console.error('[CloudCodeService] Failed to get cloud code count:', err);
        return 0;
    }
};

/**
 * Deletes all saved problem codes from the cloud for the current user.
 */
export const deleteAllCloudCodes = async (): Promise<boolean> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        const auth = await getAuthHeaders();
        if (!auth) return false;

        const res = await fetch(`${API_BASE_URL}/code/all`, {
            method: 'DELETE',
            headers: auth.headers
        });

        if (res.status === 403) {
            handleDowngrade();
            return false;
        }

        if (res.ok) {
            lastSyncedCloudCode.clear();
            inFlightSaves.clear();
            return true;
        }

        return false;
    } catch (err: any) {
        console.error('[CloudCodeService] Failed to delete all cloud codes:', err);
        return false;
    }
};

/**
 * Saves a single code snippet or problem solution to the cloud database.
 */
export const saveCloudCode = async (slug: string, code: string): Promise<boolean> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        if (lastSyncedCloudCode.get(slug) === code) {
            return true;
        }

        // Deduplicate simultaneous saves (e.g. blur + tab-switch firing at once)
        const existingFlight = inFlightSaves.get(slug);
        if (existingFlight && existingFlight.code === code) {
            return existingFlight.promise;
        }

        const auth = await getAuthHeaders();
        if (!auth) return false;

        const performSave = async (): Promise<boolean> => {
            try {
                const res = await fetch(`${API_BASE_URL}/code/save`, {
                    method: 'POST',
                    headers: auth.headers,
                    body: JSON.stringify({ file_name: slug, content: code }),
                    keepalive: true
                });

                if (res.status === 403) {
                    handleDowngrade();
                    return false;
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    toast.error('Cloud Save Failed: ' + (err.error || 'Server error'));
                    return false;
                }

                lastSyncedCloudCode.set(slug, code);
                return true;
            } catch (err: any) {
                console.error('[CloudCodeService] Failed to save cloud code:', err);
                return false;
            } finally {
                inFlightSaves.delete(slug);
            }
        };

        const savePromise = performSave();
        inFlightSaves.set(slug, { code, promise: savePromise });
        return await savePromise;
    } catch (err: any) {
        console.error('[CloudCodeService] Failed to save cloud code:', err);
        return false;
    }
};

/**
 * Saves user template to the cloud.
 */
export const saveCloudTemplate = async (templateCode: string): Promise<boolean> => {
    const success = await saveCloudCode('user_template', templateCode);
    if (success) {
        toast.success('Successfully saved template to cloud!', { duration: 2000 });
    }
    return success;
};

/**
 * Fetches user default template from the cloud.
 */
export const fetchCloudTemplate = async (): Promise<string | null> => {
    return fetchCloudCode('user_template', false);
};

/**
 * Synchronizes editor and theme settings to the backend database.
 */
export const syncSettingsGroupToCloud = async (): Promise<boolean> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        const auth = await getAuthHeaders();
        if (!auth) return false;

        const data = await new Promise<any>((resolve) =>
            browserAPI.storage.local.get(['editorSettings', 'shortcutSettings', 'themeCustomSettings', 'changeUI'], resolve)
        );

        const settings = {
            editorSettings: data.editorSettings || JSON.parse(localStorage.getItem('editorSettings') || '{}'),
            shortcutSettings: data.shortcutSettings || JSON.parse(localStorage.getItem('shortcutSettings') || '{}'),
            themeCustomSettings: data.themeCustomSettings || JSON.parse(localStorage.getItem('themeCustomSettings') || '{}'),
            changeUI: data.changeUI || localStorage.getItem('changeUI') || 'true'
        };

        const res = await fetch(`${API_BASE_URL}/settings/sync`, {
            method: 'POST',
            headers: auth.headers,
            body: JSON.stringify({ settings })
        });

        if (res.status === 403) {
            handleDowngrade();
            return false;
        }

        return res.ok;
    } catch (e: any) {
        console.error('[CloudCodeService] Failed to sync settings to cloud:', e);
        return false;
    }
};

/**
 * Synchronizes custom snippets to the backend database.
 */
export const syncSnippetsToCloud = async (): Promise<boolean> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        const auth = await getAuthHeaders();
        if (!auth) return false;

        const data = await new Promise<any>((resolve) =>
            browserAPI.storage.local.get(['customSnippets'], resolve)
        );

        const snippets = data.customSnippets || JSON.parse(localStorage.getItem('customSnippets') || '{}');

        const res = await fetch(`${API_BASE_URL}/settings/sync`, {
            method: 'POST',
            headers: auth.headers,
            body: JSON.stringify({ snippets })
        });

        if (res.status === 403) {
            handleDowngrade();
            return false;
        }

        return res.ok;
    } catch (e: any) {
        console.error('[CloudCodeService] Failed to sync snippets to cloud:', e);
        return false;
    }
};

export const syncAllSettingsToCloud = async () => {
    await Promise.all([syncSettingsGroupToCloud(), syncSnippetsToCloud()]);
};

/**
 * Fetches settings and custom snippets from the backend database.
 */
export const fetchSettingsFromCloud = async () => {
    try {
        const auth = await getAuthHeaders();
        if (!auth) return null;

        const res = await fetch(`${API_BASE_URL}/settings`, {
            headers: auth.headers
        });

        if (res.status === 403) {
            handleDowngrade();
            return null;
        }

        if (!res.ok) return null;
        const data = await res.json();
        return data || null;
    } catch (err: any) {
        console.error('[CloudCodeService] Failed to fetch settings from cloud:', err);
        return null;
    }
};

/**
 * Pulls cloud settings and snippets from the database and applies them to local extension state.
 */
export const syncSettingsFromCloud = async () => {
    try {
        const data = await fetchSettingsFromCloud();
        if (data) {
            if (data.settings) {
                if (data.settings.editorSettings) {
                    useCFStore.getState().setEditorSettings({
                        ...useCFStore.getState().editorSettings,
                        ...data.settings.editorSettings
                    });
                }
                if (data.settings.shortcutSettings) {
                    useCFStore.getState().setShortcutSettings({
                        ...useCFStore.getState().shortcutSettings,
                        ...data.settings.shortcutSettings
                    });
                }
                if (data.settings.themeCustomSettings) {
                    localStorage.setItem('themeCustomSettings', JSON.stringify(data.settings.themeCustomSettings));
                    browserAPI.storage.local.set({ themeCustomSettings: data.settings.themeCustomSettings });
                }
                if (data.settings.changeUI) {
                    localStorage.setItem('changeUI', data.settings.changeUI);
                    browserAPI.storage.local.set({ changeUI: data.settings.changeUI });
                }
            }
            if (data.snippets) {
                useCFStore.getState().setCustomSnippets(data.snippets);
                localStorage.setItem('customSnippets', JSON.stringify(data.snippets));
                browserAPI.storage.local.set({ customSnippets: data.snippets });
            }
        }

        // Fetch user template from cloud and sync to local storage
        const storageRes = await new Promise<any>((resolve) =>
            browserAPI.storage.local.get(['isLoggedIn', 'isPlusUser'], resolve)
        );
        const isLoggedIn = useCFStore.getState().isLoggedIn || storageRes.isLoggedIn;
        const isPlusUser = useCFStore.getState().isPlusUser || storageRes.isPlusUser;

        if (isLoggedIn && isPlusUser) {
            const cloudTemplate = await fetchCloudTemplate();
            if (cloudTemplate) {
                localStorage.setItem('template', cloudTemplate);
                browserAPI.storage.local.set({ template: cloudTemplate });
            }
        }

        browserAPI.storage.local.set({ hasSyncedFromCloud: true });
    } catch (e) {
        console.error('[CloudCodeService] Failed to sync settings from cloud:', e);
    }
};
