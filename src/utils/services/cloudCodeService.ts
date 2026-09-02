import { supabaseClient as supabase } from '../supabaseClient';
import LZString from 'lz-string';
import { useCFStore } from '../../zustand/useCFStore';
import { toast } from 'sonner';
import { browserAPI } from '../browser/browserDetect';

let sessionPromise: Promise<any> | null = null;
const lastSyncedCloudCode = new Map<string, string>();

const getAuthenticatedSession = async () => {
    const store = useCFStore.getState();
    if (!store.isLoggedIn || !store.isPlusUser) return null;

    if (sessionPromise) return sessionPromise;
    sessionPromise = (async () => {
        try {
            // ALWAYS get the freshest session from Chrome Storage because other tabs/sidepanel might have refreshed it
            const storageRes = await new Promise<any>((resolve) => browserAPI.storage.local.get(['session'], resolve));
            const freshSession = storageRes.session;
            
            if (!freshSession) {
                return null;
            }

            // Sync Zustand with the freshest storage session
            useCFStore.getState().setSession(freshSession);

            const { data } = await supabase.auth.getSession();
            
            // If Supabase client already has this exact session, we're good
            if (data?.session?.access_token === freshSession.access_token) {
                return freshSession;
            }

            // Only manually setSession if Supabase client lost it but we still have tokens
            const { error, data: newSessionData } = await supabase.auth.setSession({
                access_token: freshSession.access_token,
                refresh_token: freshSession.refresh_token
            });

            if (error) {
                console.error("Failed to set Supabase session", error);
                return null;
            }
            
            if (newSessionData?.session) {
                useCFStore.getState().setSession(newSessionData.session);
                browserAPI.storage.local.set({ session: newSessionData.session });
                return newSessionData.session;
            }
            
            return freshSession;
        } catch (err) {
            console.error("Session error:", err);
            return null;
        } finally {
            sessionPromise = null;
        }
    })();
    return sessionPromise;
};

export const handleDowngrade = () => {
    if (useCFStore.getState().isPlusUser) {
        useCFStore.getState().setIsPlusUser(false);
        browserAPI.storage.local.set({ isPlusUser: false });
        toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
            duration: 5000,
        });
    }
};

/**
 * Fetches the compressed code from Supabase and decompresses it.
 * @param slug The problem slug (file_name)
 * @returns The decompressed code string, or null if not found.
 */
export const fetchCloudCode = async (slug: string): Promise<string | null> => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return null;

        const session = await getAuthenticatedSession();
        if (!session?.user) return null;

        const { data, error } = await supabase
            .from('files')
            .select('content, profiles(tier)')
            .eq('user_id', session.user.id)
            .eq('file_name', slug)
            .maybeSingle();

        if (error) {
            if (error.message && error.message.includes('row-level security policy')) {
                handleDowngrade();
            } else if (error.code !== 'PGRST116') {
                console.error("Fetch error:", error);
            }
            return null;
        }
        if (!data) return null;

        // Verify tier from database against local store state
        const profileTier = (data as any)?.profiles?.tier;
        if (profileTier) {
            if (profileTier !== 'plus' && useCFStore.getState().isPlusUser) {
                handleDowngrade();
                return null;
            } else if (profileTier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
                browserAPI.storage.local.set({ isPlusUser: true });
            }
        }

        // Return raw compressed payload for direct local storage write
        if (data.content) {
            lastSyncedCloudCode.set(slug, data.content);
            toast.success("Loaded code from cloud!", { duration: 2000 });
        }
        return data.content || null;
    } catch (err: any) {
        console.error("Failed to fetch from cloud", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return null;
    }
};

/**
 * Gets the total number of files saved in the cloud for the current user.
 * Excludes the user_template file.
 */
