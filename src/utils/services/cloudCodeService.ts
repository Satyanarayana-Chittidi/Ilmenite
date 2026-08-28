import { supabaseClient as supabase } from '../supabaseClient';
import LZString from 'lz-string';
import { useCFStore } from '../../zustand/useCFStore';
import { toast } from 'sonner';

const lastSyncedCloudCode = new Map<string, string>();

const getAuthenticatedSession = async () => {
    const session = useCFStore.getState().session;
    if (!session) return null;

    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token === session.access_token) {
        return session;
    }

    const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
    });

    if (error) {
        console.error("Failed to set Supabase session", error);
        toast.error("Auth Error: " + error.message);
        return null;
    }
    return session;
};

/**
 * Fetches the compressed code from Supabase and decompresses it.
 * @param slug The problem slug (file_name)
 * @returns The decompressed code string, or null if not found.
 */
export const fetchCloudCode = async (slug: string): Promise<string | null> => {
    try {
        const session = await getAuthenticatedSession();
        if (!session?.user) return null;

        const { data, error } = await supabase
            .from('files')
            .select('content, profiles(tier)')
            .eq('user_id', session.user.id)
            .eq('file_name', slug)
            .single();

        if (error) {
            if (error.message && error.message.includes('row-level security policy')) {
                if (useCFStore.getState().isPlusUser) {
                    useCFStore.getState().setIsPlusUser(false);
                    toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
                        duration: 5000,
                    });
                }
            }
            return null;
        }
        if (!data) return null;

        // Piggyback validation
        // @ts-ignore - Ignoring types since profiles is joined dynamically
        if (data.profiles) {
            if (data.profiles.tier !== 'plus' && useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(false);
                toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
                    duration: 5000,
                });
                return null;
            } else if (data.profiles.tier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
            }
        }

        // Return raw compressed payload for direct local storage write
        if (data.content) {
            lastSyncedCloudCode.set(slug, data.content);
            
        }
        return data.content || null;
    } catch (err) {
        console.error("Failed to fetch from cloud", err);
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

        if (error) return 0;
        return count || 0;
    } catch (err) {
        console.error("Failed to get cloud code count", err);
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
        // @ts-ignore
        if (!data || data.length === 0) { throw new Error('Update affected 0 rows. Check RLS policies.'); }
        return true;
    } catch (err) {
        console.error("Failed to delete all cloud codes", err);
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

        const { error } = await supabase.from('files').upsert({
            user_id: session.user.id,
            file_name: 'user_template',
            content: templateCode,
        }, { onConflict: 'user_id, file_name' });

        if (error) throw error;
        // @ts-ignore
        if (!data || data.length === 0) { throw new Error('Update affected 0 rows. Check RLS policies.'); }
        return true;
    } catch (err: any) {
        console.error("Failed to save template to cloud", err);
        if (err.message && err.message.includes('row-level security policy')) {
            if (useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(false);
                toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
                    duration: 5000,
                });
            }
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

        // Piggyback validation
        // @ts-ignore - Ignoring types since profiles is joined dynamically
        if (data?.profiles) {
            if (data.profiles.tier !== 'plus' && useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(false);
                toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
                    duration: 5000,
                });
                return false;
            } else if (data.profiles.tier === 'plus' && !useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(true);
            }
        }
        lastSyncedCloudCode.set(slug, code);
        
        return true;
    } catch (err: any) {
        console.error("Failed to save cloud code", err);
        if (err.message && err.message.includes('row-level security policy')) {
            if (useCFStore.getState().isPlusUser) {
                useCFStore.getState().setIsPlusUser(false);
                toast.error("Your subscription tier could not be verified. You have been downgraded to Free.", {
                    duration: 5000,
                });
            }
        } else {
            toast.error("Cloud Save Failed: " + (err.message || JSON.stringify(err)));
        }
        return false;
    }
};

export const saveSettingsToCloud = async (settings: any, snippets: any) => {
    const session = await getAuthenticatedSession();
    if (!session) return false;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ settings, snippets })
            .eq('id', session.user.id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            console.error("Failed to save to cloud: 0 rows updated. Check if the RLS policy allows UPDATE for profiles.");
            throw new Error("0 rows updated");
        }
        return true;
    } catch (err: any) {
        console.error("Failed to save settings to cloud", err.message, err.details, err.hint, err);
        return false;
    }
};

export const fetchSettingsFromCloud = async () => {
    const session = await getAuthenticatedSession();
    if (!session) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('settings, snippets')
            .eq('id', session.user.id)
            .single();

        if (error) throw error;
        return data;
    } catch (err: any) {
        console.error("Failed to fetch settings from cloud", err);
        return null;
    }
};

export const syncAllSettingsToCloud = async () => {
    try {
        const res = await browserAPI.storage.local.get('hasSyncedFromCloud');
        if (!res.hasSyncedFromCloud) {
            console.warn("Aborting syncAllSettingsToCloud because we haven't successfully fetched from cloud yet. This prevents overwriting cloud data with defaults.");
            return;
        }

        const editorSettings = JSON.parse(localStorage.getItem('editorSettings') || '{}');
        const shortcutSettings = JSON.parse(localStorage.getItem('shortcutSettings') || '{}');
        const themeCustomSettings = JSON.parse(localStorage.getItem('themeCustomSettings') || '{}');
        const changeUI = localStorage.getItem('changeUI') || 'true';
        
        const settings = {
            editorSettings,
            shortcutSettings,
            themeCustomSettings,
            changeUI
        };
        
        const snippets = JSON.parse(localStorage.getItem('customSnippets') || '{}');
        
        await saveSettingsToCloud(settings, snippets);
    } catch (e) {
        console.error("Failed to sync all settings to cloud", e);
    }
};

export const syncSettingsFromCloud = async () => {
    try {
        const data = await fetchSettingsFromCloud();
        if (data) {
            if (data.settings) {
                if (data.settings.editorSettings) {
                    useCFStore.getState().setEditorSettings(data.settings.editorSettings);
                }
                if (data.settings.shortcutSettings) {
                    useCFStore.getState().setShortcutSettings(data.settings.shortcutSettings);
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
                browserAPI.storage.local.set({ customSnippets: data.snippets });
            }
        }
        // Mark that we have successfully synced at least once in this browser
        browserAPI.storage.local.set({ hasSyncedFromCloud: true });
    } catch (e) {
        console.error("Failed to sync settings from cloud", e);
    }
};



