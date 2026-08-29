import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
    ThemeSettings,
    getThemeSettings,
    saveThemeSettings,
    resetThemeSettings,
    applyThemeSettings
} from '../../../utils/themeUtils';

interface ThemeCustomizerProps {
    theme: string;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ theme }) => {
    const sliderClass = "flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]";
    const rowClass = "flex items-center justify-between gap-4";
    const labelContainerClass = "w-44 flex-shrink-0";
    const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";

    const [settings, setSettings] = useState<ThemeSettings>(getThemeSettings());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newSettings = {
            ...settings,
            [name]: name === 'bgHex' ? value : parseInt(value)
        };
        setSettings(newSettings);
        saveThemeSettings(newSettings);
        applyThemeSettings(newSettings);
    };

    const handleBgSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        const hex = '#' + val.toString(16).padStart(2, '0').repeat(3);
        const newSettings = { ...settings, bgHex: hex };
        setSettings(newSettings);
        saveThemeSettings(newSettings);
        applyThemeSettings(newSettings);
    };

    const handleReset = () => {
        const defaultSettings = resetThemeSettings();
        setSettings(defaultSettings);
        applyThemeSettings(defaultSettings);
        toast.success('Theme settings reset to defaults');
    };

    useEffect(() => {
        if (theme === 'dark') {
            applyThemeSettings(settings);
        }
    }, [settings, theme]);

    const getSliderValue = (hex: string) => {
        if (!hex) return 0;
        let val = 15;
        if (hex.length === 7) {
            val = parseInt(hex.slice(1, 3), 16);
        } else if (hex.length === 4) {
            val = parseInt(hex.slice(1, 2) + hex.slice(1, 2), 16);
        }
        return isNaN(val) ? 0 : val;
    };

    return (
        <div className="w-full mt-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200">Advanced Appearance</h3>
                <button
                    onClick={handleReset}
                    title="Reset to defaults"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="space-y-5">
                <div className={rowClass}>
                    <div className={labelContainerClass}>
                        <span className={labelClass}>Brightness: {settings.brightness}%</span>
                    </div>
                    <input
                        type="range"
                        name="brightness"
                        min="50"
                        max="150"
                        value={settings.brightness}
                        onChange={handleChange}
                        className={sliderClass}
                    />
                </div>

                <div className={rowClass}>
                    <div className={labelContainerClass}>
                        <span className={labelClass}>Contrast: {settings.contrast}%</span>
                    </div>
                    <input
                        type="range"
                        name="contrast"
                        min="50"
                        max="150"
                        value={settings.contrast}
                        onChange={handleChange}
                        className={sliderClass}
                    />
                </div>

                <div className={rowClass}>
                    <div className={labelContainerClass}>
                        <span className={labelClass}>Eye Comfort Shield: {settings.eyeComfort}%</span>
                    </div>
                    <input
                        type="range"
                        name="eyeComfort"
                        min="0"
                        max="100"
                        value={settings.eyeComfort}
                        onChange={handleChange}
                        className={sliderClass}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className={labelClass}>Background Shade</span>
                        <input
                            type="text"
                            name="bgHex"
                            value={settings.bgHex}
                            onChange={handleChange}
                            className="w-24 px-2 py-1 text-sm border rounded bg-transparent dark:border-zinc-700 dark:text-white"
                            placeholder="#000000"
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="255"
                        value={getSliderValue(settings.bgHex)}
                        onChange={handleBgSliderChange}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer focus:outline-none"
                        style={{ background: 'linear-gradient(to right, #000000, #ffffff)' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizer;
