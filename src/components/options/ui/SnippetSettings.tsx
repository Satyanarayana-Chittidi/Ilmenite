import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, Plus, Trash2, Save } from 'lucide-react';
import { useCFStore } from '../../../zustand/useCFStore';
import { useCustomSnippets } from '../../../utils/hooks/useCustomSnippets';
import { CustomSnippet } from '../../../types/types';

interface SnippetSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const LANGUAGE_MAP: Record<string, string> = {
    cpp: 'C++',
    python: 'Python',
    java: 'Java',
    c: 'C',
    csharp: 'C#',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP'
};

const SnippetItem = ({
    snippet,
    onChange,
    onRemove,
    onSave
}: {
    snippet: CustomSnippet;
    onChange: (id: string, field: keyof CustomSnippet, value: string) => void;
    onRemove: (id: string) => void;
    onSave: () => void;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // We use a small timeout for onBlur so that if the user clicks the Save button,
    // the click handler fires before the blur hides the Save button.
    const handleBlur = (e: React.FocusEvent) => {
        // If the newly focused element is still inside this snippet container, ignore
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        
        setIsFocused(false);
        onSave();
    };

    return (
        <div 
            className="flex flex-col gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-zinc-800 transition-colors"
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            tabIndex={-1}
        >
            <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Keyword
                </label>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={snippet.keyword}
                            onChange={(e) => onChange(snippet.id, 'keyword', e.target.value)}
                            placeholder="e.g. sort"
                            className="w-full bg-white dark:bg-[#333] px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 rounded-md border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                    </div>
                    {isFocused ? (
                        <button
                            onMouseDown={(e) => {
                                // Prevent focus from shifting so we can handle save directly
                                e.preventDefault();
                                setIsFocused(false);
                                onSave();
                            }}
                            className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 flex justify-center items-center shadow-sm"
                            title="Save Snippet"
                        >
                            <Save size={20} color="#22c55e" />
                        </button>
                    ) : (
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onRemove(snippet.id);
                            }}
                            className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 flex justify-center items-center shadow-sm"
                            title="Remove Snippet"
                        >
                            <Trash2 size={20} color="#ef4444" />
                        </button>
                    )}
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code
                </label>
                <textarea
                    value={snippet.code}
                    onChange={(e) => onChange(snippet.id, 'code', e.target.value)}
                    placeholder="e.g. sort(${1:v}.begin(), ${1:v}.end());"
                    className="w-full font-mono bg-white dark:bg-[#333] px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 rounded-md border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none overflow-y-auto"
                    style={{
                        height: isFocused ? '10rem' : '2.5rem',
                        minHeight: isFocused ? '10rem' : '2.5rem'
                    }}
                />
            </div>
        </div>
    );
};

const SnippetSettings: React.FC<SnippetSettingsProps> = ({ isOpen, onClose }) => {
    const language = useCFStore(state => state.language);
    const { customSnippets, saveCustomSnippets } = useCustomSnippets();
    const [localSnippets, setLocalSnippets] = useState<CustomSnippet[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLocalSnippets(customSnippets[language] || []);
        }
    }, [isOpen, language, customSnippets]);

    const handleAddSnippet = () => {
        setLocalSnippets([
            ...localSnippets,
            { id: Date.now().toString(), keyword: '', code: '' }
        ]);
    };

    const handleRemoveSnippet = (id: string) => {
        const updated = localSnippets.filter(s => s.id !== id);
        setLocalSnippets(updated);
        saveChangesToStore(updated);
    };

    const handleChangeSnippet = (id: string, field: keyof CustomSnippet, value: string) => {
        setLocalSnippets(localSnippets.map(s => 
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const saveChangesToStore = (snippetsToSave: CustomSnippet[]) => {
        const validSnippets = snippetsToSave.filter(s => s.keyword.trim() !== '' && s.code.trim() !== '');
        const newSnippets = {
            ...customSnippets,
            [language]: validSnippets
        };
        saveCustomSnippets(newSnippets);
    };

    const handleSaveOnBlur = () => {
        saveChangesToStore(localSnippets);
    };

    const handleClose = () => {
        saveChangesToStore(localSnippets);
        onClose();
    };

    const displayLanguage = LANGUAGE_MAP[language] || language;

    return (
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
                            <div>
                                <h2 className="text-xl font-bold dark:text-white text-black flex items-center gap-2">
                                    <Scissors size={20} />
                                    Code Snippets
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Editing snippets for <span className="font-semibold text-blue-500">{displayLanguage}</span>
                                </p>
                            </div>
                            <motion.button
                                onClick={handleClose}
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
                            <div className="space-y-4">
                                {localSnippets.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No snippets defined for {displayLanguage}. Click 'Add Snippet' to create one.
                                    </div>
                                ) : (
                                    localSnippets.map((snippet) => (
                                        <SnippetItem
                                            key={snippet.id}
                                            snippet={snippet}
                                            onChange={handleChangeSnippet}
                                            onRemove={handleRemoveSnippet}
                                            onSave={handleSaveOnBlur}
                                        />
                                    ))
                                )}
                            </div>
                            <button
                                onClick={handleAddSnippet}
                                className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors w-full justify-center border border-dashed border-blue-300 dark:border-blue-800"
                            >
                                <Plus size={16} />
                                Add Snippet
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#222222] px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                            <motion.button
                                onClick={handleClose}
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
    );
};

export default SnippetSettings;
