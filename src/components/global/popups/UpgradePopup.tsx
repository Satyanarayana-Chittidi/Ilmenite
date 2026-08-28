import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useCFStore } from '../../../zustand/useCFStore';

interface UpgradePopupProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
}

const UpgradePopup: React.FC<UpgradePopupProps> = ({ isOpen, onClose, featureName }) => {
    const [mounted, setMounted] = useState(false);
    const session = useCFStore(state => state.session);

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
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <Sparkles size={28} className="text-amber-500 dark:text-amber-400" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Unlock Ilmenite
                            </h3>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{featureName}</span> is available exclusively for Plus users. Upgrade today to supercharge your competitive programming experience!
                            </p>
                            
                            <button 
                                onClick={() => {
                                    window.open('https://ilmenite.vercel.app/', '_blank');
                                    onClose();
                                }}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
                            >
                                Learn More
                            </button>
                            
                            <button 
                                onClick={onClose}
                                className="w-full mt-3 py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default UpgradePopup;
