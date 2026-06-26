import React from 'react';
import { motion } from 'framer-motion';

interface StaggerListProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'tbody' | 'ul';
  /** When true, render each item as a wrapping motion.div with its own box.
   *  When false (the default), items animate inline using display:contents. */
  wrapItems?: boolean;
}

const containerVariants = (stagger: number) => ({
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: 0.05,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/**
 * Wrap a list; each child gets a staggered entrance.
 *
 * Default behaviour wraps each child in a motion.div so opacity / y animations
 * apply. Pass `wrapItems={false}` to render with display:contents when the
 * children handle their own motion (e.g. <motion.tr> rows).
 */
export function StaggerList({
  children,
  delay = 0.05,
  className,
  style,
  as = 'div',
  wrapItems = true,
}: StaggerListProps) {
  const Comp = motion[as as 'div'];
  return (
    <Comp
      className={className}
      style={style}
      variants={containerVariants(delay)}
      initial="hidden"
      animate="show"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={(child as any)?.key ?? i}
          variants={itemVariants}
          style={wrapItems ? undefined : { display: 'contents' }}
        >
          {child}
        </motion.div>
      ))}
    </Comp>
  );
}

/** Variants exported for cases where consumers want to apply directly to motion.tr */
export const staggerItemVariants = itemVariants;
export const staggerContainerVariants = containerVariants;
