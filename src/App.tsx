import { useState, useEffect, useRef } from 'react';
import './App.css';
import Options from './components/options/page';
import Main from './components/main/page';
import { browserAPI } from './utils/browser/browserDetect';
import { useCFStore } from './zustand/useCFStore';

const App = () => {
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const showOptionsRef = useRef(showOptions);
    useEffect(() => {
        showOptionsRef.current = showOptions;
    }, [showOptions]);

    const [theme, setTheme] = useState<"light" | "dark">((localStorage.getItem('theme') as "light" | "dark") || "dark");

    useEffect(() => {
        const handleStorageChange = (changes: any, areaName: string) => {
            if (areaName === "local" && changes.theme) {
                setTheme(changes.theme.newValue);
                localStorage.setItem('theme', changes.theme.newValue);
            }
            if (areaName === "local" && changes.isPlusUser !== undefined) {
                useCFStore.getState().setIsPlusUser(changes.isPlusUser.newValue);
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
        };
        window.addEventListener('message', handleMessage);

        return () => {
            browserAPI.storage.onChanged.removeListener(handleStorageChange);
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Vertical Separator rendered as left border */}
            <div className={`w-full h-full border-l-2 dark:border-l-[1px] border-black dark:border-[#ccc]`}>
                <Main showOptionsRef={showOptionsRef} setShowOptions={setShowOptions} theme={theme} />
            </div>

            <div
                className={`z-[100] fixed top-0 right-0 h-full w-full max-w-full bg-white shadow-lg border-l-2 dark:border-l-[1px] border-black dark:border-[#ccc] transition-transform duration-300 ease-in-out transform ${showOptions ? 'translate-x-0' : 'translate-x-full'
                    } dark:bg-[#111111]`}
            >
                <Options
                    setShowOptions={setShowOptions}
                    theme={theme}
                    setTheme={setTheme}
                />
            </div>
        </div>
    );
};

export default App;