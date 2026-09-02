// landingSync.js
// This script is injected into the landing page (ilmenite.app or localhost:5500)
// It reads the session from the extension and passes it securely to the landing page window.

if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['session', 'isPlusUser', 'supabaseAvatar'], (result) => {
        if (result.session) {
            // Give the page a moment to load and set up its message listener
            setTimeout(() => {
                window.postMessage({
                    type: 'SYNC_SESSION',
                    session: result.session,
                    isPlusUser: result.isPlusUser,
                    supabaseAvatar: result.supabaseAvatar
                }, '*');
            }, 100);
        }
    });

    // Also listen for changes in case they log in while the tab is open
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            chrome.storage.local.get(['session', 'isPlusUser', 'supabaseAvatar'], (result) => {
                if (result.session) {
                    window.postMessage({
                        type: 'SYNC_SESSION',
                        session: result.session,
                        isPlusUser: result.isPlusUser,
                        supabaseAvatar: result.supabaseAvatar
                    }, '*');
                } else if (changes.session && !changes.session.newValue) {
                    // Session cleared (logout)
                    window.location.reload();
                }
            });
        }
    });

    // Listen for logout request from landing page
    window.addEventListener('message', (event) => {
        // Only accept logout requests from trusted landing page origins
        const trustedOrigins = ['https://ilmenite.vercel.app', 'https://ilmenite.app', window.location.origin];
        if (!trustedOrigins.includes(event.origin) && event.origin !== '') return;

        if (event.data && event.data.type === 'EXTENSION_LOGOUT_REQUEST') {
            chrome.storage.local.set({ 
                isLoggedIn: false, 
                isPlusUser: false,
                session: null,
                email: null,
                supabaseAvatar: null
            });
        }
    });
}
