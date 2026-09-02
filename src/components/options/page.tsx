import { handleSaveTemplate, handleRefreshTemplate } from "../../utils/localStorageHelper";
import React, { useEffect, useRef, useState } from "react";
import { SettingsProps } from "../../types/types";
import Footer from "../global/Footer";
import DeleteCodesConfirmationPopup from "../global/popups/DeleteCodesConfirmationPopup";
import SettingsTopBar from "./ui/SettingsTopBar";
import { AuthForm } from '../auth/AuthForm';
import LZString from 'lz-string';
import Options from './ui/Options';
import CodeEditor from "../main/editor/CodeEditor";
import { useCFStore } from "../../zustand/useCFStore";
import * as monaco from 'monaco-editor';
import { browserAPI } from "../../utils/browser/browserDetect";
import { defaultThemeSettings } from "../../utils/themeUtils";
import { Save, RotateCcw } from "lucide-react";
import PremiumLockIcon from "../global/icons/PremiumLockIcon";
import UpgradePopup from "../global/popups/UpgradePopup";
// import ApiSettings from "../global/ApiSettings";

const Settings: React.FC<SettingsProps> = ({ setShowOptions, theme, setTheme }) => {
    console.log("Settings component rendered!");
    const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [changeUI, setChangeUI] = useState(localStorage.getItem('changeUI') || 'true');
    const [openConfirmationPopup, setOpenConfirmationPopup] = useState<boolean>(false);
    const [showUpgradePopup, setShowUpgradePopup] = useState<boolean>(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState<string>('');
    const language = useCFStore(state => state.language);
    const fontSize = useCFStore(state => state.fontSize);
    const isPlusUser = useCFStore(state => state.isPlusUser);


    useEffect(() => {
        const defaultSettingsRaw = localStorage.getItem('defaultThemeSettings');
        if (!defaultSettingsRaw) {
            localStorage.setItem('defaultThemeSettings', JSON.stringify(defaultThemeSettings));
            browserAPI.storage.local.set({ defaultThemeSettings: defaultThemeSettings });
        }

        const themeCustomSettings = localStorage.getItem('themeCustomSettings');
        if (!themeCustomSettings) {
            const initialSettings = defaultSettingsRaw ? JSON.parse(defaultSettingsRaw) : defaultThemeSettings;
            localStorage.setItem('themeCustomSettings', JSON.stringify(initialSettings));
            browserAPI.storage.local.set({ themeCustomSettings: initialSettings });
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        browserAPI.storage.local.set({ theme: theme });
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        browserAPI.storage.local.set({ changeUI: changeUI });
        localStorage.setItem('changeUI', changeUI);
    }, [changeUI]);

    return (
        <>
            <DeleteCodesConfirmationPopup
                openConfirmationPopup={openConfirmationPopup}
                setOpenConfirmationPopup={setOpenConfirmationPopup}
            />

            <div className="Settings-container w-full h-full flex flex-col items-center justify-center dark:bg-[#111111]">
                <SettingsTopBar theme={theme} setShowOptions={setShowOptions} />

                <div className="w-full h-full overflow-y-auto px-4">
                    <Options
                        theme={theme}
                        setTheme={setTheme}
                        changeUI={changeUI}
                        setChangeUI={setChangeUI}
                        setOpenConfirmationPopup={setOpenConfirmationPopup}
                    />
                    {/* <ApiSettings /> */}
                    <div className="mx-auto w-full max-w-3xl flex flex-col items-center gap-2 border-t-2 border-zinc-800">
                        <div className="self-center text-base text-zinc-700 font-semibold dark:text-zinc-200 flex justify-between w-full py-3">
                            <div className="flex flex-col gap-1">
                                <p className="text-xl font-semibold text-gray-800 dark:text-white">Set your default template</p>
                                <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-300 pr-4">Use symbol <span className="font-[500] px-2 rounded-md bg-gray-300 dark:bg-gray-600">$0</span> to set your default cursor position in template.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        if (!isPlusUser) {
                                            setUpgradeFeatureName("Cloud Template Sync");
                                            setShowUpgradePopup(true);
                                            return;
                                        }
                                        handleRefreshTemplate(monacoInstanceRef.current);
                                    }} 
                                    aria-label="Fetch cloud template" 
                                    title={isPlusUser ? "Fetch latest template from cloud" : "Cloud template sync is a Plus feature"}
                                    className={`group relative h-1/2 text-blue-500 text-sm px-2.5 py-1 font-bold rounded-lg gap-1 mt-1 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 flex justify-center items-center shadow-sm`}
                                >
                                    <div className={`flex items-center gap-1.5`}>
                                        <RotateCcw color="#3b82f6" size={15} />
                                        Refresh
                                    </div>
                                    {!isPlusUser && <PremiumLockIcon size={12} className="absolute -top-1 -right-1 text-amber-500" />}
                                </button>
                                <button 
                                    onClick={() => {
                                        handleSaveTemplate(monacoInstanceRef.current);
                                    }} 
                                    aria-label="Save template" 
                                    className={`group relative h-1/2 text-[#22c55e] text-sm px-2.5 py-1 font-bold rounded-lg gap-1 mt-1 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 flex justify-center items-center shadow-sm`}
                                >
                                    <div className={`flex items-center gap-1`}>
                                        <Save color="#22c55e" size={18} />
                                        Save
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="text-left mt-2 mb-20 w-full h-[28rem] relative">
                            <CodeEditor
                                monacoInstanceRef={monacoInstanceRef}
                                language={language}
                                fontSize={fontSize}
                                templateCode={LZString.decompressFromUTF16(localStorage.getItem('template') || '') || ''}
                                theme={theme}
                            />
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
            <UpgradePopup isOpen={showUpgradePopup} onClose={() => setShowUpgradePopup(false)} featureName={upgradeFeatureName || "Cloud Template Sync"} />
        </>
    );
};

export default React.memo(Settings);



