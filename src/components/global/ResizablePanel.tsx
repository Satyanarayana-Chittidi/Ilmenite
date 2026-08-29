import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ResizablePanelProps {
    top: React.ReactNode;
    bottom: React.ReactNode;
    initialHeight?: number;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
    top,
    bottom,
    initialHeight = 60,
}) => {
    const [height, setHeight] = useState(initialHeight);
    const [isResizing, setIsResizing] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const heightRef = useRef(initialHeight);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.classList.add('user-select-none');
    }, []);

    // Initial collapse check
    useEffect(() => {
        if (containerRef.current) {
            setIsCollapsed((heightRef.current / 100) * containerRef.current.getBoundingClientRect().height <= 29);
        }
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.classList.remove('user-select-none');
            // Sync React state on mouse up so it persists
            setHeight(heightRef.current);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const containerHeight = containerRect.height;
                const relativeY = e.clientY - containerRect.top;
                
                let newHeight = (relativeY / containerHeight) * 100;
                
                if (relativeY <= 29) {
                    newHeight = (24 / containerHeight) * 100;
                }
                
                const minTopHeightPercentage = (24 / containerHeight) * 100;
                const finalHeight = Math.min(Math.max(minTopHeightPercentage, newHeight), 90);
                
                // Directly mutate DOM for buttery smooth performance without React re-renders
                if (topRef.current) topRef.current.style.height = `${finalHeight}%`;
                if (bottomRef.current) bottomRef.current.style.height = `${100 - finalHeight}%`;
                
                heightRef.current = finalHeight;
                
                // Only trigger a React state update if the collapsed threshold is crossed
                const currentlyCollapsed = (finalHeight / 100) * containerHeight <= 29;
                setIsCollapsed(currentlyCollapsed);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden flex flex-col">
            <div ref={topRef} style={{ height: `${height}%` }} className={`w-full relative min-h-0 overflow-hidden`}>
                <div style={{ display: isCollapsed ? 'none' : 'block', width: '100%', height: '100%' }}>
                    {top}
                </div>
                {isCollapsed && (
                    <div className="absolute inset-0 w-full h-full">
                        <div className="relative h-full w-full z-10 border-2 dark:border border-black dark:border-[#ccc] border-l-0 dark:border-l-0 bg-white dark:bg-[#1e1e1e] flex items-center justify-center">
                            <button 
                                className="text-black dark:text-white text-sm font-semibold select-none hover:opacity-75 transition-opacity"
                                onClick={() => {
                                    if (topRef.current) topRef.current.style.height = `60%`;
                                    if (bottomRef.current) bottomRef.current.style.height = `40%`;
                                    heightRef.current = 60;
                                    setHeight(60);
                                    setIsCollapsed(false);
                                }}
                            >
                                Code Editor
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div
                className="w-full h-[6px] -mt-[3px] -mb-[3px] cursor-ns-resize z-50 bg-transparent relative"
                onMouseDown={handleMouseDown}
            />
            <div ref={bottomRef} style={{ height: `${100 - height}%` }} className="w-full min-h-0 overflow-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {bottom}
            </div>
        </div>
    );
};
