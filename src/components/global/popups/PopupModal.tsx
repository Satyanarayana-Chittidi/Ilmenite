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
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableOutsideClick) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow || "auto";
    };
  }, [isOpen, disableOutsideClick, setIsOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[99999] inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
