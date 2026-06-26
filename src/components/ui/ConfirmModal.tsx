import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: 'success' | 'danger' | 'amber';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen, title, message, confirmLabel = 'Confirm',
  confirmStyle = 'amber', isLoading, onConfirm, onCancel,
}: ConfirmModalProps) {
  const confirmBg: Record<string, string> = {
    success: 'linear-gradient(135deg,#10b981,#059669)',
    danger:  'linear-gradient(135deg,#ef4444,#dc2626)',
    amber:   'linear-gradient(135deg,#ffb238,#ff8a1e)',
  };
  const confirmColor: Record<string, string> = {
    success: '#fff',
    danger:  '#fff',
    amber:   '#07090e',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="gradient-border"
            style={{
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '17px', fontWeight: 700, color: 'var(--ink)',
                fontFamily: 'var(--mono)', letterSpacing: '-0.01em',
              }}>{title}</h3>
              <motion.button
                whileHover={{ rotate: 90, color: 'var(--amber)' }}
                whileTap={{ scale: 0.85 }}
                onClick={onCancel}
                style={{ color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <X size={18} />
              </motion.button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.02, background: 'rgba(255,178,56,0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer',
                  background: 'var(--glass-bg)', border: 'var(--glass-border)', color: 'var(--muted)',
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={!isLoading ? { scale: 1.03, boxShadow: '0 8px 24px rgba(255,138,30,0.35)' } : undefined}
                whileTap={!isLoading ? { scale: 0.97 } : undefined}
                onClick={onConfirm}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  background: confirmBg[confirmStyle],
                  color: confirmColor[confirmStyle],
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                {isLoading && (
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                )}
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
