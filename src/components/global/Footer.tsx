import React from 'react';
import { Star, Globe, Linkedin, Github } from 'lucide-react';

interface FooterProps {
    className?: string;
}

const promoLinks = [
    {
        label: 'Rate',
        href: 'https://chromewebstore.google.com/detail/ilmenite/oanffehmigchhkjfeccpdkmmonpbbapc/reviews',
        tooltip: 'Rate Ilmenite on Chrome Web Store',
        icon: Star,
        iconClass: 'text-amber-500 fill-amber-500/20 group-hover:fill-amber-500 transition-colors',
        hoverClass: 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
    },
    {
        label: 'Website',
        href: 'https://ilmenite.vercel.app',
        tooltip: 'Visit Ilmenite Landing Page',
        icon: Globe,
        iconClass: 'text-purple-500 group-hover:text-purple-400 transition-colors',
        hoverClass: 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
    },
    {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/satyanarayana-chittidi',
        tooltip: 'Connect on LinkedIn',
        icon: Linkedin,
        iconClass: 'text-blue-500 group-hover:text-blue-400 transition-colors',
        hoverClass: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
    },
    {
        label: 'GitHub',
        href: 'https://github.com/Satyanarayana-Chittidi/Ilmenite',
        tooltip: 'Star / Fork on GitHub',
        icon: Github,
        iconClass: 'text-gray-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors',
        hoverClass: 'hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
    }
];

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
        <footer 
            className={`w-full flex-shrink-0 h-9 px-3 flex items-center justify-between border-t border-gray-200 dark:border-zinc-800 bg-[#fbfbfb] dark:bg-[#161616] select-none text-xs transition-colors z-20 ${className}`}
        >
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-500">
                <span className="font-semibold text-gray-700 dark:text-zinc-300 tracking-tight">Ilmenite</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-mono">v1.3.0</span>
            </div>

            <div className="flex items-center gap-1">
                {promoLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                openLink(item.href);
                            }}
                            title={item.tooltip}
                            className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 dark:text-zinc-400 transition-all duration-150 cursor-pointer ${item.hoverClass}`}
                        >
                            <Icon size={13} className={item.iconClass} />
                            <span className="hidden min-[360px]:inline">{item.label}</span>
                        </a>
                    );
                })}
            </div>
        </footer>
    );
};

export default React.memo(Footer);
