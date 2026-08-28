import { syncAllSettingsToCloud } from '../services/cloudCodeService';
import { CustomSnippetsByLanguage } from "../../types/types";
import { browserAPI } from "../browser/browserDetect";
import { useCFStore } from "../../zustand/useCFStore";

export const useCustomSnippets = () => {
    const customSnippets = useCFStore(state => state.customSnippets);
    const setCustomSnippets = useCFStore(state => state.setCustomSnippets);

    const saveCustomSnippets = (newSnippets: CustomSnippetsByLanguage) => {
        setCustomSnippets(newSnippets);
        localStorage.setItem('customSnippets', JSON.stringify(newSnippets));
        browserAPI.storage.local.set({ customSnippets: newSnippets });
        syncAllSettingsToCloud();
    };

    return { customSnippets, saveCustomSnippets };
};
