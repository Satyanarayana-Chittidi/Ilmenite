import { create } from "zustand";
import { EditorSettingsTypes, TestCaseArray, ShortcutSettings, CustomSnippetsByLanguage } from "../types/types";
import themesJSON from '../../themes/themelist.json';
import { DEFAULT_EDITOR_SETTINGS, DEFAULT_SHORTCUT_SETTINGS } from "../data/constants";

interface CFStoreInterface {
    language: string;
    fontSize: number;
    currentUrl: string | null;
    currentSlug: string | null;
    totalSize: number;
    testCases: TestCaseArray;
    isRunning: boolean;
    isSubmitting: boolean;
    apiKey: string;
    editorThemeList: Record<string, string>;
    editorSettings: EditorSettingsTypes;
    shortcutSettings: ShortcutSettings;
    customSnippets: CustomSnippetsByLanguage;
    isWidePanel: boolean;
    
    // Setters
    setLanguage: (language: string) => void;
    setFontSize: (size: number) => void;
    setCurrentUrl: (url: string | null) => void;
    setCurrentSlug: (slug: string | null) => void;
    setTotalSize: (size: number) => void;
    setTestCases: (testCases: TestCaseArray) => void;
    setIsRunning: (isRunning: boolean) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    setApiKey: (apiKey: string) => void;
    setEditorThemeList: (editorThemeList: Record<string, string>) => void;
    setEditorSettings: (editorSettings: EditorSettingsTypes) => void;
    setShortcutSettings: (shortcutSettings: ShortcutSettings) => void;
    setCustomSnippets: (customSnippets: CustomSnippetsByLanguage) => void;
    setIsWidePanel: (isWide: boolean) => void;
    
    // Auth State
    isPlusUser: boolean;
    setIsPlusUser: (isPlus: boolean) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (isLogged: boolean) => void;
    email: string | null;
    setEmail: (email: string | null) => void;
    session: any | null;
    setSession: (session: any | null) => void;
    supabaseAvatar: string | null;
    setSupabaseAvatar: (url: string | null) => void;

    // Cloud Save State
    cloudCodeCount: number | null;
    setCloudCodeCount: (count: number | null) => void;
    cloudSaveStatus: 'idle' | 'saving' | 'saved';
    setCloudSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;

    // Live Contest State
    liveContestTime: string | null;
    setLiveContestTime: (time: string | null) => void;
    isLiveContest: boolean;
    setIsLiveContest: (isLive: boolean) => void;
}

export const useCFStore = create<CFStoreInterface>((set) => ({
    // Initial State
    language: localStorage.getItem('preferredLanguage') || 'cpp',
    fontSize: parseInt(localStorage.getItem('preferredFontSize') || '16', 10),
    currentUrl: null,
    currentSlug: null,
    totalSize: 0,
    testCases: { ErrorMessage: '', testCases: [] },
    isRunning: false,
    isSubmitting: false,
    apiKey: localStorage.getItem('judge0CEApiKey') || '',
    editorThemeList: themesJSON,
    editorSettings: { ...DEFAULT_EDITOR_SETTINGS, ...(JSON.parse(localStorage.getItem('editorSettings') ?? 'null') || {}) },
    shortcutSettings: { ...DEFAULT_SHORTCUT_SETTINGS, ...(JSON.parse(localStorage.getItem('shortcutSettings') ?? 'null') || {}) },
    customSnippets: JSON.parse(localStorage.getItem('customSnippets') ?? 'null') ?? {},
    isWidePanel: false,
    isPlusUser: localStorage.getItem('isPlusUser') === 'true', // load from local storage
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true', // Default to false unless explicitly true
    email: localStorage.getItem('email') || null,
    session: JSON.parse(localStorage.getItem('session') || 'null'),
    supabaseAvatar: localStorage.getItem('supabaseAvatar') || null,
    cloudCodeCount: null,
    cloudSaveStatus: 'idle',
    liveContestTime: null,
    isLiveContest: new URLSearchParams(window.location.search).get('isLive') === 'true',

    // Actions
    setLanguage: (language) => { localStorage.setItem('preferredLanguage', language); set({ language }); },
    setFontSize: (fontSize) => { localStorage.setItem('preferredFontSize', fontSize.toString()); set({ fontSize }); },
    setCurrentUrl: (currentUrl) => set({ currentUrl }),
    setCurrentSlug: (currentSlug) => set({ currentSlug }),
    setTotalSize: (totalSize) => set({ totalSize }),
    setTestCases: (testCases) => set({ testCases }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    setApiKey: (apiKey) => { localStorage.setItem('judge0CEApiKey', apiKey); set({ apiKey }); },
    setEditorThemeList: (editorThemeList) => set({ editorThemeList }),
    setEditorSettings: (editorSettings) => { localStorage.setItem('editorSettings', JSON.stringify(editorSettings)); set({ editorSettings }); },
    setShortcutSettings: (shortcutSettings) => { localStorage.setItem('shortcutSettings', JSON.stringify(shortcutSettings)); set({ shortcutSettings }); },
    setCustomSnippets: (customSnippets) => { localStorage.setItem('customSnippets', JSON.stringify(customSnippets)); set({ customSnippets }); },
    setIsWidePanel: (isWidePanel) => set({ isWidePanel }),
    setIsPlusUser: (isPlus) => { localStorage.setItem('isPlusUser', String(isPlus)); set({ isPlusUser: isPlus }) },
    setIsLoggedIn: (isLogged) => { localStorage.setItem('isLoggedIn', String(isLogged)); set({ isLoggedIn: isLogged }) },
    setEmail: (email) => { if(email) localStorage.setItem('email', email); else localStorage.removeItem('email'); set({ email }) },
    setSession: (session) => { if(session) localStorage.setItem('session', JSON.stringify(session)); else localStorage.removeItem('session'); set({ session }) },
    setSupabaseAvatar: (url) => { if(url) localStorage.setItem('supabaseAvatar', url); else localStorage.removeItem('supabaseAvatar'); set({ supabaseAvatar: url }) },
    setCloudCodeCount: (count) => set({ cloudCodeCount: count }),
    setCloudSaveStatus: (status) => set({ cloudSaveStatus: status }),
    setLiveContestTime: (time) => set({ liveContestTime: time }),
    setIsLiveContest: (isLive) => set({ isLiveContest: isLive })
}));

