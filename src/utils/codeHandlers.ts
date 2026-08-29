import * as monaco from 'monaco-editor';

export const loadCodeWithCursor = (editor: monaco.editor.IStandaloneCodeEditor | null, code: string, focusEditor: boolean = false) => {
    if (!editor) {
        // console.warn('Wait for the editor to be ready before loading code.');
        return;
    }

    const cursorPosition = code.indexOf('$0');
    
    let cleanedCode = code.replace(/\$0/g, '');

    const model = editor.getModel();
    if (model) {
        editor.pushUndoStop();
        editor.executeEdits('reset-code', [{
            range: model.getFullModelRange(),
            text: cleanedCode,
            forceMoveMarkers: true
        }]);
        editor.pushUndoStop();
    } else {
        editor.setValue(cleanedCode);
    }

    if (cursorPosition !== -1) {
        const textBeforeCursor = code.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length;
        const column = lines[lines.length - 1].length + 1;

        editor.setPosition({
            lineNumber: lineNumber,
            column: column
        });

        editor.revealPositionInCenter({
            lineNumber: lineNumber,
            column: column
        });
    }

    if (focusEditor) {
        editor.focus();
    }
};



