import type { Variants } from "framer-motion";

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },

  visible: {
    opacity: 1,
    scale: 1,

    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const hoverScale = {
  scale: 1.04,
};

export const tapScale = {
  scale: 0.97,
};
