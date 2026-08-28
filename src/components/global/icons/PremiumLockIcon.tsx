import React from 'react';

interface PremiumLockIconProps {
    size?: number;
    className?: string;
}

const PremiumLockIcon: React.FC<PremiumLockIconProps> = ({ size = 24, className = "" }) => {
    // Generate a random ID for the mask so multiple icons don't conflict, just in case
    const maskId = `keyhole-mask-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7 9V7a5 5 0 0 1 10 0v2" />
            <mask id={maskId}>
                <rect width="18" height="14" x="3" y="9" rx="2" ry="2" fill="white" stroke="none" />
                <circle cx="12" cy="16" r="1.5" fill="black" stroke="none" />
            </mask>
            <rect 
                width="18" 
                height="14" 
                x="3" 
                y="9" 
                rx="2" 
                ry="2" 
                fill="currentColor" 
                stroke="none"
                mask={`url(#${maskId})`} 
            />
        </svg>
    );
};

export default PremiumLockIcon;
