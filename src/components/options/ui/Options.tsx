import { CircleCheck, CircleX, Code, Moon, Settings, SunMedium, Trash2, Keyboard, Scissors } from "lucide-react";
import { OptionsProps } from "../../../types/types";
import Option from "./Option";
import { useCFStore } from "../../../zustand/useCFStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ThemeCustomizer from "./ThemeCustomizer";
import { toast } from "sonner";
import EditorSettings from "./EditorSettings";
import ShortcutSettingsComponent from "./ShortcutSettings";
import SnippetSettings from "./SnippetSettings";
import AccountBar from "../../main/editor/AccountBar";

const ThemeToggleIcon = ({ isDark }: { isDark: boolean }) => {
    const color = isDark ? '#1e3a8a' : '#fde047'; // Moon is midnight blue, Sun is yellow
    return (
        <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isDark ? 40 : 90 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <mask id="moon-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <motion.circle
                    initial={false}
                    cx={isDark ? 12 : 30}
                    cy={isDark ? 4 : 0}
                    animate={{ 
                        cx: isDark ? 12 : 30, 
                        cy: isDark ? 4 : 0 
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    r="6"
                    fill="black"
                />
            </mask>
            <motion.circle
                initial={false}
                cx="12"
                cy="12"
                r={isDark ? 9 : 5}
                animate={{ r: isDark ? 9 : 5 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                fill={color}
                mask="url(#moon-mask)"
            />
            <motion.g
                initial={false}
                opacity={isDark ? 0 : 1}
                animate={{ opacity: isDark ? 0 : 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                stroke={color}
            >
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </motion.g>
        </motion.svg>
    );
};

const Options = ({ theme, setTheme, changeUI, setChangeUI, setOpenConfirmationPopup }: OptionsProps) => {
    const buttonClass = "w-9 h-9 rounded-xl bg-white/50 dark:bg-[#2a2a2a]/50 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-white/80 dark:hover:bg-[#3a3a3a]/80 transition-all duration-200 flex justify-center items-center shadow-sm";

    const currentUrl = useCFStore(state => state.currentUrl);
    const isWidePanel = useCFStore(state => state.isWidePanel);
    const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
    const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false);
    const [isShortcutSettingsOpen, setIsShortcutSettingsOpen] = useState(false);
    const [isSnippetSettingsOpen, setIsSnippetSettingsOpen] = useState(false);

    const handlOpenThemeCustomizer = () => {
        if (!currentUrl || (currentUrl && !currentUrl.includes('codeforces.com'))) {
            toast.error('You can only customize the theme while on Codeforces.');
            return;
        }
        setIsThemeCustomizerOpen(!isThemeCustomizerOpen);
    };

    useEffect(() => {
        if (isThemeCustomizerOpen && (!currentUrl || (currentUrl && !currentUrl.includes('codeforces.com')))) {
            toast.error('You can only customize the theme while on Codeforces.');
            setIsThemeCustomizerOpen(false);
        }
    }, [currentUrl]);

    return (
        <>
            <EditorSettings
                isOpen={isEditorSettingsOpen}
                onClose={() => setIsEditorSettingsOpen(false)}
                theme={theme}
            />
            <ShortcutSettingsComponent
                isOpen={isShortcutSettingsOpen}
                onClose={() => setIsShortcutSettingsOpen(false)}
            />
            <SnippetSettings
                isOpen={isSnippetSettingsOpen}
                onClose={() => setIsSnippetSettingsOpen(false)}
            />
            <div className="w-full py-4 max-w-3xl mx-auto">
                <div className={`grid gap-3 ${isWidePanel ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <AccountBar />
                    <Option 
                        title="Appearance"
                        expandedContent={isThemeCustomizerOpen && theme === 'dark' ? <ThemeCustomizer theme={theme} /> : null}
                    >
                        <div className="flex items-center gap-2">
                            {theme === 'dark' && (
                                <button
                                    onClick={() => handlOpenThemeCustomizer()}
                                    className={`relative ${buttonClass} group`}
                                    title="Advanced theme settings"
                                    aria-label="Theme settings"
                                >
                                    <div>
                                        <Settings className="transition-transform duration-300 group-hover:rotate-90" size={20} color="#ffffff" />
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                className={`${buttonClass} ${theme === 'light' ? 'hover:bg-[#1e3a8a]/40' : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'}`}
                                aria-label="Toggle theme"
                            >
                                <ThemeToggleIcon isDark={theme === 'light'} />
                            </button>
                        </div>
                    </Option>
                    <Option title="Editor Settings">
                        <button
                            onClick={() => setIsEditorSettingsOpen(true)}
                            className={buttonClass}
                            title="Editor settings"
                        >
                            <Code color={theme === 'light' ? "#111111" : "#ffffff"} />
                        </button>
                    </Option>

                    <Option title="Code Snippets">
                        <button
                            onClick={() => setIsSnippetSettingsOpen(true)}
                            className={`${buttonClass}`}
                            title="Code snippets"
                        >
                            <Scissors color={theme === 'light' ? "#111111" : "#ffffff"} />
                        </button>
                    </Option>

                    <Option title="Shortcut Settings">
                        <button
                            onClick={() => setIsShortcutSettingsOpen(true)}
                            className={`${buttonClass}`}
                            title="Shortcut settings"
                        >
                            <Keyboard color={theme === 'light' ? "#111111" : "#ffffff"} />
                        </button>
                    </Option>

                    <Option title="Change UI">
                        <button
                            onClick={() => setChangeUI(changeUI === 'true' ? 'false' : 'true')}
                            className={`${buttonClass}`}
                            aria-label="Toggle UI mode"
                        >
                            {changeUI === 'false'
                                ? <CircleX size={20} color="#ef4444" />
                                : <CircleCheck size={20} color="#22c55e" />
                            }
                        </button>
                    </Option>

                    <Option title="Delete Saved Codes">
                        <button
                            onClick={() => setOpenConfirmationPopup(true)}
                            className={`${buttonClass} hover:bg-red-100 dark:hover:bg-red-900/30`}
                            aria-label="Delete saved codes"
                        >
                            <Trash2 size={20} color="#ef4444" />
                        </button>
                    </Option>
                </div>
            </div>
        </>
    );
};

export default Options;
