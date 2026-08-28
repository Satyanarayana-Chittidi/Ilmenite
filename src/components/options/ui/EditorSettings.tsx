import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Settings, Palette, Eye } from 'lucide-react';
import PremiumSelect from '../../global/PremiumSelect';
import { useCFStore } from '../../../zustand/useCFStore';
import { CursorSmoothCaretAnimation, CursorStyle, EditorSettingsTypes, KeyBinding, LineNumber } from '../../../types/types';
import { useEditorSettings } from '../../../utils/hooks/useEditorSettings';
import CodeEditor from '../../main/editor/CodeEditor';
import * as monaco from 'monaco-editor';
import { PREVIEW_CODE } from '../../../data/constants';
import { formatCode } from '../../../utils/helper';

interface EditorSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    theme?: string;
}

const EditorSettings: React.FC<EditorSettingsProps> = ({ isOpen, onClose, theme }) => {
    const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const editorThemeList = useCFStore(state => state.editorThemeList);
    const editorSettings = useCFStore<EditorSettingsTypes>(state => state.editorSettings);
    const setEditorSettings = useCFStore(state => state.setEditorSettings);
    const { getEditorSettings, handleToggle, saveEditorSettings } = useEditorSettings(editorSettings, setEditorSettings);
    const language = useCFStore(state => state.language);
    const fontSize = useCFStore(state => state.fontSize);

    useEffect(() => {
        if (isOpen) {
            setEditorSettings(getEditorSettings());
        }
    }, [isOpen]);

    useEffect(() => {
        saveEditorSettings();
    }, [editorSettings]);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold dark:text-white text-black flex items-center gap-2">
                                <Code size={20} />
                                Editor Settings
                            </h2>
                            <motion.button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#333333] transition-colors group"
                                title="Close"
                                aria-label="Close"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X size={18} className="text-gray-700 dark:text-gray-300 transition-transform duration-300 group-hover:rotate-90" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6">
                            <div className="space-y-8">
                                {/* Editor Appearance Section */}
                                <section className="pb-6 border-b border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Palette size={18} className="text-blue-500" />
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Editor Appearance
                                        </h3>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Eye size={16} className="text-gray-500" />
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Live Preview
                                                </h4>
                                            </div>
                                        </div>
                                        <div className='w-full h-44'>
                                            <CodeEditor
                                                monacoInstanceRef={monacoInstanceRef}
                                                language={language}
                                                fontSize={fontSize}
                                                templateCode={PREVIEW_CODE}
                                                theme={theme}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                            Preview shows your selected current editor settings.
                                        </p>
                                    </div>

                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Indent Size</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Number of spaces for each indentation level
                                                </p>
                                            </div>
                                            <PremiumSelect
                                                value={String(editorSettings.indentSize || 4)}
                                                onChange={(val) => {
                                                    setEditorSettings({ ...editorSettings, indentSize: Number(val) })
                                                    formatCode(monacoInstanceRef, language);
                                                }}
                                                className="w-32"
                                                options={[
                                                    { value: "2", label: "2 spaces" },
                                                    { value: "4", label: "4 spaces" },
                                                    { value: "6", label: "6 spaces" },
                                                    { value: "8", label: "8 spaces" }
                                                ]}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Editor Theme</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Color scheme for the code editor
                                                </p>
                                            </div>
                                            <div className="relative inline-block w-full sm:w-auto">
                                                <PremiumSelect
                                                    value={editorSettings.theme}
                                                    onChange={(selected) => {
                                                        setEditorSettings({ ...editorSettings, theme: selected });
                                                    }}
                                                    className="w-full sm:w-48"
                                                    options={[
                                                        { value: "auto", label: "Auto (Sync with App)" },
                                                        { value: "default", label: "Default" },
                                                        { value: "vs-dark", label: "Dark" },
                                                        { value: "vs-light", label: "Light" },
                                                        { value: "hc-black", label: "High Contrast" },
                                                        ...Object.keys(editorThemeList).map((theme) => ({ value: theme, label: editorThemeList[theme as keyof typeof editorThemeList] }))
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Editor Features Section */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings size={18} className="text-blue-500" />
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Editor Features
                                        </h3>
                                    </div>

                                    <div className="flex flex-col space-y-3 mb-6">
                                        {/* Feature Toggle Item */}
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Auto Suggestions</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Show code suggestions and completions as you type
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer flex-shrink-0">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={editorSettings.autoSuggestions}
                                                        onChange={() => handleToggle('autoSuggestions')}
                                                    />
                                                    <div className={`block w-11 h-6 rounded-full transition-colors ${editorSettings.autoSuggestions ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editorSettings.autoSuggestions ? 'transform translate-x-5' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Minimap</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Show a condensed preview of the code on the right side
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer flex-shrink-0">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={editorSettings.minimap}
                                                        onChange={() => handleToggle('minimap')}
                                                    />
                                                    <div className={`block w-11 h-6 rounded-full transition-colors ${editorSettings.minimap ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editorSettings.minimap ? 'transform translate-x-5' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Line Wrapping</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Wrap long lines of code instead of horizontal scrolling
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer flex-shrink-0">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={editorSettings.lineWrapping}
                                                        onChange={() => handleToggle('lineWrapping')}
                                                    />
                                                    <div className={`block w-11 h-6 rounded-full transition-colors ${editorSettings.lineWrapping ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editorSettings.lineWrapping ? 'transform translate-x-5' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Line Numbers</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Controls the display of line numbers in the editor gutter.
                                                </p>
                                            </div>
                                            <PremiumSelect
                                                value={editorSettings.lineNumbers || "on"}
                                                onChange={(val) => {
                                                    setEditorSettings({ ...editorSettings, lineNumbers: val as LineNumber })
                                                }}
                                                className="w-32"
                                                options={[
                                                    { value: "on", label: "On" },
                                                    { value: "relative", label: "Relative" },
                                                    { value: "off", label: "Off" }
                                                ]}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Keybinding</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Keybinding to use in the editor
                                                </p>
                                            </div>
                                            <div className="relative inline-block w-full sm:w-auto">
                                                <PremiumSelect
                                                    value={editorSettings.keyBinding || "standard"}
                                                    onChange={(selected) => {
                                                        setEditorSettings({ ...editorSettings, keyBinding: selected as KeyBinding })
                                                    }}
                                                    className="w-full sm:w-32"
                                                    options={[
                                                        { value: "standard", label: "Standard" },
                                                        { value: "vim", label: "Vim" }
                                                    ]}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Cursor Smooth Caret Animation</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Controls whether the smooth caret animation should be enabled.
                                                </p>
                                            </div>
                                            <div className="relative inline-block w-full sm:w-auto">
                                                <PremiumSelect
                                                    value={editorSettings.cursorSmoothCaretAnimation || "off"}
                                                    onChange={(selected) => {
                                                        setEditorSettings({ ...editorSettings, cursorSmoothCaretAnimation: selected as CursorSmoothCaretAnimation })
                                                    }}
                                                    className="w-full sm:w-32"
                                                    options={[
                                                        { value: "on", label: "On" },
                                                        { value: "explicit", label: "Explicit" },
                                                        { value: "off", label: "Off" }
                                                    ]}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#222222] hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm">Cursor Style</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Controls the cursor style in the editor
                                                </p>
                                            </div>
                                            <PremiumSelect
                                                value={editorSettings.cursorStyle || "line"}
                                                onChange={(val) => {
                                                    setEditorSettings({ ...editorSettings, cursorStyle: val as CursorStyle })
                                                }}
                                                className="w-40"
                                                options={[
                                                    { value: "line", label: "Line" },
                                                    { value: "block", label: "Block" },
                                                    { value: "underline", label: "Underline" },
                                                    { value: "line-thin", label: "Line thin" },
                                                    { value: "block-outline", label: "Block outline" },
                                                    { value: "underline-thin", label: "Underline thin" }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#222222] px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                            <motion.button
                                onClick={() => onClose()}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
};

export default EditorSettings;

