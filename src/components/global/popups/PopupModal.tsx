import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PopupModalProps } from "../../../types/types";

const PopupModal = ({
  isOpen,
  setIsOpen,
  children,
  disableOutsideClick = false,
}: PopupModalProps) => {
  const [mounted, setMounted] = useState(false);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (!disableOutsideClick && e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableOutsideClick) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [setIsOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed z-[99999] flex items-center justify-center w-screen min-h-screen top-0 left-0 bg-dark-900 bg-opacity-40 bg-clip-padding backdrop-filter backdrop-blur-sm py-4`}
          onClick={handleClickOutside}
        >
          <div className="flex items-center justify-center w-fit">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PopupModal;
