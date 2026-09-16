(function() {
    // 1. Initialize Theme
    try {
        var theme = localStorage.getItem('theme') || 'dark';
        var html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
            html.style.backgroundColor = '#111111';
        } else {
            html.classList.remove('dark');
            html.style.backgroundColor = '#f8f9fa';
        }
    } catch (e) {}

    // 2. Early Global Error Display (catches pre-React module load and syntax errors)
    function displayEarlyError(title, message, stack) {
        function render() {
            var root = document.getElementById('root') || document.body;
            if (!root) return;
            if (document.getElementById('ilmenite-early-error')) return;

            var container = document.createElement('div');
            container.id = 'ilmenite-early-error';
            container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background-color:#111111; color:#e5e7eb; padding:16px; font-family:system-ui,-apple-system,sans-serif; box-sizing:border-box; overflow-y:auto; z-index:9999999;';

            var fullErrorText = '=== Ilmenite Startup Error ===\nTitle: ' + title + '\nMessage: ' + message + '\nStack:\n' + (stack || 'N/A');

            container.innerHTML = 
                '<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#ef4444;">' +
                    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
                    '<h1 style="font-size:16px; font-weight:bold; margin:0; color:#ffffff;">' + title + '</h1>' +
                '</div>' +
                '<p style="font-size:12px; color:#9ca3af; margin:0 0 12px 0;">An error prevented the sidepanel from loading:</p>' +
                '<div style="background-color:rgba(127,29,29,0.3); border:1px solid rgba(153,27,27,0.6); border-radius:8px; padding:10px 12px; margin-bottom:12px; color:#fca5a5; font-family:monospace; font-size:12px; word-break:break-all; white-space:pre-wrap;">' + message + '</div>' +
                '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">' +
                    '<button id="ilmenite-early-reload" style="background:#2563eb; color:#ffffff; border:none; border-radius:6px; padding:6px 14px; font-size:12px; cursor:pointer; font-weight:600;">Reload</button>' +
                    '<button id="ilmenite-early-copy" style="background:#27272a; color:#e4e4e7; border:1px solid #3f3f46; border-radius:6px; padding:6px 14px; font-size:12px; cursor:pointer; font-weight:600;">Copy Error</button>' +
                    '<button id="ilmenite-early-reset" style="background:rgba(127,29,29,0.3); color:#fca5a5; border:1px solid rgba(153,27,27,0.5); border-radius:6px; padding:6px 14px; font-size:12px; cursor:pointer; font-weight:600; margin-left:auto;">Reset Storage</button>' +
                '</div>' +
                (stack ? '<div style="background:#181818; border:1px solid #27272a; border-radius:8px; padding:10px; font-family:monospace; font-size:11px; color:#a1a1aa; overflow:auto; max-height:220px; white-space:pre-wrap; word-break:break-all;"><strong style="color:#71717a;">Stack Trace:</strong><br/>' + stack + '</div>' : '');

            root.innerHTML = '';
            root.appendChild(container);

            var reloadBtn = document.getElementById('ilmenite-early-reload');
            if (reloadBtn) reloadBtn.onclick = function() { window.location.reload(); };

            var copyBtn = document.getElementById('ilmenite-early-copy');
            if (copyBtn) copyBtn.onclick = function() {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(fullErrorText).then(function() {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(function() { copyBtn.textContent = 'Copy Error'; }, 2000);
                    });
                }
            };

            var resetBtn = document.getElementById('ilmenite-early-reset');
            if (resetBtn) resetBtn.onclick = function() {
                if (confirm('Clear local storage and cached data?')) {
                    try { localStorage.clear(); } catch(e){}
                    window.location.reload();
                }
            };
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', render);
        } else {
            render();
        }
    }

    window.addEventListener('error', function(event) {
        console.error('[Ilmenite Early Error]', event.error || event.message);
        var msg = event.error ? (event.error.name + ': ' + event.error.message) : (event.message || 'Unknown error');
        var stack = event.error && event.error.stack ? event.error.stack : '';
        displayEarlyError('Ilmenite Script Error', msg, stack);
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('[Ilmenite Early Unhandled Rejection]', event.reason);
        var reason = event.reason;
        var msg = reason instanceof Error ? (reason.name + ': ' + reason.message) : String(reason || 'Unhandled Promise Rejection');
        var stack = reason instanceof Error && reason.stack ? reason.stack : '';
        displayEarlyError('Ilmenite Unhandled Rejection', msg, stack);
    });
})();
