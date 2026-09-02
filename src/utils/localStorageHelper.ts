import {toast} from "sonner";
import * as monaco from 'monaco-editor';
import { fetchCloudTemplate } from './services/cloudCodeService';
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

export const handleSaveTemplate = (editor: monaco.editor.IStandaloneCodeEditor | null) => {
    if (!editor) {
        toast.error("Editor not found!");
        return;
    }
    const editorValue = editor.getValue();
    const compressedTemplate = LZString.compressToUTF16(editorValue);
    localStorage.setItem("template", compressedTemplate);
    toast.success("Template saved!");
};

export const handleRefreshTemplate = async (editor: monaco.editor.IStandaloneCodeEditor | null) => {
    if (!editor) {
        toast.error("Editor not found!");
        return;
    }
    const isPlusUser = useCFStore.getState().isPlusUser;
    const isLoggedIn = useCFStore.getState().isLoggedIn;
    
    if (!isLoggedIn || !isPlusUser) {
        toast.error("Please sign in with a Plus account to sync cloud template.");
        return;
    }

    try {
        const cloudTemplate = await fetchCloudTemplate();
        if (cloudTemplate) {
            localStorage.setItem("template", cloudTemplate);
            const decompressed = LZString.decompressFromUTF16(cloudTemplate) || '';
            editor.setValue(decompressed);
            toast.success("Template refreshed from cloud!");
        } else {
            toast.info("No template found in cloud.");
        }
    } catch (error) {
        toast.error("Failed to fetch template from cloud.");
    }
};



