import { Braces, ChartNoAxesGantt, CloudUpload, Code2, LoaderCircle, Play, RotateCcw, Settings, Wifi, WifiOff, X, Check, Save, Timer as TimerIcon } from 'lucide-react';
import PremiumSelect, { SelectOption } from '../../global/PremiumSelect';
import { ShortcutSettings, TopBarProps } from '../../../types/types';
import React, { useEffect, useState, useRef } from 'react';
import { useCFStore } from '../../../zustand/useCFStore';
import { normalizeShortcut } from '../../../utils/helper';
import Timer from './CodeTimer';
import { browserAPI } from '../../../utils/browser/browserDetect';
import PremiumLockIcon from '../../global/icons/PremiumLockIcon';
import UpgradePopup from '../../global/popups/UpgradePopup';

const TopBar: React.FC<TopBarProps> = ({
    theme,
    handleClick,
    setShowOptions,
    language,
    fontSize,
    handleLanguageChange,
    handleFontSizeChange,
    handleResetCode,
    handleRedirectToLatestSubmission,
    currentSlug,
    isRunning,
    isSubmitting,
    runCode,
    testCases,
    isFormating,
    handleFormatCode
}) => {

    const [showRunTooltip, setShowRunTooltip] = useState<boolean>(false);
    const [showSubmitTooltip, setShowSubmitTooltip] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [showStatusAnimation, setShowStatusAnimation] = useState<boolean>(false);
    const [statusText, setStatusText] = useState<string>('');
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const cloudSaveStatus = useCFStore(state => state.cloudSaveStatus);
    const isPlusUser = useCFStore(state => state.isPlusUser);
    const [showUpgradePopup, setShowUpgradePopup] = useState<boolean>(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState<string>('');
    const liveContestTime = useCFStore(state => state.liveContestTime);
    const isLiveContest = useCFStore(state => state.isLiveContest);
    const setLiveContestTime = useCFStore(state => state.setLiveContestTime);
    const setIsLiveContest = useCFStore(state => state.setIsLiveContest);
    
    const shortcutSettings = useCFStore(state => state.shortcutSettings);
    const [normalizedShortcutSettings, setNormalizedShortcutSettings] = useState<ShortcutSettings>({
        run: normalizeShortcut(shortcutSettings.run),
        submit: normalizeShortcut(shortcutSettings.submit),
        reset: normalizeShortcut(shortcutSettings.reset),
        format: normalizeShortcut(shortcutSettings.format),
    });
    const SHOW_DURATION_MS = 4000;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message && message.type === 'CF_LIVE_CONTEST_TIMER') {
                setLiveContestTime(message.payload.time);
                setIsLiveContest(message.payload.isLive);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setStatusText('Online');
            setShowStatusAnimation(true);

            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

            hideTimeoutRef.current = setTimeout(() => {
                setShowStatusAnimation(false);
            }, SHOW_DURATION_MS);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setStatusText('Offline');
            setShowStatusAnimation(true);

            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

            hideTimeoutRef.current = setTimeout(() => {
                setShowStatusAnimation(false);
            }, SHOW_DURATION_MS);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        setNormalizedShortcutSettings({
            run: normalizeShortcut(shortcutSettings.run),
            submit: normalizeShortcut(shortcutSettings.submit),
            reset: normalizeShortcut(shortcutSettings.reset),
            format: normalizeShortcut(shortcutSettings.format),
        });
    }, [shortcutSettings]);

    return (
        <>
            <style>{`
                @keyframes iconPop {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes slideInFromLeft {
                    0% {
                        transform: translateX(-20px);
                        opacity: 0;
                    }
                    100% {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutToLeft {
                    0% {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(-20px);
                        opacity: 0;
                    }
                }

                .status-container {
                    display: flex;
                    align-items: center;
                    min-width: 80px;
                    height: 28px;
                }

                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    z-index: 2;
                }

                .status-icon {
                    animation: iconPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                .status-text {
                    margin-left: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                    animation: slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    animation-delay: 0.2s;
                    opacity: 0;
                }

                .status-text.online {
                    color: #22c55e;
                }

                .status-text.offline {
                    color: #ef4444;
                }

                .status-container.hiding .status-icon {
                    animation: iconPop 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) reverse forwards;
                }

                .status-container.hiding .status-text {
                    animation: slideOutToLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .code-icon {
                    transition: opacity 0.2s ease-in-out;
                }

                .code-icon.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .top-bar-container {
                    position: relative;
                    width: 100%;
                }

                .center-buttons {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                }

                .left-section {
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }

                .right-section {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }
            `}</style>

            <div className='top-bar-container w-full flex border-b shrink-0 border-gray-500 h-[44px] relative bg-white dark:bg-[#111111]'>
                <div className='left-section flex items-center ml-2'>
                    <div className="flex items-center gap-1.5 cursor-pointer mr-3">
                        <Code2 color={theme === 'light' ? '#22c55e' : '#4ade80'} size={20} />
                        <span className="font-bold text-gray-800 dark:text-gray-200 tracking-wide select-none">
                            <span className="font-serif tracking-normal">I</span>lmenite
                        </span>
                    </div>

                    <div className="status-container">

                        {showStatusAnimation && (
                            <>
                                <div className="icon-wrapper">
                                    <span className="status-icon">
                                        {isOnline
                                            ? <Wifi size={18} color="#22c55e" aria-label="Online" />
                                            : <WifiOff size={18} color="#ef4444" aria-label="Offline" />
                                        }
                                    </span>
                                </div>
                                <span className={`status-text ${isOnline ? 'online' : 'offline'}`}>
                                    {statusText}
                                </span>
                            </>
                        )}

                        {!showStatusAnimation && !isOnline && (
                            <span
                                title={"Offline"}
                                className="flex items-center"
                            >
                                <WifiOff size={16} color="red" aria-label="Offline" />
                            </span>
                        )}
                    </div>
                </div>

                <div className='center-buttons'>
                    <div className="relative inline-flex shadow-sm">
                        <button
                            disabled={!currentSlug || isRunning || testCases.length === 0}
                            onClick={runCode}
                            onMouseEnter={() => setShowRunTooltip(true)}
                            onMouseLeave={() => setShowRunTooltip(false)}
                            className={`
                                ${(!currentSlug || testCases.length === 0) ? "opacity-50" : ""} 
                                ${(!currentSlug || isRunning || testCases.length === 0) ? "cursor-not-allowed" : ""}
                                h-7 px-3 relative
                                text-sm font-medium
                                ${isRunning 
                                    ? "bg-cyan-500 text-white dark:bg-cyan-400 dark:text-[#222222] z-10" 
                                    : "bg-[#E7E7E7] dark:bg-[#222222] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-400 dark:hover:text-[#222222] hover:z-10"}
                                rounded-l-md
                                border-r border-[#666666]
                                flex items-center gap-1
                                transition-all duration-300
                            `}
                        >
                            {isRunning ?
                                <LoaderCircle className="animate-spin w-4 h-4" /> :
                                <>
                                    <Play fill="currentColor" className="w-4 h-4" />
                                    <span>Run</span>
                                </>
                            }
                        </button>

                        {showRunTooltip && (
                            <div
                                role="tooltip"
                                className="absolute left-1/2 -translate-x-1/2 mt-8 z-50 inline-flex items-center justify-center
                                        px-2 py-1 rounded-lg text-xs text-black dark:text-white bg-gray-200 dark:bg-[#222222]
                                        shadow-lg min-w-max max-w-[90vw] whitespace-normal break-words"
                            >
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                {normalizedShortcutSettings.run.split('+').map((key, index, arr) => (
                                    <React.Fragment key={index}>
                                    <kbd className="border border-gray-600 rounded px-1 text-[11px] font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}</kbd>
                                    {index < arr.length - 1 && <span className="mx-0.5 text-xs">+</span>}
                                    </React.Fragment>
                                ))}
                                </div>
                            </div>
                        )}

                        <button
                            disabled={!currentSlug || isSubmitting}
                            onClick={handleClick}
                            onMouseEnter={() => setShowSubmitTooltip(true)}
                            onMouseLeave={() => setShowSubmitTooltip(false)}
                            className={`
                                ${!currentSlug ? "opacity-50" : ""} 
                                ${(!currentSlug || isSubmitting) ? "cursor-not-allowed" : ""}
                                h-7 px-3 relative
                                text-sm font-medium
                                ${isSubmitting 
                                    ? "bg-green-600 text-white dark:bg-green-500 dark:text-[#222222] z-10" 
                                    : "bg-[#E7E7E7] dark:bg-[#222222] text-green-600 dark:text-green-500 hover:bg-green-600 hover:text-white dark:hover:bg-green-500 dark:hover:text-[#222222] hover:z-10"}
                                rounded-r-md
                                flex items-center gap-1
                                transition-all duration-300
                            `}
                        >
                            {isSubmitting ?
                                <LoaderCircle className="animate-spin w-4 h-4" /> :
                                <>
                                    <CloudUpload className="w-4 h-4" />
                                    <span>Submit</span>
                                </>
                            }
                        </button>

                        {showSubmitTooltip && (
                            <div
                                role="tooltip"
                                className="absolute left-1/2 -translate-x-1/2 mt-8 z-50 inline-flex items-center justify-center
                                        px-2 py-1 rounded-lg text-xs text-black dark:text-white bg-gray-200 dark:bg-[#222222]
                                        shadow-lg min-w-max max-w-[90vw] whitespace-normal break-words"
                            >
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                {normalizedShortcutSettings.submit.split('+').map((key, index, arr) => (
                                    <React.Fragment key={index}>
                                    <kbd className="border border-gray-600 rounded px-1 text-[11px] font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}</kbd>
                                    {index < arr.length - 1 && <span className="mx-0.5 text-xs">+</span>}
                                    </React.Fragment>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className='right-section flex items-center gap-2'>
                    <div className='cursor-pointer flex justify-center items-center group' onClick={() => setShowOptions(true)}>
                        <Settings className="transition-transform duration-300 group-hover:rotate-90" color={theme === 'light' ? '#444444' : '#ffffff'} size={18} />
                    </div>
                    <div 
                        className='cursor-pointer flex justify-center items-center p-1 rounded hover:bg-red-500 transition-colors group'
                        onClick={() => {
                            window.parent.postMessage({ type: 'CLOSE_CF_ILMENITE_IFRAME' }, '*');
                        }}
                    >
                        <X className="group-hover:text-white transition-transform duration-300 group-hover:rotate-90" color={theme === 'light' ? '#444444' : '#ffffff'} size={18} />
                    </div>
                </div>
            </div>

            <div className='w-full bg-white dark:bg-[#111111] relative z-20'>
                <div className='w-[100vw] flex items-center justify-between gap-2 py-2 px-2'>
                    <div className='flex items-center gap-2 shrink-0'>
                        {/* Language Selector */}
                        <PremiumSelect
                            disabled={!currentSlug}
                            value={language}
                            onChange={(val) => handleLanguageChange({ target: { value: val } } as any)}
                            className={`w-[100px] shrink-0 ${!currentSlug && "cursor-not-allowed opacity-70"}`}
                            options={[
                                { value: "cpp", label: "C++" },
                                { value: "java", label: "Java" },
                                { value: "python", label: "Python" },
                                { value: "pypy", label: "PyPy" },
                                { value: "javascript", label: "Node.js" },
                                { value: "kotlin", label: "Kotlin" },
                                { value: "go", label: "Go" },
                                { value: "rust", label: "Rust" },
                                { value: "ruby", label: "Ruby" }
                            ]}
                        />

                        {/* Font Size Selector */}
                        <PremiumSelect
                            disabled={!currentSlug}
                            value={String(fontSize)}
                            onChange={(val) => handleFontSizeChange({ target: { value: val } } as any)}
                            className={`w-[68px] shrink-0 ${!currentSlug && "cursor-not-allowed opacity-70"}`}
                            options={[
                                { value: "12", label: "12px" },
                                { value: "13", label: "13px" },
                                { value: "14", label: "14px" },
                                { value: "15", label: "15px" },
                                { value: "16", label: "16px" },
                                { value: "17", label: "17px" },
                                { value: "18", label: "18px" },
                                { value: "19", label: "19px" },
                                { value: "20", label: "20px" }
                            ]}
                        />

                        {/* Cloud Save Status Indicator (Plus) / Locked Save Button (Free) */}
                        {!isPlusUser ? (
                            <button
                                onClick={() => {
                                    setUpgradeFeatureName("Cloud Code Sync");
                                    setShowUpgradePopup(true);
                                }}
                                title="Cloud saving is a Plus feature"
                                aria-label="Cloud saving"
                                className="relative shrink-0 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all h-7 w-7 rounded-full flex items-center justify-center cursor-pointer group"
                            >
                                <Save color={theme === 'light' ? '#111111' : '#ffffff'} size={14} />
                                <PremiumLockIcon size={11} className="absolute -top-1 -right-1 text-amber-500" />
                            </button>
                        ) : (
                            cloudSaveStatus !== 'idle' && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                    {cloudSaveStatus === 'saving' ? (
                                        <>
                                            <LoaderCircle size={14} className="animate-spin text-blue-500" />
                                            <span className="font-medium animate-pulse">Saving to cloud...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="text-green-500" />
                                            <span className="text-green-500 font-medium">Saved to cloud</span>
                                        </>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                        {/* Timer */}
                        <div className={`flex items-center cursor-pointer shrink-0`}>
                            {isLiveContest ? (
                                <div className="cursor-default flex items-center bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm h-7 rounded-lg transition-all duration-200 pl-1.5 pr-2">
                                    <div className="flex items-center justify-center rounded-full text-blue-500">
                                        <TimerIcon size={16} />
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-gray-400 dark:border-gray-500 pl-2 ml-1.5 h-full">
                                        <p className="text-black dark:text-zinc-100 whitespace-nowrap font-mono">{liveContestTime || '--:--:--'}</p>
                                    </div>
                                </div>
                            ) : (
                                <Timer theme={theme} />
                            )}
                        </div>
                        <button
                            disabled={!currentSlug || isFormating}
                            title={`Format Code\nShortcut: ${normalizedShortcutSettings.format}`}
                            className="relative shrink-0 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm h-7 w-7 rounded-lg flex items-center justify-center"
                        >
                            {isFormating ? (
                                <LoaderCircle color={theme === 'light' ? '#111111' : '#ffffff'} size={16} className={`animate-spin ${!currentSlug ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
                            ) : (
                                <ChartNoAxesGantt color={theme === 'light' ? '#111111' : '#ffffff'} size={16} className={`${!currentSlug ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={handleFormatCode} />
                            )}
                        </button>
                        <button
                            disabled={!currentSlug}
                            title='Latest Submission'
                            className="bg-zinc-200 shrink-0 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm h-7 w-7 rounded-lg flex items-center justify-center"
                        >
                            <Braces color={theme === 'light' ? '#111111' : '#ffffff'} size={16} className={`${!currentSlug ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={handleRedirectToLatestSubmission} />
                        </button>
                        <button
                            disabled={!currentSlug}
                            title={`Reset Code\nShortcut: ${normalizedShortcutSettings.reset}`}
                            className="bg-zinc-200 shrink-0 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm h-7 w-7 rounded-lg flex items-center justify-center"
                        >
                            <RotateCcw color={theme === 'light' ? '#111111' : '#ffffff'} size={16} className={`${!currentSlug ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={handleResetCode} />
                        </button>
                    </div>
                </div>
            </div>
            <UpgradePopup isOpen={showUpgradePopup} onClose={() => setShowUpgradePopup(false)} featureName={upgradeFeatureName || "Cloud Code Sync"} />
        </>
    )
}
export default TopBar
