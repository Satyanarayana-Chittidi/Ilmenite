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

    if (request.type === 'PAYMENT_SUCCESS' || request.type === 'VERIFY_AND_ACTIVATE_TIER') {
        browserAPI.storage.local.set({ isPlusUser: true });
        browserAPI.tabs.query({}, (tabs) => {
            for (let tab of tabs) {
                browserAPI.tabs.sendMessage(tab.id, { type: 'TOGGLE_PLUS_USER', isPlusUser: true });
            }
        });
        sendResponse({ success: true, isPlusUser: true });
        return true;
    }
});

if (browserAPI.runtime.onMessageExternal) {
    browserAPI.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
        if (request.type === 'PAYMENT_SUCCESS' || request.type === 'VERIFY_AND_ACTIVATE_TIER') {
            browserAPI.storage.local.set({ isPlusUser: true });
            browserAPI.tabs.query({}, (tabs) => {
                for (let tab of tabs) {
                    browserAPI.tabs.sendMessage(tab.id, { type: 'TOGGLE_PLUS_USER', isPlusUser: true });
                }
            });
            sendResponse({ success: true, isPlusUser: true });
            return true;
        }
    });
}




