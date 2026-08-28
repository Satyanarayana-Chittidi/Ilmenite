import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

interface PremiumSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    isLocked?: boolean;
    onLockedClick?: () => void;
    className?: string;
    disabled?: boolean;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ 
    value, 
    onChange, 
    options, 
    className = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div ref={wrapperRef} className={`relative inline-block ${className}`}>
            <div 
                className={`flex items-center justify-between bg-zinc-200 dark:bg-zinc-800 backdrop-blur-md px-2.5 h-7 text-sm font-medium text-black dark:text-zinc-100 rounded-lg shadow-sm border border-transparent transition-all duration-200 
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                onClick={() => {
                    if (disabled) return;
                    
                    if (!isOpen && wrapperRef.current) {
                        const rect = wrapperRef.current.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < 250 && rect.top > spaceBelow) {
                            setDropUp(true);
                        } else {
                            setDropUp(false);
                        }
                    }
                    setIsOpen(!isOpen);
                }}
            >
                <span className={`truncate pr-4 ${disabled ? 'opacity-50' : ''}`}>{selectedOption?.label}</span>
                <ChevronDown size={14} className={`absolute right-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className={`absolute z-50 w-full bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-700/50 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                                ${value === option.value 
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold' 
                                    : 'text-gray-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.value && <Check size={14} className="flex-shrink-0 ml-1" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PremiumSelect;
