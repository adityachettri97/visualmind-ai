import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface TooltipAnchor {
  top: number;
  right: number;
  height: number;
}

interface TooltipProps {
  show: boolean;
  text: string;
  anchor: TooltipAnchor | null;
}

function Tooltip({ show, text, anchor }: TooltipProps) {
  if (!anchor) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{
            opacity: 0,
            x: -10,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: -10,
          }}
          transition={{
            duration: 0.2,
          }}
          style={{
            position: "fixed",
            top: anchor.top + anchor.height / 2,
            left: anchor.right + 16,
            transform: "translateY(-50%)",
          }}
          className="
            whitespace-nowrap
            rounded-lg
            bg-slate-900
            px-3
            py-2
            text-sm
            shadow-xl
            border
            border-slate-700
            z-[9999]
          "
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Tooltip;
