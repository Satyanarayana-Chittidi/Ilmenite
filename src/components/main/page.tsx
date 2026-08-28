import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useCFStore } from '../../zustand/useCFStore';
import { formatCode, getCodeMap, getSlug } from '../../utils/helper';
import TopBar from './editor/TopBar';
import TestCases from './testcases/TestCases';
import { ResizablePanel } from '../global/ResizablePanel';
import { useCodeExecution } from '../../utils/hooks/useCodeExecution';
import { useCodeManagement } from '../../utils/hooks/useCodeManagement';
import { useTestCases } from '../../utils/hooks/useTestCases';
import { useTabEvents } from '../../utils/hooks/useTabEvents';
import { handleSubmission } from '../../utils/services/submissionService';
import { initializeStorage } from '../../utils/services/storageService';
import { loadCodeWithCursor } from '../../utils/codeHandlers';
import { fetchCloudCode } from '../../utils/services/cloudCodeService';
import LZString from 'lz-string';
import { accessRestrictionMessage } from '../../data/constants';
import ApiLimitAlert from '../global/popups/ApiLimitAlert';
import { AuthForm } from '../auth/AuthForm';
const CodeEditor = React.lazy(() => import('./editor/CodeEditor'));
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { browserAPI } from '../../utils/browser/browserDetect';

interface MainProps {
    showOptionsRef: React.MutableRefObject<boolean>;
    setShowOptions: (show: boolean) => void;
    theme: string;
}

