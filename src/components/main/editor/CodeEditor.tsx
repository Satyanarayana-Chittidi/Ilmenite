import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2.js';
import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js';
import { CodeEditorProps, EditorSettingsTypes, IVimEditor } from '../../../types/types';
import themesJSON from '../../../../themes/themelist.json';
import { useEditorSettings } from '../../../utils/hooks/useEditorSettings';
import { useCFStore } from '../../../zustand/useCFStore';
import { initVimMode } from 'monaco-vim';
import { saveCodeForSlug } from '../../../utils/services/storageService';
import { registerCustomSnippets } from '../../../utils/snippets/registerSnippets';
import { useCustomSnippets } from '../../../utils/hooks/useCustomSnippets';
import { loadCodeWithCursor } from '../../../utils/codeHandlers';

const editorStyle: React.CSSProperties = {
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
                    suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                    wordBasedSuggestions: editorSettings.autoSuggestions ? 'currentDocument' : 'off',
                      suggest: {
                          showKeywords: editorSettings.autoSuggestions,
                          showWords: editorSettings.autoSuggestions,
                          showSnippets: true,
                          showClasses: editorSettings.autoSuggestions,
                          showFunctions: editorSettings.autoSuggestions,
                          showVariables: editorSettings.autoSuggestions,
                          showConstants: editorSettings.autoSuggestions,
                          showConstructors: editorSettings.autoSuggestions,
                          showEnumMembers: editorSettings.autoSuggestions,
                          showEnums: editorSettings.autoSuggestions,
                          showEvents: editorSettings.autoSuggestions,
                          showFields: editorSettings.autoSuggestions,
                          showFiles: editorSettings.autoSuggestions,
                          showFolders: editorSettings.autoSuggestions,
                          showInterfaces: editorSettings.autoSuggestions,
                          showIssues: editorSettings.autoSuggestions,
                          showMethods: editorSettings.autoSuggestions,
                          showModules: editorSettings.autoSuggestions,
                          showOperators: editorSettings.autoSuggestions,
                          showProperties: editorSettings.autoSuggestions,
                          showReferences: editorSettings.autoSuggestions,
                          showStructs: editorSettings.autoSuggestions,
                          showTypeParameters: editorSettings.autoSuggestions,
                          showUnits: editorSettings.autoSuggestions,
                          showUsers: editorSettings.autoSuggestions,
                          showValues: editorSettings.autoSuggestions,
                          showColors: editorSettings.autoSuggestions
                      },
                    cursorSmoothCaretAnimation: editorSettings.cursorSmoothCaretAnimation,
                    cursorStyle: editorSettings.cursorStyle || 'line',
                });

                if (templateCode) {
                    loadCodeWithCursor(monacoInstanceRef.current, templateCode, isMainEditor);
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
            
            monacoInstanceRef.current.updateOptions({
                suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                wordBasedSuggestions: editorSettings.autoSuggestions ? 'currentDocument' : 'off',
                      suggest: {
                          showKeywords: editorSettings.autoSuggestions,
                          showWords: editorSettings.autoSuggestions,
                          showSnippets: true,
                          showClasses: editorSettings.autoSuggestions,
                          showFunctions: editorSettings.autoSuggestions,
                          showVariables: editorSettings.autoSuggestions,
                          showConstants: editorSettings.autoSuggestions,
                          showConstructors: editorSettings.autoSuggestions,
                          showEnumMembers: editorSettings.autoSuggestions,
                          showEnums: editorSettings.autoSuggestions,
                          showEvents: editorSettings.autoSuggestions,
                          showFields: editorSettings.autoSuggestions,
                          showFiles: editorSettings.autoSuggestions,
                          showFolders: editorSettings.autoSuggestions,
                          showInterfaces: editorSettings.autoSuggestions,
                          showIssues: editorSettings.autoSuggestions,
                          showMethods: editorSettings.autoSuggestions,
                          showModules: editorSettings.autoSuggestions,
                          showOperators: editorSettings.autoSuggestions,
                          showProperties: editorSettings.autoSuggestions,
                          showReferences: editorSettings.autoSuggestions,
                          showStructs: editorSettings.autoSuggestions,
                          showTypeParameters: editorSettings.autoSuggestions,
                          showUnits: editorSettings.autoSuggestions,
                          showUsers: editorSettings.autoSuggestions,
                          showValues: editorSettings.autoSuggestions,
                          showColors: editorSettings.autoSuggestions
                      },
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
    }, [theme, editorSettings]);

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



