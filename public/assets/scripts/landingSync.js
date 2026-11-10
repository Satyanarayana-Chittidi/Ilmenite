// landingSync.js
// Injected into the landing page (ilmenite.app, localhost:5000, localhost:5500, etc.)
// Stamps extension presence and synchronizes session state

console.log('[Ilmenite Extension] landingSync.js content script injected successfully on:', window.location.href);

function stampExtensionPresence() {
    try {
        if (document.documentElement) {
            document.documentElement.setAttribute('data-ilmenite-extension', 'installed');
        }
        window.__ILMENITE_EXTENSION_INSTALLED__ = true;
        window.dispatchEvent(new CustomEvent('ILMENITE_EXTENSION_DETECTED'));
        window.postMessage({
            type: 'ILMENITE_EXTENSION_HEARTBEAT',
            installed: true
        }, '*');
    } catch (e) {
        console.error('[Ilmenite Extension] Error stamping presence:', e);
    }
}

stampExtensionPresence();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stampExtensionPresence);
}

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['session', 'isPlusUser', 'avatarUrl', 'supabaseAvatar', 'email', 'userId', 'authToken'], (result) => {
        stampExtensionPresence();

        if (result.session || result.authToken || result.email) {
            console.log('[Ilmenite Extension] Synchronizing user session to landing page:', result.email || result.userId);
            setTimeout(() => {
                window.postMessage({
                    type: 'SYNC_SESSION',
                    session: result.session,
                    authToken: result.authToken,
                    userId: result.userId || result.session?.user?.id,
                    email: result.email || result.session?.user?.email,
                    isPlusUser: result.isPlusUser,
                    avatarUrl: result.avatarUrl || result.supabaseAvatar, supabaseAvatar: result.avatarUrl || result.supabaseAvatar
                }, '*');
            }, 100);
        }
    });

    // Listen for storage changes in real-time
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            chrome.storage.local.get(['session', 'isPlusUser', 'avatarUrl', 'supabaseAvatar', 'email', 'userId', 'authToken'], (result) => {
                window.postMessage({
                    type: 'SYNC_SESSION',
                    session: result.session,
                    authToken: result.authToken,
                    userId: result.userId || result.session?.user?.id,
                    email: result.email || result.session?.user?.email,
                    isPlusUser: result.isPlusUser,
                    avatarUrl: result.avatarUrl || result.supabaseAvatar, supabaseAvatar: result.avatarUrl || result.supabaseAvatar
                }, '*');
            });
        }
    });

    // Listen for logout request from landing page
    window.addEventListener('message', (event) => {
        const trustedOrigins = ['https://ilmenite.vercel.app'];
        if (!trustedOrigins.includes(event.origin) && event.origin !== '') return;

        if (event.data && event.data.type === 'EXTENSION_LOGOUT_REQUEST') {
            chrome.storage.local.set({ 
                isLoggedIn: false, 
                isPlusUser: false,
                session: null,
                authToken: null,
                email: null,
                userId: null,
                avatarUrl: null, supabaseAvatar: null
            });
        }
    });
}
