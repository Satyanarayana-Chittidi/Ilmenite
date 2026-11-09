import React, { useState, useEffect } from 'react';
import { useCFStore } from '../../zustand/useCFStore';
import { API_BASE_URL } from '../../utils/apiConfig';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup';
type SignupStep = 'details' | 'otp';

export const AuthForm: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [signupStep, setSignupStep] = useState<SignupStep>('details');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Resend countdown
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const resetMessages = () => {
        setErrorMsg('');
        setSuccessMsg('');
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setSignupStep('details');
        resetMessages();
        setPassword('');
        setConfirmPassword('');
        setOtp('');
    };

    // Store user session in storage and Zustand
    const saveSessionAndInit = async (token: string, user: any) => {
        const isPlusUser = user.tier === 'plus';
        const avatarUrl = user.avatar_url || null;
        const sessionObj = {
            user: {
                id: user.id,
                email: user.email
            },
            access_token: token
        };

        await new Promise<void>((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    isLoggedIn: true,
                    isPlusUser: isPlusUser,
                    authToken: token,
                    email: user.email,
                    userId: user.id,
                    avatarUrl: avatarUrl,
                    supabaseAvatar: avatarUrl,
                    session: sessionObj
                }, () => resolve());
            } else {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('isPlusUser', String(isPlusUser));
                localStorage.setItem('authToken', token);
                localStorage.setItem('email', user.email);
                localStorage.setItem('userId', user.id);
                localStorage.setItem('session', JSON.stringify(sessionObj));
                resolve();
            }
        });

        useCFStore.getState().setIsLoggedIn(true);
        useCFStore.getState().setIsPlusUser(isPlusUser);
        useCFStore.getState().setEmail(user.email || null);
        useCFStore.getState().setAvatarUrl(avatarUrl);
        useCFStore.getState().setSession(sessionObj);

        if (isPlusUser) {
            import('../../utils/services/cloudCodeService').then(module => {
                module.getCloudCodeCount().then(count => {
                    useCFStore.getState().setCloudCodeCount(count);
                }).catch(err => console.error("Failed to fetch cloud code count", err));
                module.syncSettingsFromCloud();
            });
        }
    };

    // 1. Email + Password Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        if (!email.trim() || !password) {
            setErrorMsg('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            toast.success('Successfully logged in!');
            await saveSessionAndInit(data.token, data.user);
        } catch (err: any) {
            setErrorMsg(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Sign Up - Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        if (!email.trim() || !email.includes('@')) {
            setErrorMsg('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), purpose: 'registration' })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send verification code');
            }

            setSuccessMsg(`Verification code sent to ${email}`);
            setSignupStep('otp');
            setCountdown(60);
        } catch (err: any) {
            setErrorMsg(err.message || 'Error sending verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Sign Up - Step 2: Verify OTP & Create Account
    const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        if (!otp.trim() || otp.trim().length !== 6) {
            setErrorMsg('Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    confirmPassword,
                    otp: otp.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            toast.success('Account created successfully!');
            await saveSessionAndInit(data.token, data.user);
        } catch (err: any) {
            setErrorMsg(err.message || 'Registration failed. Please check the code.');
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Continue with GitHub OAuth flow
    const handleGitHubLogin = async () => {
        setIsLoading(true);
        resetMessages();

        try {
            if (typeof chrome !== 'undefined' && chrome.identity) {
                const redirectUrl = chrome.identity.getRedirectURL();
                const initRes = await fetch(`${API_BASE_URL}/auth/github/url?redirect_uri=${encodeURIComponent(redirectUrl)}`);
                const initData = await initRes.json();

                if (!initRes.ok || !initData?.url) {
                    setErrorMsg(initData.error || "GitHub OAuth not configured on backend. Please sign in with Email/Password or OTP.");
                    setIsLoading(false);
                    return;
                }

                chrome.identity.launchWebAuthFlow({
                    url: initData.url,
                    interactive: true
                }, async (callbackUrl) => {
                    if (chrome.runtime.lastError || !callbackUrl) {
                        setErrorMsg(chrome.runtime.lastError?.message || "Authentication failed or cancelled.");
                        setIsLoading(false);
                        return;
                    }

                    try {
                        const url = new URL(callbackUrl);
                        const code = url.searchParams.get('code');
                        if (!code) throw new Error("No authorization code received from GitHub.");

                        const tokenRes = await fetch(`${API_BASE_URL}/auth/github/callback`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code, redirect_uri: redirectUrl })
                        });
                        const tokenData = await tokenRes.json();

                        if (!tokenRes.ok || !tokenData.token) {
                            throw new Error(tokenData.error || "GitHub authentication failed.");
                        }

                        await saveSessionAndInit(tokenData.token, tokenData.user);
                    } catch (e: any) {
                        setErrorMsg(e.message || "Error processing GitHub login");
                    } finally {
                        setIsLoading(false);
                    }
                });
            } else {
                setErrorMsg("Chrome identity API not available in this environment.");
                setIsLoading(false);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to initialize GitHub login.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-[#0f1117]/90 backdrop-blur-2xl rounded-2xl p-8 border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] text-left">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-[1.85rem] font-bold text-white mb-1.5 tracking-tight">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-[0.9rem] text-[#94a3b8]">
                    {mode === 'login'
                        ? 'Sign in to access your Monaco IDE, snippets, and sync.'
                        : 'Join Ilmenite for custom testcases and cloud sync.'}
                </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
                <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                        mode === 'login'
                            ? 'bg-[#8b5cf6] text-white shadow-lg'
                            : 'text-[#94a3b8] hover:text-white'
                    }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                        mode === 'signup'
                            ? 'bg-[#8b5cf6] text-white shadow-lg'
                            : 'text-[#94a3b8] hover:text-white'
                    }`}
                >
                    Create Account
                </button>
            </div>

            {/* Alerts */}
            {errorMsg && (
                <div className="text-red-400 text-xs text-center bg-red-500/10 py-2.5 px-3 rounded-lg border border-red-500/20 mb-4 animate-fadeIn">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="text-emerald-400 text-xs flex items-center justify-center gap-1.5 bg-emerald-500/10 py-2.5 px-3 rounded-lg border border-emerald-500/20 mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* ===================== LOGIN FORM ===================== */}
            {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] disabled:opacity-50"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            )}

            {/* ===================== SIGNUP STEP 1: DETAILS ===================== */}
            {mode === 'signup' && signupStep === 'details' && (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Password (min 6 chars)</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-[#64748b] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] disabled:opacity-50"
                    >
                        {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>
                </form>
            )}

            {/* ===================== SIGNUP STEP 2: OTP VERIFICATION ===================== */}
            {mode === 'signup' && signupStep === 'otp' && (
                <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
                    <button
                        type="button"
                        onClick={() => { setSignupStep('details'); resetMessages(); }}
                        className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Details
                    </button>

                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                            Enter 6-Digit Code sent to <span className="text-white font-semibold">{email}</span>
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                            <input
                                type="text"
                                maxLength={6}
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[#64748b]">Didn't receive code?</span>
                        <button
                            type="button"
                            disabled={countdown > 0 || isLoading}
                            onClick={handleSendOtp}
                            className="text-[#8b5cf6] hover:underline disabled:text-[#64748b] disabled:no-underline font-medium"
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] disabled:opacity-50"
                    >
                        {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                </form>
            )}

            {/* Divider */}
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0f1117] px-3 text-[#64748b]">or</span>
                </div>
            </div>

            {/* GitHub OAuth Button */}
            <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2.5 text-white text-sm font-medium transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:-translate-y-0.5"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                {mode === 'login' ? 'Sign in with GitHub' : 'Sign up with GitHub'}
            </button>
        </div>
    );
};
