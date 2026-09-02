import { OptionProps } from "../../../types/types";
import { getCodeMap } from "../../../utils/helper";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getCloudCodeCount } from "../../../utils/services/cloudCodeService";
import { useCFStore } from "../../../zustand/useCFStore";

const Option: React.FC<OptionProps & { expandedContent?: React.ReactNode }> = ({ title, children, expandedContent }) => {
    const totalSavedCodes = getCodeMap().size;
    const cloudCodes = useCFStore((state) => state.cloudCodeCount);

    return (
        <div className="w-full h-full flex flex-col justify-center p-3.5 dark:bg-[#1a1a1a]/60 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-black/5 dark:border-white/10">
            <div className="flex justify-between items-center w-full my-auto">
                <div className="flex-1 flex flex-col justify-center">
                    <span className="text-base md:text-lg font-medium dark:text-zinc-200 text-zinc-800 leading-tight">{title}</span>
                    {title === 'Delete Saved Codes' && (
                        <span className="text-xs md:text-sm text-zinc-400 mt-0.5">
                            {totalSavedCodes} local codes
                            {cloudCodes !== null ? ` | ${cloudCodes} cloud codes` : ''}
                        </span>
                    )}
                </div>
                <div className="flex justify-center items-center">
                    {children}
                </div>
            </div>
            <AnimatePresence>
                {expandedContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden w-full"
                    >
                        {expandedContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Option;
