import {toast} from "sonner";
import * as monaco from 'monaco-editor';
import { saveCloudTemplate } from './services/cloudCodeService';
import { useCFStore } from '../zustand/useCFStore';
import LZString from 'lz-string';

export const deleteCodesFromLocalStorage = () => {
    try {
        localStorage.removeItem("slugQueue");
        localStorage.removeItem("codeMap");
        toast.success("Codes deleted successfully!");
    } catch (error) {
        toast.error("Failed to delete codes! Please try again later.");
    }
};

export const handleSaveTemplate = async (editor: monaco.editor.IStandaloneCodeEditor | null) => {
    if (!editor) {
        toast.error("Editor not found!");
        return;
    }
    const editorValue = editor.getValue();
    const compressedTemplate = LZString.compressToUTF16(editorValue);
    localStorage.setItem("template", compressedTemplate);
    

    const isPlusUser = useCFStore.getState().isPlusUser;
    const isLoggedIn = useCFStore.getState().isLoggedIn;
    if (isPlusUser && isLoggedIn) {
        await saveCloudTemplate(compressedTemplate);
    }
};



