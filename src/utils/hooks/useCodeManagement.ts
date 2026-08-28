import { useCFStore } from '../../zustand/useCFStore';
import { getValueFromLanguage } from '../helper';
import { loadCodeWithCursor } from '../codeHandlers';
import * as monaco from 'monaco-editor';
import { browserAPI } from '../browser/browserDetect';
import LZString from 'lz-string';

export const useCodeManagement = (monacoInstanceRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>) => {
    const setLanguage = useCFStore(state => state.setLanguage);
    const setFontSize = useCFStore(state => state.setFontSize);
    const currentSlug = useCFStore(state => state.currentSlug);

    const handleResetCode = () => {
        if (!currentSlug) {
            return;
        }
        const compressedTemplate = localStorage.getItem('template') || '';
        const temmplateCode = LZString.decompressFromUTF16(compressedTemplate) || '';
        loadCodeWithCursor(monacoInstanceRef.current, temmplateCode, true);
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLanguage = e.target.value;
        setLanguage(selectedLanguage);
        localStorage.setItem('preferredLanguage', selectedLanguage);
        const languageValue = getValueFromLanguage(selectedLanguage);

        let [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        browserAPI.scripting.executeScript(
            {
                target: { tabId: tab.id! },
                func: (languageValue) => {
                    const languageSelect = document.querySelector('select[name="programTypeId"]') as HTMLSelectElement;
                    if (languageSelect) {
                        languageSelect.value = languageValue;
                        const event = new Event('change', { bubbles: true });
                        languageSelect.dispatchEvent(event);
                    }
                },
                args: [languageValue],
            },
            () => browserAPI.runtime.lastError
        );
        if (monaco) {
            const isPlusUser = useCFStore.getState().isPlusUser;
            const autoSuggestions = useCFStore.getState().editorSettings.autoSuggestions;
            
            monaco.editor.getEditors().forEach(editor => {
                const model = editor.getModel();
                if (model) {
                    monaco.editor.setModelLanguage(model, selectedLanguage);
                }
                const cursorSmoothCaretAnimation = useCFStore.getState().editorSettings.cursorSmoothCaretAnimation;
                
                editor.updateOptions({
                    quickSuggestions: !isPlusUser ? false : autoSuggestions,
                    suggestOnTriggerCharacters: !isPlusUser ? false : autoSuggestions,
                    wordBasedSuggestions: !isPlusUser ? 'off' : (autoSuggestions ? 'currentDocument' : 'off'),
                    cursorSmoothCaretAnimation: !isPlusUser ? 'off' : cursorSmoothCaretAnimation,
                });
            });
        }

    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedFontSize = parseInt(e.target.value, 10);
        setFontSize(selectedFontSize);
        localStorage.setItem('preferredFontSize', selectedFontSize.toString());
        
        if (monaco) {
            const isPlusUser = useCFStore.getState().isPlusUser;
            const autoSuggestions = useCFStore.getState().editorSettings.autoSuggestions;
            const cursorSmoothCaretAnimation = useCFStore.getState().editorSettings.cursorSmoothCaretAnimation;
            
            monaco.editor.getEditors().forEach(editor => {
                editor.updateOptions({
                    fontSize: selectedFontSize,
                    quickSuggestions: !isPlusUser ? false : autoSuggestions,
                    suggestOnTriggerCharacters: !isPlusUser ? false : autoSuggestions,
                    wordBasedSuggestions: !isPlusUser ? 'off' : (autoSuggestions ? 'currentDocument' : 'off'),
                    cursorSmoothCaretAnimation: !isPlusUser ? 'off' : cursorSmoothCaretAnimation,
                });
            });
        }
    };

    const handleRedirectToLatestSubmission = async () => {
        if (!currentSlug) {
            return;
        }
        let [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

        browserAPI.scripting.executeScript(
            {
                target: { tabId: tab.id! },
                func: () => {
                    const anchor = document.querySelector('.roundbox.sidebox .rtable tbody tr td a') as HTMLAnchorElement;
                    if (!anchor) {
                        alert('No submission found');
                        return;
                    }
                    if (anchor) {
                        window.location.href = anchor.href;
                    }
                },
            },
            () => {
                if (browserAPI.runtime.lastError) {
                    console.error(browserAPI.runtime.lastError.message);
                }
            }
        );
    };


    return {
        handleResetCode,
        handleLanguageChange,
        handleFontSizeChange,
        handleRedirectToLatestSubmission
    };
};



