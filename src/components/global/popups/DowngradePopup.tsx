import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

interface DowngradePopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const DowngradePopup: React.FC<DowngradePopupProps> = ({ isOpen, onClose }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-3 right-3">
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                            >
                                <X size={18} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center text-center mt-2">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <ShieldAlert size={28} className="text-red-500 dark:text-red-400" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Subscription Status Notice
                            </h3>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                                Your Plus subscription tier could not be verified with our cloud servers. You have been switched to the Free tier.
                            </p>

                            <button 
                                onClick={onClose}
                                className="w-full py-2.5 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg transition-colors cursor-pointer"
                            >
                                OK
                            </button>

                            <div className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                                    To continue using plus features
                                </p>
                                <button 
                                    onClick={() => {
                                        window.open('https://ilmenite.vercel.app/', '_blank');
                                        onClose();
                                    }}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                                >
                                    Upgrade to Plus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default DowngradePopup;
