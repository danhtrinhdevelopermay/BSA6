import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 60,
    scale: 0.9,
    rotateX: -10,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
  },
  out: {
    opacity: 0,
    y: -40,
    scale: 1.05,
    rotateX: 8,
  },
};

const pageTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.8,
};

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}