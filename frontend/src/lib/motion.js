export const transitionConfig = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const cardHover = {
  rest: { y: 0 },
  hover: {
    y: -5,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};