export const getCloudCodeCount = async (): Promise<number> => {
    try {
        const session = await getAuthenticatedSession();
        if (!session?.user) return 0;

        const { count, error } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .neq('file_name', 'user_template'); // Exclude template from count

        if (error) {
            if (error.message && error.message.includes('row-level security policy')) {
                handleDowngrade();
            }
            return 0;
        }
        return count || 0;
    } catch (err: any) {
        console.error("Failed to get cloud code count", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return 0;
    }
};

/**
 * Deletes all saved files from the cloud for the current user.
 */
export const deleteAllCloudCodes = async (): Promise<boolean> => {
    try {
        const session = await getAuthenticatedSession();
        if (!session?.user) return false;

        const { error } = await supabase
            .from('files')
            .delete()
            .eq('user_id', session.user.id);

        if (error) throw error;
        return true;
    } catch (err: any) {
        console.error("Failed to delete all cloud codes", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return false;
    }
};

/**
 * Saves the user's default template to the cloud.
 */
export const saveCloudTemplate = async (templateCode: string): Promise<boolean> => {
    try {
        const session = await getAuthenticatedSession();
        if (!session?.user) return false;

        const { data, error } = await supabase.from('files').upsert({
            user_id: session.user.id,
            file_name: 'user_template',
            content: templateCode,
        }, { onConflict: 'user_id, file_name' })
        .select('id, profiles(tier)')
        .single();

        if (error) throw error;

        // Verify tier from database against local store state
        const profileTier = (data as any)?.profiles?.tier;
        if (profileTier) {
            if (profileTier !== 'plus' && useCFStore.getState().isPlusUser) {
                handleDowngrade();
                return false;
            } else if (profileTier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
                browserAPI.storage.local.set({ isPlusUser: true });
            }
        }

        toast.success("Successfully saved template to cloud!", { duration: 2000 });
        return true;
    } catch (err: any) {
        console.error("Failed to save template to cloud", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return false;
    }
};

/**
 * Fetches the user's default template from the cloud.
 */
export const fetchCloudTemplate = async (): Promise<string | null> => {
    return fetchCloudCode('user_template');
};

/**
 * Saves a single code snippet to the cloud.
 */
export const saveCloudCode = async (slug: string, code: string): Promise<boolean> => {
    try {
        if (lastSyncedCloudCode.get(slug) === code) {
            return true;
        }

        const session = await getAuthenticatedSession();
        if (!session?.user) return false;

        const { data, error } = await supabase.from('files').upsert({
            user_id: session.user.id,
            file_name: slug,
            content: code,
        }, { onConflict: 'user_id, file_name' })
        .select('id, profiles(tier)')
        .single();

        if (error) throw error;

        // Verify tier from database against local store state
        const profileTier = (data as any)?.profiles?.tier;
        if (profileTier) {
            if (profileTier !== 'plus' && useCFStore.getState().isPlusUser) {
                handleDowngrade();
                return false;
            } else if (profileTier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
                browserAPI.storage.local.set({ isPlusUser: true });
            }
        }

        lastSyncedCloudCode.set(slug, code);
        console.log(`[Cloud Code] Successfully saved code for slug: ${slug}`);
        return true;
    } catch (err: any) {
        console.error("Failed to save cloud code", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        } else {
            toast.error("Cloud Save Failed: " + (err.message || JSON.stringify(err)));
        }
        return false;
    }
};

/**
 * Settings Synchronization Functions
 */
export const syncSettingsGroupToCloud = async () => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        const data = await new Promise<any>(resolve => browserAPI.storage.local.get(['editorSettings', 'shortcutSettings', 'themeCustomSettings', 'changeUI'], resolve));
        
        const settings = {
            editorSettings: data.editorSettings || JSON.parse(localStorage.getItem('editorSettings') || '{}'),
            shortcutSettings: data.shortcutSettings || JSON.parse(localStorage.getItem('shortcutSettings') || '{}'),
            themeCustomSettings: data.themeCustomSettings || JSON.parse(localStorage.getItem('themeCustomSettings') || '{}'),
            changeUI: data.changeUI || localStorage.getItem('changeUI') || 'true'
        };
        
        const session = await getAuthenticatedSession();
        if (!session) return false;
        
        const { data: resData, error } = await supabase.from('profiles').update({ settings }).eq('id', session.user.id).select('tier').single();
        if (error) throw error;
        
        if (resData?.tier !== 'plus' && useCFStore.getState().isPlusUser) {
            handleDowngrade();
            return false;
        } else if (resData?.tier === 'plus' && !useCFStore.getState().isPlusUser) {
            useCFStore.getState().setIsPlusUser(true);
            browserAPI.storage.local.set({ isPlusUser: true });
        }

        console.log(`[Settings] Synced settings group to cloud`);
        return true;
    } catch (e: any) {
        console.error("Failed to sync settings to cloud", e);
        if (e.message && e.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return false;
    }
};

export const syncSnippetsToCloud = async () => {
    try {
        const store = useCFStore.getState();
        if (!store.isLoggedIn || !store.isPlusUser) return false;

        const data = await new Promise<any>(resolve => browserAPI.storage.local.get(['customSnippets'], resolve));
        const snippets = data.customSnippets || JSON.parse(localStorage.getItem('customSnippets') || '{}');
        
        const session = await getAuthenticatedSession();
        if (!session) return false;
        
        const { data: resData, error } = await supabase.from('profiles').update({ snippets }).eq('id', session.user.id).select('tier').single();
        if (error) throw error;
        
        if (resData?.tier !== 'plus' && useCFStore.getState().isPlusUser) {
            handleDowngrade();
            return false;
        } else if (resData?.tier === 'plus' && !useCFStore.getState().isPlusUser) {
            useCFStore.getState().setIsPlusUser(true);
            browserAPI.storage.local.set({ isPlusUser: true });
        }

        console.log(`[Settings] Synced snippets to cloud`);
        return true;
    } catch (e: any) {
        console.error("Failed to sync snippets to cloud", e);
        if (e.message && e.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return false;
    }
};

export const syncAllSettingsToCloud = async () => {
    await Promise.all([
        syncSettingsGroupToCloud(),
        syncSnippetsToCloud()
    ]);
};

export const fetchSettingsFromCloud = async () => {
    const session = await getAuthenticatedSession();
    if (!session) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('settings, snippets, tier')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            if (data.tier !== 'plus' && useCFStore.getState().isPlusUser) {
                handleDowngrade();
                return null;
            } else if (data.tier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
                browserAPI.storage.local.set({ isPlusUser: true });
            }
        }
        return data;
    } catch (err: any) {
        console.error("Failed to fetch settings from cloud", err);
        if (err.message && err.message.includes('row-level security policy')) {
            handleDowngrade();
        }
        return null;
    }
};

export const syncSettingsFromCloud = async () => {
    try {
        const data = await fetchSettingsFromCloud();
        if (data) {
            if (data.settings) {
                if (data.settings.editorSettings) {
                    useCFStore.getState().setEditorSettings({ ...useCFStore.getState().editorSettings, ...data.settings.editorSettings });
                }
                if (data.settings.shortcutSettings) {
                    useCFStore.getState().setShortcutSettings({ ...useCFStore.getState().shortcutSettings, ...data.settings.shortcutSettings });
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
            console.log("[Settings] Successfully fetched and applied settings from cloud", data);
        }

        // Fetch user template from cloud and sync to local storage
        if (useCFStore.getState().isLoggedIn && useCFStore.getState().isPlusUser) {
            const cloudTemplate = await fetchCloudTemplate();
            if (cloudTemplate) {
                localStorage.setItem('template', cloudTemplate);
                console.log("[Settings] Successfully fetched template from cloud");
            }
        }

        // Mark that we have successfully synced at least once in this browser
        browserAPI.storage.local.set({ hasSyncedFromCloud: true });
    } catch (e) {
        console.error("Failed to sync settings from cloud", e);
    }
};
