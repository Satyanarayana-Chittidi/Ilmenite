import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Options from './components/options/page';
import Main from './components/main/page';
import { browserAPI } from './utils/browser/browserDetect';
import { useCFStore } from './zustand/useCFStore';
import { getCloudCodeCount } from './utils/services/cloudCodeService';
import { Code2 } from 'lucide-react';
import DowngradePopup from './components/global/popups/DowngradePopup';
import { toast } from 'sonner';

const App = () => {
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const showOptionsRef = useRef(showOptions);
    const [theme, setTheme] = useState<"light" | "dark">((localStorage.getItem('theme') as "light" | "dark") || "dark");
    const [isCollapsed, setIsCollapsed] = useState<boolean>(window.innerWidth <= 45);
    const showDowngradePopup = useCFStore(state => state.showDowngradePopup);
    const setShowDowngradePopup = useCFStore(state => state.setShowDowngradePopup);

    const handleSetShowOptions = useCallback((val: boolean) => {
        showOptionsRef.current = val;
        setShowOptions(val);
    }, []);

    useEffect(() => {
        showOptionsRef.current = showOptions;
    }, [showOptions]);

    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth <= 45);
            if (window === window.parent) {
                const isWide = window.innerWidth > window.screen.width * 0.6;
                if (useCFStore.getState().isWidePanel !== isWide) {
                    useCFStore.getState().setIsWidePanel(isWide);
                }
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleStorageChange = (changes: any, areaName: string) => {
            if (areaName === "local" && changes.theme) {
                setTheme(changes.theme.newValue);
                localStorage.setItem('theme', changes.theme.newValue);
            }
            if (areaName === "local" && changes.isPlusUser !== undefined) {
                useCFStore.getState().setIsPlusUser(changes.isPlusUser.newValue);
                if (changes.isPlusUser.newValue === true) {
                    toast.success("Ilmenite Plus Activated!");
                    getCloudCodeCount().then(count => {
                        useCFStore.getState().setCloudCodeCount(count);
                    }).catch(err => console.error("Failed to fetch cloud code count", err));
                    import('./utils/services/cloudCodeService').then(module => {
                        module.syncSettingsFromCloud();
                    });
                }
            }
            if (areaName === "local" && changes.isLoggedIn !== undefined) {
                useCFStore.getState().setIsLoggedIn(changes.isLoggedIn.newValue);
            }
            if (areaName === "local" && changes.email !== undefined) {
                useCFStore.getState().setEmail(changes.email.newValue);
            }
            if (areaName === "local" && changes.session !== undefined) {
                useCFStore.getState().setSession(changes.session.newValue);
            }
            if (areaName === "local" && changes.supabaseAvatar !== undefined) {
                useCFStore.getState().setSupabaseAvatar(changes.supabaseAvatar.newValue);
            }
        };
        browserAPI.storage.onChanged.addListener(handleStorageChange);

        browserAPI.storage.local.get(['isPlusUser', 'isLoggedIn', 'email', 'session', 'supabaseAvatar'], (res) => {
            if (res.isPlusUser !== undefined) {
                useCFStore.getState().setIsPlusUser(res.isPlusUser);
            }
            if (res.isLoggedIn !== undefined) {
                useCFStore.getState().setIsLoggedIn(res.isLoggedIn);
            }
            if (res.email !== undefined) {
                useCFStore.getState().setEmail(res.email);
            }
            if (res.session !== undefined) {
                useCFStore.getState().setSession(res.session);
            }
            if (res.supabaseAvatar !== undefined) {
                useCFStore.getState().setSupabaseAvatar(res.supabaseAvatar);
            }

            if (res.isLoggedIn && res.isPlusUser) {
                getCloudCodeCount().then(count => {
                    useCFStore.getState().setCloudCodeCount(count);
                }).catch(err => console.error("Failed to fetch cloud code count", err));
            }
        });

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'TOGGLE_PLUS_USER') {
                useCFStore.getState().setIsPlusUser(event.data.isPlusUser);
            }
            if (event.data?.type === 'TOGGLE_LOGIN') {
                useCFStore.getState().setIsLoggedIn(event.data.isLoggedIn);
                if (event.data.email !== undefined) {
                    useCFStore.getState().setEmail(event.data.email);
                }
                if (event.data.session !== undefined) {
                    useCFStore.getState().setSession(event.data.session);
                }
                if (event.data.supabaseAvatar !== undefined) {
                    useCFStore.getState().setSupabaseAvatar(event.data.supabaseAvatar);
                }
            }
            if (event.data?.type === 'CF_WINDOW_METRICS') {
                const { panelWidth, windowWidth } = event.data.payload;
                const isWide = panelWidth > windowWidth * 0.6;
                if (useCFStore.getState().isWidePanel !== isWide) {
                    useCFStore.getState().setIsWidePanel(isWide);
                }
            }
        };
        window.addEventListener('message', handleMessage);

        // Request initial metrics from parent in case we missed the load event
        window.parent.postMessage({ type: 'CF_REQUEST_METRICS' }, '*');

        return () => {
            browserAPI.storage.onChanged.removeListener(handleStorageChange);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    if (isCollapsed) {
        return (
            <div className={`relative w-full h-full overflow-hidden border-l-2 dark:border-l-[1px] border-black dark:border-[#ccc] ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                <button
                    onClick={() => {
                        window.parent.postMessage({ type: 'CF_EXPAND_PANEL' }, '*');
                    }}
                    className="flex items-center justify-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer rounded-md"
                    style={{ 
                        transform: 'rotate(90deg)',
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: '0',
                        left: '36px',
                        width: 'max-content',
                        height: '32px',
                        padding: '0 12px'
                    }}
                >
                    <Code2 color={theme === 'light' ? '#22c55e' : '#4ade80'} size={20} />
                    <span className="font-bold text-gray-800 dark:text-gray-200 tracking-wide select-none">
                        <span className="font-serif tracking-normal">I</span>lmenite
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ minWidth: '420px' }}>
            {/* Vertical Separator rendered as left border */}
            <div className={`w-full h-full border-l-2 dark:border-l-[1px] border-black dark:border-[#ccc]`}>
                <Main showOptionsRef={showOptionsRef} setShowOptions={handleSetShowOptions} theme={theme} />
            </div>

            <div
                className={`z-[100] fixed top-0 right-0 h-full w-full max-w-full bg-white shadow-lg border-l-2 dark:border-l-[1px] border-black dark:border-[#ccc] transition-transform duration-300 ease-in-out transform ${showOptions ? 'translate-x-0' : 'translate-x-full'
                    } dark:bg-[#111111]`}
            >
                <Options
                    setShowOptions={handleSetShowOptions}
                    theme={theme}
                    setTheme={setTheme}
                />
            </div>

            <DowngradePopup 
                isOpen={showDowngradePopup} 
                onClose={() => setShowDowngradePopup(false)} 
            />
        </div>
    );
};

export default App;