const Main: React.FC<MainProps> = ({ showOptionsRef, setShowOptions, theme }) => {
    
    const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    // Zustand store hooks
    const language = useCFStore(state => state.language);
    const fontSize = useCFStore(state => state.fontSize);
    const currentSlug = useCFStore(state => state.currentSlug);
    const setCurrentSlug = useCFStore(state => state.setCurrentSlug);
    const setCurrentUrl = useCFStore(state => state.setCurrentUrl);
    const setTotalSize = useCFStore(state => state.setTotalSize);
    const testCases = useCFStore(state => state.testCases);
    const isRunning = useCFStore(state => state.isRunning);
    const isSubmitting = useCFStore(state => state.isSubmitting);
    const setIsSubmitting = useCFStore(state => state.setIsSubmitting);

    // Custom hooks
    const { runCode, showApiLimitAlert, setShowApiLimitAlert } = useCodeExecution(monacoInstanceRef);
    const { handleResetCode, handleLanguageChange, handleFontSizeChange, handleRedirectToLatestSubmission } = useCodeManagement(monacoInstanceRef);
    const { loadTestCases, setupTestCaseListener } = useTestCases();
    const { handleTabEvents } = useTabEvents();
    const [isFormating, setIsFormating] = useState(false);
    const isPlusUser = useCFStore(state => state.isPlusUser);
    const isLoggedIn = useCFStore(state => state.isLoggedIn);
    const shortcutSettings = useCFStore((state: any) => state.shortcutSettings);
    const pressedKeysRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // We no longer open a login tab automatically since login is native.
    }, [isLoggedIn]);

    useEffect(() => {
        setTimeout(() => {
            setIsSubmitting(false);
        }, 3000);
    }, [isSubmitting, currentSlug]);

    useEffect(() => {
        const cleanup = setupTestCaseListener();
        const size = initializeStorage();
        setTotalSize(size);
        return cleanup;
    }, []);

    useEffect(() => {
        const getCurrentSlug = async () => {
            const urlParam = new URLSearchParams(window.location.search).get('url');
            if (urlParam) {
                const newSlug = getSlug(urlParam);
                setCurrentSlug(newSlug);
                setCurrentUrl(urlParam);
                if (newSlug) {
                    let codeForUrl = getCodeMap().get(newSlug)?.code || '';

                    if (!codeForUrl && useCFStore.getState().isPlusUser) {
                        const cloudCode = await fetchCloudCode(newSlug);
                        if (cloudCode) {
                            codeForUrl = cloudCode;
                            const currentMap = getCodeMap();
                            const slugQueue = getSlugQueue();
                            if (!currentMap.has(newSlug)) {
                                slugQueue.add(newSlug);
                            }
                            currentMap.set(newSlug, { code: cloudCode, size: cloudCode.length, timestamp: Date.now() });
                            try {
                                localStorage.setItem('codeMap', JSON.stringify(Array.from(currentMap.entries())));
                                localStorage.setItem('slugQueue', slugQueue.toJSON());
                            } catch (e) {
                                console.error("Local storage quota exceeded", e);
                            }
                        }
                    }

                    codeForUrl = codeForUrl === '' ? localStorage.getItem('template') || '' : codeForUrl;

                    if (codeForUrl) {
                        codeForUrl = LZString.decompressFromUTF16(codeForUrl) || '';
                    }

                    setTimeout(() => {
                        loadCodeWithCursor(monacoInstanceRef.current, codeForUrl, true);
                    }, 500);
                    loadTestCases({ slug: newSlug });
                }
            }
        };

        setTimeout(() => {
            getCurrentSlug();
        }, 100);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if(!showOptionsRef.current && currentSlug) {
                pressedKeysRef.current.add(e.key);
                handleShortcutActions(e);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            e;
            pressedKeysRef.current.clear();
        };

        const handleShortcutActions = (e: KeyboardEvent) => {
            const { run, submit , reset, format } = shortcutSettings;
            const keysArray = Array.from(pressedKeysRef.current);
            const shortcutString = keysArray.join(' + ');

            switch (shortcutString) {
                case run:
                    if(isRunning) return;
                    e.stopPropagation();
                    e.preventDefault();
                    runCode();
                    break;
                case submit:
                    if(isSubmitting) return;
                    e.stopPropagation();
                    e.preventDefault();
                    handleSubmission(monacoInstanceRef.current, setIsSubmitting, language, testCases);
                    break;
                case reset:
                    e.stopPropagation();
                    e.preventDefault();
                    handleResetCode();
                    break;
                case format:
                    if(isFormating) return;
                    e.stopPropagation();
                    e.preventDefault();
                    handleFormatCode();
                    break;
            }
        }

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
        };
    }, [currentSlug, runCode, handleSubmission]);

    useEffect(() => {
        if (monacoInstanceRef.current) {
            if (!currentSlug) {
                monacoInstanceRef.current.updateOptions({
                    readOnly: true
                });
            } else {
                monacoInstanceRef.current.updateOptions({
                    readOnly: false
                });
            }
        }
    }, [currentSlug, monacoInstanceRef.current]);

    const handleFormatCode = () => {
        formatCode(monacoInstanceRef, language,  setIsFormating);
    };

    // Native auth handled by AuthForm

    return (
        <div className='flex flex-col w-full h-screen justify-start items-center bg-[#f9f9f9] dark:bg-[#111111] overflow-hidden relative'>
            {!isLoggedIn && (
                <div className="absolute inset-0 z-[1000] backdrop-blur-md bg-white/40 dark:bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                    <AuthForm />
                </div>
            )}

            <ApiLimitAlert
                isOpen={showApiLimitAlert}
                setIsOpen={setShowApiLimitAlert}
            />

            <TopBar
                theme={theme as "light" | "dark"}
                handleClick={() => handleSubmission(monacoInstanceRef.current, setIsSubmitting, language, testCases)}
                setShowOptions={setShowOptions}
                language={language}
                handleLanguageChange={handleLanguageChange}
                fontSize={fontSize}
                handleFontSizeChange={handleFontSizeChange}
                handleResetCode={handleResetCode}
                handleRedirectToLatestSubmission={handleRedirectToLatestSubmission}
                currentSlug={currentSlug}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                runCode={runCode}
                testCases={testCases.testCases}
                isFormating={isFormating}
                handleFormatCode={handleFormatCode}
            />

            <div className="w-full flex-1 min-h-0 relative">
                <ResizablePanel
                    top={
                        <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-[#888] dark:text-[#ccc]">Loading Editor...</div>}>
                            <CodeEditor
                                monacoInstanceRef={monacoInstanceRef}
                                language={language}
                                fontSize={fontSize}
                                theme={theme}
                                isMainEditor={true}
                            />
                        </Suspense>
                    }
                    bottom={<TestCases />}
                    initialHeight={70}
                />
            </div>
        </div>
    );
};
export default React.memo(Main);
