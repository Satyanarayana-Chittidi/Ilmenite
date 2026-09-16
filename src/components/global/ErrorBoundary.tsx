import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    copied: boolean;
    showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false,
            showDetails: true,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Ilmenite ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleCopyError = async (): Promise<void> => {
        const { error, errorInfo } = this.state;
        const errorText = [
            `=== Ilmenite Sidepanel Error ===`,
            `Time: ${new Date().toISOString()}`,
            `URL: ${window.location.href}`,
            `Error: ${error?.name}: ${error?.message}`,
            `Stack:`,
            error?.stack || 'No stack trace available',
            `Component Stack:`,
            errorInfo?.componentStack || 'No component stack available',
        ].join('\n');

        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2500);
        } catch (e) {
            console.error("Failed to copy error to clipboard:", e);
        }
    };

    handleResetStorage = (): void => {
        if (window.confirm("This will clear local code history and cached settings to restore the extension. Your code in Codeforces problem pages will not be lost. Continue?")) {
            try {
                localStorage.removeItem("codeMap");
                localStorage.removeItem("slugQueue");
                localStorage.removeItem("editorSettings");
                localStorage.removeItem("shortcutSettings");
                window.location.reload();
            } catch (e) {
                console.error("Failed to clear local storage:", e);
                window.location.reload();
            }
        }
    };

    toggleDetails = (): void => {
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const { error, errorInfo, copied, showDetails } = this.state;

            return (
                <div className="flex flex-col h-screen w-full bg-[#111111] text-gray-200 p-4 overflow-y-auto font-sans select-text border-l border-zinc-700">
                    <div className="flex items-center gap-2 mb-4 text-red-400">
                        <AlertTriangle size={24} className="shrink-0 text-red-500" />
                        <h1 className="text-lg font-bold tracking-wide text-white">Ilmenite Error Encountered</h1>
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                        The sidepanel encountered an error and was prevented from black screening. You can copy the error details below or try reloading.
                    </p>

                    {/* Error Message Box */}
                    <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 mb-3 text-red-200 text-xs font-mono break-all whitespace-pre-wrap">
                        <span className="font-bold text-red-400">{error?.name || 'Error'}:</span> {error?.message || 'An unknown error occurred.'}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded text-xs font-medium transition shadow-sm cursor-pointer"
                        >
                            <RefreshCw size={13} />
                            Reload Sidepanel
                        </button>

                        <button
                            onClick={this.handleCopyError}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 rounded text-xs font-medium transition border border-zinc-700 shadow-sm cursor-pointer"
                        >
                            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                            {copied ? 'Copied to Clipboard!' : 'Copy Error Details'}
                        </button>

                        <button
                            onClick={this.handleResetStorage}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/70 text-red-300 rounded text-xs font-medium transition border border-red-800/50 cursor-pointer ml-auto"
                            title="Clear corrupted local storage"
                        >
                            <Trash2 size={13} />
                            Reset Cache
                        </button>
                    </div>

                    {/* Collapsible Stack Trace */}
                    <div className="mt-2 border border-zinc-800 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0 bg-[#181818]">
                        <button
                            onClick={this.toggleDetails}
                            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 cursor-pointer transition select-none"
                        >
                            <span>Stack Trace & Diagnostics</span>
                            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showDetails && (
                            <div className="p-3 overflow-auto flex-1 font-mono text-[11px] leading-relaxed text-zinc-400 space-y-2 bg-[#141414]">
                                {error?.stack && (
                                    <div>
                                        <div className="text-zinc-500 font-bold mb-1">Stack:</div>
                                        <pre className="whitespace-pre-wrap break-all text-red-300/80">{error.stack}</pre>
                                    </div>
                                )}
                                {errorInfo?.componentStack && (
                                    <div className="mt-2 pt-2 border-t border-zinc-800">
                                        <div className="text-zinc-500 font-bold mb-1">Component Stack:</div>
                                        <pre className="whitespace-pre-wrap break-all text-zinc-400">{errorInfo.componentStack}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary;
