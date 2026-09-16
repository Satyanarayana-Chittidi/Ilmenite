import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PopupBoxProps } from "../../../types/types";

const PopupBox = ({
  setIsOpen,
  title,
  children,
  customClass = "",
  disabledTopBar = false,
  popupHeight = "w-[100%]",
}: PopupBoxProps) => {
  return (
    <motion.div
      className="px-2 no-scrollbar"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`${customClass} w-full h-full text-gray-700 dark:text-darkText-400 z-20 opacity-100 md:p-4 p-4 bg-white rounded-md shadow-sm dark:bg-darkBox-900 dark:border-darkBorder-800 mx-auto relative`}
      >
        {!disabledTopBar && (
          <div
            className={`w-full sticky h-full bg-white dark:bg-darkBox-900 z-10 dark:border-darkBorder-700 rounded-sm top-0 mb-3 flex ${
              title ? "justify-between" : "justify-end"
            }`}
          >
            <h1 className="font-semibold dark:text-darkText-400 text-darkBox-800">
              {title}
            </h1>
            <button
              onClick={() => setIsOpen(false)}
              className="group"
              aria-label="Close"
            >
              <X size={24} className="transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>
        )}

        <div className={`${popupHeight} no-scrollbar`}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default PopupBox;

