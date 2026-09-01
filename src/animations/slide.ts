import type { Variants } from "framer-motion";

export const slideLeft: Variants = {
  hidden: {
    x: -80,
    opacity: 0,
  },

  visible: {
    x: 0,
    opacity: 1,

    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const slideRight: Variants = {
  hidden: {
    x: 80,
    opacity: 0,
  },

  visible: {
    x: 0,
    opacity: 1,

    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};
