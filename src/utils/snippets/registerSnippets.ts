import * as monaco from 'monaco-editor';
import { CustomSnippet } from '../../types/types';

let currentSnippetProvider: monaco.IDisposable | null = null;
let registeredLanguage: string | null = null;

export const registerCustomSnippets = (
    monacoInstance: typeof monaco,
    language: string,
    snippets: CustomSnippet[]
) => {
    // If we have an existing provider, dispose of it so we don't get duplicates when snippets or languages change
    if (currentSnippetProvider) {
        currentSnippetProvider.dispose();
        currentSnippetProvider = null;
    }

    if (!snippets || snippets.length === 0) {
        return;
    }

    // Register a new provider for the specific language
    currentSnippetProvider = monacoInstance.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = snippets.map((snippet) => ({
                label: snippet.keyword,
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText: snippet.code,
                insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: `Custom snippet for ${snippet.keyword}`,
                range: range,
            }));

            return { suggestions };
        },
    });

    registeredLanguage = language;
};

