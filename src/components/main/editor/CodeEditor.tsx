import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

import { CodeEditorProps, EditorSettingsTypes, IVimEditor } from '../../../types/types';
import themesJSON from '../../../../themes/themelist.json';
import { useEditorSettings } from '../../../utils/hooks/useEditorSettings';
import { useCFStore } from '../../../zustand/useCFStore';
import { initVimMode } from 'monaco-vim';
import { saveCodeForSlug } from '../../../utils/services/storageService';
import { registerCustomSnippets } from '../../../utils/snippets/registerSnippets';
import { useCustomSnippets } from '../../../utils/hooks/useCustomSnippets';

const editorStyle: React.CSSProperties = {
    height: '250px',
    flexGrow: 1,
};

const resolveTheme = (appTheme: string | undefined, editorTheme: string) => {
    if (editorTheme === 'auto') {
        return appTheme === 'light' ? 'vs-light' : 'vs-dark';
    }
    return editorTheme;
};

const CodeEditor = React.memo(({ monacoInstanceRef, language, fontSize, templateCode, theme, isMainEditor }: CodeEditorProps) => {
    const editorSettings = useCFStore((state) => state.editorSettings);
    const setEditorSettings = useCFStore((state) => state.setEditorSettings);
    const isPlusUser = useCFStore((state) => state.isPlusUser);
    const { getEditorSettings } = useEditorSettings(editorSettings, setEditorSettings);
    const editorRef = useRef<HTMLDivElement>(null);
    const vimStatusRef = useRef<HTMLDivElement>(null);
    const { customSnippets } = useCustomSnippets();

    useEffect(() => {
        if (monaco && language) {
            registerCustomSnippets(monaco, language, customSnippets[language] || []);
        }
    }, [language, customSnippets]);

    useEffect(() => {
        const loadThemes = async () => {
            for (const [themeKey, themeName] of Object.entries(themesJSON)) {
                try {
                    const themeData = await import(`../../../../themes/${themeName}.json`);
                    if (monaco) {
                        monaco.editor.defineTheme(themeKey, themeData.default);
                        // console.log(`Theme ${themeKey} loaded.`);
                    }
                } catch (error) {
                    // console.error(`Failed to load theme ${themeKey}:`, error);
                }
            }

            if (editorRef.current && !monacoInstanceRef.current) {
                const editorSettings:EditorSettingsTypes = getEditorSettings();
                console.log(`[Autocomplete Log] Creating Monaco instance. Initial autoSuggestions = ${editorSettings.autoSuggestions}`);
                monacoInstanceRef.current = monaco.editor.create(editorRef.current, {
                    language: language,
                    theme: resolveTheme(theme, editorSettings.theme),
                    fontSize: fontSize,
                    tabSize: editorSettings.indentSize,
                    automaticLayout: true,
                    readOnly: false,
                    wordWrap: editorSettings.lineWrapping ? 'on' : 'off',
                    minimap: {
                        enabled: editorSettings.minimap,
                        renderShadow: false,
                        size: 'proportional'
                    },
                    stickyScroll: {
                        enabled: false
                    },
                    scrollbar: {
                        vertical: 'hidden',
                        useShadows: false,
                        horizontalScrollbarSize: 8,
                        verticalScrollbarSize: 0,
                    },
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    overviewRulerLanes: 0,
                    lineNumbersMinChars: 4,
                    lineNumbers: editorSettings.lineNumbers,
                    suggestOnTriggerCharacters: editorSettings.autoSuggestions,
                    quickSuggestions: editorSettings.autoSuggestions,
                    wordBasedSuggestions: editorSettings.autoSuggestions ? 'currentDocument' : 'off',
                    cursorSmoothCaretAnimation: editorSettings.cursorSmoothCaretAnimation,
                    cursorStyle: editorSettings.cursorStyle || 'line',
                });

                if (templateCode) {
                    monacoInstanceRef.current.setValue(templateCode);
                }
            }

            if (monacoInstanceRef.current) {
                const vimEditor = monacoInstanceRef.current as IVimEditor;
                vimEditor.vimStatusRef = vimStatusRef;

                const currentKeyBinding = editorSettings.keyBinding;
                if(currentKeyBinding == "vim") {
                    vimEditor.vimMode = initVimMode(monacoInstanceRef.current, vimStatusRef.current);
                }
            }
        };

        loadThemes();

        return () => {
            if (monacoInstanceRef.current) {
                monacoInstanceRef.current.dispose();
                monacoInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (monacoInstanceRef.current && monaco) {
            monaco.editor.setTheme(resolveTheme(theme, editorSettings.theme));
            
            console.log(`[Autocomplete Log] CodeEditor useEffect: updating Monaco options. autoSuggestions = ${editorSettings.autoSuggestions}`);
            monacoInstanceRef.current.updateOptions({
                suggestOnTriggerCharacters: editorSettings.autoSuggestions,
                quickSuggestions: editorSettings.autoSuggestions,
                wordBasedSuggestions: editorSettings.autoSuggestions ? 'currentDocument' : 'off',
                cursorSmoothCaretAnimation: editorSettings.cursorSmoothCaretAnimation,
            });

            const vimEditor = monacoInstanceRef.current as any;
            const currentKeyBinding = editorSettings.keyBinding;
            if(currentKeyBinding == "vim") {
                if(!vimEditor.vimMode && vimEditor.vimStatusRef?.current) {
                    vimEditor.vimMode = initVimMode(monacoInstanceRef.current, vimEditor.vimStatusRef.current);
                }
            } else {
                if (vimEditor.vimMode) {
                    vimEditor.vimMode.dispose();
                    vimEditor.vimMode = null;
                }
            }
        }
    }, [theme, editorSettings, isPlusUser]);

    useEffect(() => {
        let debounceTimer: number | null = null;
        let disposable: monaco.IDisposable | null = null;

        const checkInterval = setInterval(() => {
            if (monacoInstanceRef.current) {
                clearInterval(checkInterval);
                
                disposable = monacoInstanceRef.current.onDidChangeModelContent(() => {
                    const slug = useCFStore.getState().currentSlug;
                    if (!slug) return;
                    
                    if (debounceTimer) window.clearTimeout(debounceTimer);
                    debounceTimer = window.setTimeout(() => {
                        const editor = monacoInstanceRef.current;
                        if (editor) {
                            saveCodeForSlug(slug, editor, useCFStore.getState().totalSize, useCFStore.getState().setTotalSize, false);
                        }
                    }, 1000);
                });

                monacoInstanceRef.current.onDidBlurEditorWidget(() => {
                    const slug = useCFStore.getState().currentSlug;
                    const editor = monacoInstanceRef.current;
                    if (slug && editor) {
                        saveCodeForSlug(slug, editor, useCFStore.getState().totalSize, useCFStore.getState().setTotalSize, true);
                    }
                });
            }
        }, 100);

        return () => {
            clearInterval(checkInterval);
            if (disposable) disposable.dispose();
            if (debounceTimer) window.clearTimeout(debounceTimer);
        };
    }, []);

    return (
        <div className={`flex flex-col h-full w-full`}>
            <div className={`relative h-full z-10 border-2 dark:border border-black dark:border-[#ccc] ${isMainEditor ? 'border-l-0 dark:border-l-0 w-[calc(100%-1px)]' : 'w-full'}`} ref={editorRef} style={editorStyle}></div>
            <div ref={vimStatusRef} />
        </div>
    );
});

export default CodeEditor;
