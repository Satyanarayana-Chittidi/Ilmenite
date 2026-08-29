import React, { useState } from 'react';
import { supabaseClient } from '../../utils/supabaseClient';
import { useCFStore } from '../../zustand/useCFStore';

export const AuthForm: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            if (typeof chrome !== 'undefined' && chrome.identity) {
                const redirectUrl = chrome.identity.getRedirectURL();
                const { data, error } = await supabaseClient.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: redirectUrl,
                        skipBrowserRedirect: true
                    }
                });
                if (error) throw error;

                if (data?.url) {
                    chrome.identity.launchWebAuthFlow({
                        url: data.url,
                        interactive: true
                    }, async (callbackUrl) => {
                        if (chrome.runtime.lastError || !callbackUrl) {
                            setErrorMsg(chrome.runtime.lastError?.message || "Authentication failed or cancelled.");
                            setIsLoading(false);
                            return;
                        }
                        
                        try {
                            const url = new URL(callbackUrl);
                            
                            // Check if Supabase returned an error
                            const errorDesc = url.searchParams.get('error_description') || url.searchParams.get('error');
                            if (errorDesc) {
                                setErrorMsg(`OAuth Error: ${errorDesc.replace(/\+/g, ' ')}`);
                                setIsLoading(false);
                                return;
                            }
                            
                            const code = url.searchParams.get('code');
                            
                            let session;
                            
                            if (code) {
                                // PKCE flow
                                const { data: sessionData, error: sessionError } = await supabaseClient.auth.exchangeCodeForSession(code);
                                if (sessionError) throw sessionError;
                                session = sessionData.session;
                            } else {
                                // Implicit flow fallback
                                const hashParams = new URLSearchParams(url.hash.substring(1));
                                const accessToken = hashParams.get('access_token');
                                const refreshToken = hashParams.get('refresh_token');
                                
                                if (accessToken && refreshToken) {
                                    const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
                                        access_token: accessToken,
                                        refresh_token: refreshToken
                                    });
                                    if (sessionError) throw sessionError;
                                    session = sessionData.session;
                                }
                            }
                            
                            if (session) {
                                const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user?.id).single();
                                const isPlusUser = profile ? profile.tier === 'plus' : false;
                                
                                chrome.storage.local.set({
                                    isLoggedIn: true,
                                    isPlusUser: isPlusUser,
                                    session: session,
                                    email: session.user?.email,
                                    supabaseAvatar: profile?.avatar_url || session.user?.user_metadata?.avatar_url || null
                                });

                                // Ensure status switch happens immediately in Zustand before fetching
                                useCFStore.getState().setIsLoggedIn(true);
                                useCFStore.getState().setIsPlusUser(isPlusUser);

                                if (isPlusUser) {
                                    import('../../utils/services/cloudCodeService').then(module => {
                                        module.syncSettingsFromCloud();
                                    });
                                }
                            } else {
                                // Log the URL for debugging if it fails
                                console.error("OAuth Callback URL:", callbackUrl);
                                setErrorMsg("Failed to retrieve tokens from authentication provider.");
                            }
                        } catch (e: any) {
                            setErrorMsg(e.message || "Error processing login");
                        }
                        setIsLoading(false);
                    });
                }
            } else {
                // Fallback for non-extension environment
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setErrorMsg(err.message || `Failed to initialize ${provider} login.`);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white/[0.03] backdrop-blur-[12px] rounded-2xl p-10 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-8">
                <h2 className="text-[2rem] font-bold text-white mb-2 leading-[1.2]">
                    Welcome to Ilmenite
                </h2>
                <p className="text-[0.95rem] text-[#94a3b8]">
                    Sign in to access your premium Codeforces tools and sync your settings.
                </p>
            </div>

            {errorMsg && (
                <div className="text-red-400 text-sm text-center bg-red-400/10 py-3 rounded-lg border border-red-400/20 mb-6">
                    {errorMsg}
                </div>
            )}

            <div className="space-y-4">

                <button 
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-3 text-white font-medium transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    Continue with GitHub
                </button>
            </div>
            
            {isLoading && (
                <div className="mt-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-[#8b5cf6] rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};
