import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/global/ErrorBoundary';

const renderGlobalError = (errorTitle: string, errorMessage: string, errorStack?: string) => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  // Only render if root is empty or crashed
  if (rootElement.childElementCount === 0 || rootElement.innerHTML === '') {
    rootElement.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100vh; width:100%; background-color:#111111; color:#e5e7eb; padding:16px; font-family:system-ui, -apple-system, sans-serif; box-sizing:border-box; overflow-y:auto;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:#ef4444;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h1 style="font-size:16px; font-weight:bold; margin:0; color:#ffffff;">${errorTitle}</h1>
        </div>
        <p style="font-size:12px; color:#9ca3af; margin:0 0 12px 0;">An unhandled error occurred in the Ilmenite sidepanel.</p>
        <div style="background-color:rgba(127,29,29,0.3); border:1px solid rgba(153,27,27,0.6); border-radius:8px; padding:12px; margin-bottom:12px; color:#fca5a5; font-family:monospace; font-size:12px; word-break:break-all; white-space:pre-wrap;">${errorMessage}</div>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <button onclick="window.location.reload()" style="background:#2563eb; color:#ffffff; border:none; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; font-weight:500;">Reload</button>
          <button onclick="try{localStorage.clear();window.location.reload();}catch(e){window.location.reload();}" style="background:#374151; color:#f87171; border:1px solid #4b5563; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; font-weight:500;">Reset Storage</button>
        </div>
        ${errorStack ? `<div style="background:#181818; border:1px solid #27272a; border-radius:8px; padding:10px; font-family:monospace; font-size:11px; color:#a1a1aa; overflow:auto; max-height:200px; white-space:pre-wrap; word-break:break-all;"><strong style="color:#71717a;">Stack:</strong><br/>${errorStack}</div>` : ''}
      </div>
    `;
  }
};

window.addEventListener('error', (event) => {
  console.error("Global uncaught error:", event.error || event.message);
  renderGlobalError(
    "Ilmenite Startup Error",
    event.error ? `${event.error.name}: ${event.error.message}` : (event.message || 'Unknown error'),
    event.error?.stack
  );
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("Global unhandled rejection:", event.reason);
  const reason = event.reason;
  renderGlobalError(
    "Ilmenite Unhandled Rejection",
    reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason || 'Unhandled Promise Rejection'),
    reason instanceof Error ? reason.stack : undefined
  );
});

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err: any) {
    console.error("Failed to render React root:", err);
    renderGlobalError("React Mount Error", err?.message || String(err), err?.stack);
  }
} else {
  console.error("Failed to find the root element with ID 'root'. React app cannot be mounted.");
}
