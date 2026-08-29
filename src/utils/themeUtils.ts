import { syncSettingsGroupToCloud } from './services/cloudCodeService';
import { browserAPI } from "./browser/browserDetect";

export interface ThemeSettings {
    brightness: number;
    contrast: number;
    eyeComfort: number;
    bgHex: string;
}

export const defaultThemeSettings: ThemeSettings = {
    brightness: 100,
    contrast: 100,
    eyeComfort: 0,
    bgHex: '#0f0f0f',
};

export const getThemeSettings = (): ThemeSettings => {
    const savedSettings = localStorage.getItem('themeCustomSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultThemeSettings;
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
    localStorage.setItem('themeCustomSettings', JSON.stringify(settings));
    browserAPI.storage.local.set({ themeCustomSettings: settings });
    syncSettingsGroupToCloud();
};

export const resetThemeSettings = (): ThemeSettings => {
    localStorage.setItem('themeCustomSettings', JSON.stringify(defaultThemeSettings));
    browserAPI.storage.local.set({ themeCustomSettings: defaultThemeSettings });
    syncSettingsGroupToCloud();
    return defaultThemeSettings;
};

export const applyThemeSettings = (settings: ThemeSettings): void => {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
                type: 'APPLY_CUSTOM_THEME',
                settings
            }, (response) => {
                if (browserAPI.runtime.lastError) {
                    console.log('Could not establish connection:', browserAPI.runtime.lastError.message);
                }
            });
        }
    });
};

