import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClickSpark } from '@/components/effects/ClickSpark';

type Variant = 'amber' | 'glass' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** When true, wrap with ClickSpark — defaults true for the amber variant. */
  spark?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  amber: {
    background: 'linear-gradient(135deg, #ffb238 0%, #ff8a1e 100%)',
    color: '#07090e',
    border: 'none',
    boxShadow: '0 4px 14px rgba(255,138,30,0.25)',
  },
  glass: {
    background: 'var(--glass-bg)',
    color: 'var(--ink)',
    border: 'var(--glass-border)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
  },
};

const variantHover: Record<Variant, any> = {
  amber: { scale: 1.03, boxShadow: '0 8px 24px rgba(255,138,30,0.4)' },
  glass: { scale: 1.02, background: 'rgba(255,178,56,0.08)' },
  danger: { scale: 1.02, background: 'rgba(239,68,68,0.18)' },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '8px' },
  md: { padding: '9px 18px', fontSize: '14px', borderRadius: '10px' },
  lg: { padding: '12px 24px', fontSize: '15px', borderRadius: '12px' },
};

export function Button({
  variant = 'glass',
  size = 'md',
  loading,
  spark,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const enableSpark = spark ?? variant === 'amber';

  const btn = (
    <motion.button
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? variantHover[variant] : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      style={{
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        position: 'relative',
        overflow: 'hidden',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...(props as any)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            style={{
              width: 14, height: 14,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );

  if (enableSpark && !disabled && !loading) {
    return <ClickSpark>{btn}</ClickSpark>;
  }
  return btn;
}
