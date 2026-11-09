import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useCFStore } from '../../../zustand/useCFStore';
import { LogOut, Camera, ChevronDown, RefreshCw } from 'lucide-react';
import { browserAPI } from '../../../utils/browser/browserDetect';
import { API_BASE_URL } from '../../../utils/apiConfig';
import Option from '../../options/ui/Option';
import { toast } from 'sonner';

interface AccountBarProps {
    setShowUpgradePopup?: (val: boolean) => void;
    setUpgradeFeatureName?: (val: string) => void;
}

const AccountBar: React.FC<AccountBarProps> = () => {
    const isPlusUser = useCFStore(state => state.isPlusUser);
    const setIsPlusUser = useCFStore(state => state.setIsPlusUser);
    const isLoggedIn = useCFStore(state => state.isLoggedIn);
    const setIsLoggedIn = useCFStore(state => state.setIsLoggedIn);
    const email = useCFStore(state => state.email);
    const session = useCFStore(state => state.session);
    const avatarUrl = useCFStore(state => state.avatarUrl || state.supabaseAvatar);
    const setAvatarUrl = useCFStore(state => state.setAvatarUrl);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCheckingTier, setIsCheckingTier] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const lastCheck = parseInt(localStorage.getItem('lastTierRefreshClick') || '0', 10);
        const elapsed = Math.floor((Date.now() - lastCheck) / 1000);
        if (elapsed < 60) {
            setRefreshCooldown(60 - elapsed);
        }
    }, []);

    useEffect(() => {
        if (refreshCooldown <= 0) return;
        const timer = setInterval(() => {
            setRefreshCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [refreshCooldown]);

    const handleLogout = async () => {
        setShowLogoutPopup(true);
    };

    const confirmLogout = async () => {
        // Clear local state
        setIsLoggedIn(false);
        useCFStore.getState().setIsPlusUser(false);
        useCFStore.getState().setSession(null);
        useCFStore.getState().setEmail(null);
        useCFStore.getState().setAvatarUrl(null);

        // Tell background that we logged out
        browserAPI.storage.local.set({ 
            isLoggedIn: false, 
            isPlusUser: false,
            session: null,
            authToken: null,
            userId: null,
            email: null,
            avatarUrl: null,
            supabaseAvatar: null
        });
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isPlusUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('session');
        
        setShowLogoutPopup(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        setIsUploading(true);

        reader.onload = async () => {
            const dataUrl = reader.result as string;
            setAvatarUrl(dataUrl);
            browserAPI.storage.local.set({ avatarUrl: dataUrl, supabaseAvatar: dataUrl });
            localStorage.setItem('avatarUrl', dataUrl);
            localStorage.setItem('supabaseAvatar', dataUrl);

            try {
                const storageRes = await new Promise<any>((resolve) =>
                    browserAPI.storage.local.get(['authToken'], resolve)
                );
                const token = storageRes.authToken || localStorage.getItem('authToken');
                if (token) {
                    await fetch(`${API_BASE_URL}/auth/avatar`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ avatar_url: dataUrl })
                    });
                }
            } catch (err) {
                console.error("Failed to sync avatar to database:", err);
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
            toast.error("Failed to load image file");
            setIsUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleBadgeClick = () => {
        setShowDropdown(!showDropdown);
    };

    const displayName = 
        session?.user?.user_metadata?.full_name || 
        session?.user?.user_metadata?.name || 
        session?.user?.user_metadata?.user_name || 
        session?.user?.user_metadata?.preferred_username || 
        (email ? email.split('@')[0] : 'Guest');

    const accountTitle = (
        <div className="flex items-center gap-3">
            <div 
                className="relative group cursor-pointer" 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                title="Change Profile Picture"
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                />
                {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className={`w-10 h-10 rounded-full border-2 ${isUploading ? 'border-transparent' : 'border-gray-300 dark:border-gray-700'} object-cover group-hover:opacity-75 transition-opacity`} />
                ) : (
                    <div className={`w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-lg font-bold border-2 ${isUploading ? 'border-transparent' : 'border-transparent'} group-hover:opacity-75 transition-opacity`}>
                        {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                    </div>
                )}
                
                {isUploading ? (
                    <div className="absolute -inset-[2px] animate-spin pointer-events-none">
                        <svg className="w-full h-full text-[#8b5cf6]" viewBox="0 0 100 100">
                            <circle 
                                cx="50" cy="50" r="46" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="8" 
                                strokeDasharray="210" 
                                strokeDashoffset="60" 
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40">
                        <Camera className="text-white w-4 h-4" />
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-base font-medium dark:text-zinc-200 text-zinc-800">
                    {displayName}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal" title={email || 'Account'}>
                    {email || 'Account'}
                </span>
            </div>
        </div>
    );

    const handleRefreshTier = async () => {
        if (refreshCooldown > 0) {
            toast.info(`Please wait ${refreshCooldown}s before checking subscription status again.`);
            return;
        }

        let userEmail = email || session?.user?.email;
        let userId = session?.user?.id;
        let identifier = userId || userEmail;

        if (!identifier) {
            const storageRes = await new Promise((resolve) =>
                browserAPI.storage.local.get(['userId', 'email', 'session'], resolve)
            );
            userEmail = storageRes?.email || storageRes?.session?.user?.email || userEmail;
            userId = storageRes?.userId || storageRes?.session?.user?.id || userId;
            identifier = userId || userEmail;
        }

        if (!identifier && !isLoggedIn) {
            toast.error("You must be logged in to check subscription status.");
            return;
        }

        setIsCheckingTier(true);
        localStorage.setItem('lastTierRefreshClick', Date.now().toString());
        setRefreshCooldown(5);

        try {
            const queryParam = userEmail ? `email=${encodeURIComponent(userEmail)}` : '';
            const res = await fetch(`${API_BASE_URL}/payment/status/${encodeURIComponent(identifier || 'check')}?${queryParam}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to check subscription');
            }

            if (data?.tier === 'plus') {
                const wasPlus = isPlusUser;
                setIsPlusUser(true);
                browserAPI.storage.local.set({ isPlusUser: true });
                if (wasPlus) {
                    toast.info("Subscription refreshed: Ilmenite Plus is active.", { id: "ilmenite-plus-toast" });
                    import('../../../utils/services/cloudCodeService').then(module => {
                        module.getCloudCodeCount().then(count => {
                            useCFStore.getState().setCloudCodeCount(count);
                        }).catch(err => console.error("Failed to fetch cloud code count", err));
                        module.syncSettingsFromCloud();
                    });
                }
                // When !wasPlus, browserAPI.storage.local.set({ isPlusUser: true }) triggers handleStorageChange in App.tsx
                // which automatically fires the single "Ilmenite Plus Activated!" toast and syncs cloud codes/settings!
            } else {
                setIsPlusUser(false);
                browserAPI.storage.local.set({ isPlusUser: false });
                toast.info("Your subscription tier is Free.", { id: "ilmenite-plus-toast" });
            }
        } catch (err: any) {
            toast.error("Failed to check subscription: " + (err.message || 'Unknown error'));
        } finally {
            setIsCheckingTier(false);
        }
    };

    return (
        <div className="col-span-full w-full">
            <Option 
                title={accountTitle}
                expandedContent={
                    showDropdown ? (
                        <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isPlusUser ? 'You are using Ilmenite Plus' : 'You are using free tier of Ilmenite'}
                            </span>
                            <div className="flex items-center gap-2">
                                {!isPlusUser && (
                                    <button
                                        onClick={handleRefreshTier}
                                        disabled={isCheckingTier || refreshCooldown > 0}
                                        className={`p-2 rounded-lg bg-white/50 dark:bg-[#2a2a2a]/50 border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center ${
                                            (isCheckingTier || refreshCooldown > 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                        title={refreshCooldown > 0 ? `Refresh available in ${refreshCooldown}s` : "Refresh Subscription Status"}
                                    >
                                        <RefreshCw size={14} className={isCheckingTier ? "animate-spin text-blue-500" : ""} />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        if (isPlusUser) {
                                            setShowCancelPopup(true);
                                        } else {
                                            window.open('https://ilmenite.vercel.app/', '_blank');
                                        }
                                    }}
                                    className={`text-[12px] font-bold px-4 py-2 rounded-lg flex-shrink-0 transition-colors shadow-sm ${
                                        isPlusUser 
                                        ? 'bg-white/50 dark:bg-[#2a2a2a]/50 border border-black/5 dark:border-white/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200' 
                                        : 'bg-white/50 dark:bg-[#2a2a2a]/50 border border-black/5 dark:border-white/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200'
                                    }`}
                                >
                                    {isPlusUser ? 'Cancel Subscription' : 'Upgrade'}
                                </button>
                            </div>
                        </div>
                    ) : null
                }
            >
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBadgeClick}
                        className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm ${
                            isPlusUser 
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600' 
                                : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a3a3a]'
                        }`}
                    >
                        {isPlusUser ? 'Plus Tier' : 'FREE TIER'}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Log Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </Option>

            {showCancelPopup && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Cancel Subscription</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            To cancel your Premium subscription, please open the UPI payment app (Google Pay, PhonePe, Paytm, etc.) you used for the purchase. Navigate to the <strong>AutoPay</strong> or <strong>Mandates</strong> section and cancel the mandate for Ilmenite.
                            <br /><br />
                            Once cancelled, your subscription will not renew. You will continue to have Premium access until the end of your current billing cycle.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowCancelPopup(false)}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-white/50 dark:bg-[#2a2a2a]/50 border border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showLogoutPopup && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Log Out?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                            Are you sure you want to log out of Ilmenite Plus?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowLogoutPopup(false)}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AccountBar;
