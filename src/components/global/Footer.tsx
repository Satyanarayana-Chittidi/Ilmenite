import React from 'react';
import { Star, Globe, Linkedin, Github, Heart } from 'lucide-react';

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
        <div className={`w-full mt-3 pt-2.5 pb-2.5 px-2 border-t border-gray-200/80 dark:border-zinc-800/80 select-none text-xs ${className}`}>
            {/* Row 1: Extension Name & Version + Rate & Website */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-sm tracking-tight">
                        Ilmenite
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                        v1.3.5
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openLink('https://chromewebstore.google.com/detail/ilmenite/oanffehmigchhkjfeccpdkmmonpbbapc/reviews')}
                        title="Rate Ilmenite on Chrome Web Store"
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-150 cursor-pointer"
                    >
                        <Star size={13} className="text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
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

            {/* Row 2: Socials (LinkedIn, GitHub) in matching pill style + Attribution Credits */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openLink('https://www.linkedin.com/in/chittidi-satyanarayana/')}
                        title="Connect with Satyanarayana Chittidi on LinkedIn"
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-150 cursor-pointer"
                    >
                        <Linkedin size={13} className="text-[#0A66C2] fill-[#0A66C2] dark:text-[#388bfd] dark:fill-[#388bfd] group-hover:scale-110 transition-transform" />
                        <span>LinkedIn</span>
                    </button>

                    <button
                        onClick={() => openLink('https://github.com/Satyanarayana-Chittidi/Ilmenite')}
                        title="View Ilmenite GitHub Repository"
                        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-700 dark:text-zinc-300 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-150 cursor-pointer"
                    >
                        <Github size={13} className="text-zinc-800 fill-zinc-800 dark:text-zinc-200 dark:fill-zinc-200 group-hover:scale-110 transition-transform" />
                        <span>GitHub</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 dark:text-zinc-400">
                    <span>Inspired by</span>
                    <button
                        onClick={() => openLink('https://github.com/MaanasSehgal/Codeforces-Lite')}
                        title="View Codeforces Lite by Maanas Sehgal on GitHub"
                        className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-150 cursor-pointer"
                    >
                        <Heart size={10} className="text-rose-500 fill-rose-500 group-hover:scale-125 transition-transform" />
                        <span>Codeforces Lite</span>
                    </button>
                    <span>by Maanas Sehgal</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Footer);
