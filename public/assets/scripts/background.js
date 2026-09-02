if (typeof globalThis.browserAPI === 'undefined') {
    globalThis.isFirefox = false;
    globalThis.browserAPI = chrome;
}

globalThis.browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FORMAT_CODE') {
        fetch('https://www.onlinegdb.com/beautify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                src: request.src,
                lang: request.lang,
                ts: request.ts,
            }),
        })
        .then(response => {
            if (!response.ok) throw new Error(response.statusText);
            return response.json();
        })
        .then(data => sendResponse({ success: true, data: data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; 
    }

    if (request.type === 'OPEN_LOGIN_TAB') {
        browserAPI.tabs.create({ url: 'https://ilmenite.vercel.app/' });
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'LOGOUT_SUCCESS') {
        browserAPI.storage.local.set({ 
            isLoggedIn: false, 
            isPlusUser: false,
            session: null,
            email: null,
            supabaseAvatar: null,
            needsLandingPageLogout: false
        });
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'LOGIN_SUCCESS') {
        const email = request.session?.user?.email || null;
        browserAPI.storage.local.set({ 
            isLoggedIn: true, 
            isPlusUser: request.isPlusUser || false, 
            email: email,
            session: request.session || null,
            supabaseAvatar: request.supabaseAvatar || null
        });
        
        // Notify all active tabs that we logged in
        browserAPI.tabs.query({}, (tabs) => {
            for (let tab of tabs) {
                browserAPI.tabs.sendMessage(tab.id, { 
                    type: 'TOGGLE_LOGIN', 
                    isLoggedIn: true, 
                    email: email,
                    session: request.session || null,
                    supabaseAvatar: request.supabaseAvatar || null
                });
                if (request.isPlusUser) {
                    browserAPI.tabs.sendMessage(tab.id, { type: 'TOGGLE_PLUS_USER', isPlusUser: true });
                }
            }
        });
        
        // Close the sender tab (which is the login page) if it exists
        if (sender.tab && sender.tab.id) {
            browserAPI.tabs.remove(sender.tab.id);
        }
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'VERIFY_AND_ACTIVATE_TIER' || request.type === 'PAYMENT_SUCCESS') {
        verifyAndActivateTier(sendResponse);
        return true;
    }
});

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const queryProfileTier = async (session) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=tier,avatar_url`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    if (response.ok) {
        const profiles = await response.json();
        const profile = profiles && profiles[0];
        return {
            isPlus: profile ? profile.tier === 'plus' : false,
            avatarUrl: profile?.avatar_url || null
        };
    }
    return null;
};

const verifyAndActivateTier = async (sendResponse) => {
    browserAPI.storage.local.get(['session'], async (res) => {
        const session = res.session;
        if (!session || !session.user || !session.access_token) {
            if (sendResponse) sendResponse({ success: false, error: 'No active session' });
            return;
        }

        const delays = [0, 2000, 4000, 7000]; // Stepped retries to account for Razorpay webhook processing time

        for (let i = 0; i < delays.length; i++) {
            if (delays[i] > 0) {
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }

            try {
                const result = await queryProfileTier(session);
                if (result && result.isPlus) {
                    browserAPI.storage.local.set({ 
                        isPlusUser: true,
                        supabaseAvatar: result.avatarUrl
                    });

                    // Notify all open tabs about the tier change
                    browserAPI.tabs.query({}, (tabs) => {
                        for (let tab of tabs) {
                            browserAPI.tabs.sendMessage(tab.id, { type: 'TOGGLE_PLUS_USER', isPlusUser: true });
                        }
                    });

                    if (sendResponse) sendResponse({ success: true, isPlusUser: true });
                    return; // Success! Stop retrying
                }
            } catch (err) {
                console.error(`Tier verification attempt ${i + 1} failed:`, err);
            }
        }

        if (sendResponse) sendResponse({ success: true, isPlusUser: false });
    });
};

if (browserAPI.runtime.onMessageExternal) {
    browserAPI.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
        if (request.type === 'VERIFY_AND_ACTIVATE_TIER' || request.type === 'PAYMENT_SUCCESS' || request.type === 'CHECK_TIER') {
            verifyAndActivateTier(sendResponse);
            return true;
        }
    });
}




