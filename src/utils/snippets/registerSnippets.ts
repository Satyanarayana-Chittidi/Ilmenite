import * as monaco from 'monaco-editor';
import { CustomSnippet } from '../../types/types';

let currentSnippetProvider: monaco.IDisposable | null = null;
let registeredLanguage: string | null = null;

export const registerCustomSnippets = (
    monacoInstance: typeof monaco,
    language: string,
    snippets: CustomSnippet[]
) => {
    console.log(`[Autocomplete Log] registerCustomSnippets called for language '${language}' with ${snippets?.length || 0} snippets.`);
    
    // If we have an existing provider, dispose of it so we don't get duplicates when snippets or languages change
    if (currentSnippetProvider) {
        console.log(`[Autocomplete Log] Disposing of previous snippet provider.`);
        currentSnippetProvider.dispose();
        currentSnippetProvider = null;
    }

    if (!snippets || snippets.length === 0) {
        console.warn(`[Autocomplete Log] No snippets found for '${language}'. Returning early without registering provider.`);
        return;
    }

    console.log(`[Autocomplete Log] Registering CompletionItemProvider for language '${language}'...`);
    currentSnippetProvider = monacoInstance.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position) => {
            console.log(`[Autocomplete Log] provideCompletionItems triggered at Line ${position.lineNumber}, Col ${position.column}`);
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const snippetSuggestions = snippets.map((snippet) => ({
                label: snippet.keyword,
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText: snippet.code,
                insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: `Custom snippet for ${snippet.keyword}`,
                range: range,
            }));

            // Extract words from the current document to restore Monaco's native word suggestions
            // since registering a custom provider overrides the default wordBasedSuggestions provider
            const text = model.getValue();
            const words = text.match(/\b\w+\b/g) || [];
            const uniqueWords = Array.from(new Set(words));
            
            const wordSuggestions = uniqueWords
                .filter(w => w !== word.word) // Don't suggest the exact incomplete word being typed
                .map(w => ({
                    label: w,
                    kind: monacoInstance.languages.CompletionItemKind.Text,
                    insertText: w,
                    range: range
                }));

            const suggestions = [...snippetSuggestions, ...wordSuggestions];
            console.log(`[Autocomplete Log] Returning ${suggestions.length} suggestions (${snippetSuggestions.length} snippets, ${wordSuggestions.length} words)`);
            return { suggestions };
        },
    });
    console.log(`[Autocomplete Log] CompletionItemProvider successfully registered for '${language}'.`);

    registeredLanguage = language;
};



