import { CirclePause, CirclePlay, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Timer = ({ theme = 'light' }: { theme?: string }) => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000) as unknown as null;
        } else if (!isActive && time !== 0) {
            clearInterval(timerRef.current as unknown as NodeJS.Timeout);
        }
        return () => clearInterval(timerRef.current as unknown as NodeJS.Timeout);
    }, [isActive, time]);

    const handleStartPause = () => {
        setIsActive(!isActive);
    };

    const handleReset = () => {
        clearInterval(timerRef.current as unknown as NodeJS.Timeout);
        setIsActive(false);
        setTime(0);
    };

    const formatTime = (timeInSeconds: number) => {
        const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(timeInSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const glowingWaveStyle = `
        @keyframes glowingWave {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .glowing-wave {
            animation: glowingWave 1.5s infinite;
            border-radius: 50%;
        }
    `;

    return (
        <>
            <style>{glowingWaveStyle}</style>
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`cursor-pointer flex items-center bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm h-7 rounded-lg transition-all duration-200 ${isCollapsed ? 'px-1.5' : 'pl-1.5 pr-2'}`}
            >
                <div 
                    className={`flex items-center justify-center rounded-full transition-opacity ${(isCollapsed && isActive) ? 'glowing-wave text-green-500' : ''}`}
                    title="Toggle Timer"
                >
                    <TimerIcon size={16} color={((isCollapsed && isActive) ? '#22c55e' : '#3b82f6')} />
                </div>

                <AnimatePresence initial={false}>
                    {!isCollapsed && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="flex items-center overflow-hidden"
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 border-l border-gray-400 dark:border-gray-500 pl-2 ml-1.5 h-full">
                                <p className='text-[#777777] dark:text-zinc-100 whitespace-nowrap'>{formatTime(time)}</p>
                                <div onClick={(e) => { e.stopPropagation(); handleStartPause(); }} className='cursor-pointer flex-shrink-0 hover:opacity-75 hover:scale-110 transition-all'>
                                    {isActive ? <CirclePause size={16} color={theme === 'light' ? '#666666' : '#ffffff'} /> : <CirclePlay size={16} color={theme === 'light' ? '#666666' : '#ffffff'} />}
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); handleReset(); }} className='cursor-pointer flex-shrink-0 hover:opacity-75 hover:scale-110 transition-all'>
                                    <RotateCcw size={16} color={theme === 'light' ? '#666666' : '#ffffff'} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default Timer;
