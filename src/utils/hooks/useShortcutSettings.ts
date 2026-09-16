import { syncSettingsGroupToCloud } from '../services/cloudCodeService';
import { useEffect } from 'react';
import { ShortcutSettings } from '../../types/types';
import { DEFAULT_SHORTCUT_SETTINGS } from '../../data/constants';

export const useShortcutSettings = (settings: ShortcutSettings, setSettings: (settings: ShortcutSettings) => void) => {
    const getShortcutSettings = (): ShortcutSettings => {
        try {
            const storedSettings = localStorage.getItem('shortcutSettings');
            if (storedSettings) {
                return { ...DEFAULT_SHORTCUT_SETTINGS, ...JSON.parse(storedSettings) };
            }
        } catch {
            console.error('Failed to parse shortcut settings');
        }
        return DEFAULT_SHORTCUT_SETTINGS;
    };

    const saveShortcutSettings = () => {
        localStorage.setItem('shortcutSettings', JSON.stringify(settings));
        syncSettingsGroupToCloud();
    };

    useEffect(() => {
        setSettings(getShortcutSettings());
    }, []);

    return { getShortcutSettings, saveShortcutSettings };
};

