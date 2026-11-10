import React from 'react';
import { Star, Globe, Linkedin, Github } from 'lucide-react';

interface FooterProps {
    className?: string;
}

const openLink = (url: string) => {
    try {
        if (typeof window !== 'undefined' && (window as any).chrome?.tabs?.create) {
            (window as any).chrome.tabs.create({ url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    return (
        <div className={`w-full mt-6 pt-4 pb-6 px-2 border-t border-gray-200/80 dark:border-zinc-800/80 select-none text-xs ${className}`}>
            {/* Row 1: Extension Name & Version + Rate & Website */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-sm tracking-tight">
                        Ilmenite
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        v1.3.0
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openLink('https://chromewebstore.google.com/detail/ilmenite/oanffehmigchhkjfeccpdkmmonpbbapc/reviews')}
                        title="Rate Ilmenite on Chrome Web Store"
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-150 cursor-pointer"
                    >
                        <Star size={13} className="text-amber-500 fill-amber-500/30 group-hover:fill-amber-500 transition-colors" />
                        <span>Rate Extension</span>
                    </button>

                    <button
                        onClick={() => openLink('https://ilmenite.vercel.app')}
                        title="Visit Ilmenite Official Website"
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-150 cursor-pointer"
                    >
                        <Globe size={13} className="text-purple-500 group-hover:rotate-12 transition-transform" />
                        <span>Website</span>
                    </button>
                </div>
            </div>

            {/* Row 2: Socials (LinkedIn, GitHub) + Attribution Credits */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openLink('https://www.linkedin.com/in/satyanarayana-chittidi')}
                        title="Connect with Satyanarayana Chittidi on LinkedIn"
                        className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        <Linkedin size={13} className="text-blue-500" />
                        <span>LinkedIn</span>
                    </button>

                    <button
                        onClick={() => openLink('https://github.com/Satyanarayana-Chittidi/Ilmenite')}
                        title="View Ilmenite GitHub Repository"
                        className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <Github size={13} />
                        <span>GitHub</span>
                    </button>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500">
                    <span>Inspired by</span>
                    <button
                        onClick={() => openLink('https://github.com/MaanasSehgal/Codeforces-Lite')}
                        title="View Codeforces Lite on GitHub"
                        className="font-medium text-gray-600 dark:text-zinc-400 hover:text-green-500 dark:hover:text-green-400 underline decoration-dotted transition-colors cursor-pointer"
                    >
                        Codeforces Lite
                    </button>
                    <span>by Maanas Sehgal</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Footer);
