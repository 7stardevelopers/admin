import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Page-transition wrapper used by every page. Provides a soft blur-fade-up
 * entrance and a gentle exit driven by `<AnimatePresence>` in App.tsx.
 */
export function PageTransition({ children }: PageTransitionProps) {
  if (prefersReduced) {
    return <div style={{ height: '100%' }}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
