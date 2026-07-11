import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GlowCard } from '@/components/effects/GlowCard';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';

interface TrendProps {
  value: number;
  label?: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: TrendProps;
  gradient?: string;
}

/** Try to extract a clean number + prefix/suffix from a formatted value string */
function parseValue(raw: string | number): { num: number | null; prefix: string; suffix: string; raw: string } {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { num: raw, prefix: '', suffix: '', raw: String(raw) };
  }
  const str = String(raw);
  if (str === '…' || str === '-' || str === '—') {
    return { num: null, prefix: '', suffix: '', raw: str };
  }
  // Detect ₹ prefix common in formatCurrency
  const m = str.match(/^(\D*)([\d,.\s]+)(\D*)$/);
  if (m) {
    const numeric = parseFloat(m[2].replace(/,/g, '').replace(/\s/g, ''));
    if (Number.isFinite(numeric)) {
      return { num: numeric, prefix: m[1] ?? '', suffix: m[3] ?? '', raw: str };
    }
  }
  return { num: null, prefix: '', suffix: '', raw: str };
}

export function StatsCard({ title, value, icon: Icon, trend, gradient }: StatsCardProps) {
  const iconBg = gradient ?? 'linear-gradient(135deg, #2563EB, #14B8A6)';
  const parsed = parseValue(value);

  // Heuristic — show decimals if the raw value has a "." that's not at the end
  const decimalsMatch = parsed.raw.match(/\.(\d{1,2})/);
  const decimals = decimalsMatch ? decimalsMatch[1].length : 0;

  return (
    <GlowCard
      className="stats-card-shimmer glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px',
      }}
    >
      {/* Ambient gradient glow blob */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: iconBg,
        opacity: 0.08,
        filter: 'blur(36px)',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <motion.div
        whileHover={{ rotate: 12, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 16px ${iconBg.includes('2563EB') ? 'rgba(37,99,235,0.30)' : 'rgba(15,23,42,0.18)'}`,
        }}
      >
        <Icon size={20} color="#ffffff" />
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: '10px',
          fontFamily: 'var(--mono)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '4px',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: '26px',
          fontWeight: 800,
          fontFamily: 'var(--mono)',
          color: 'var(--ink)',
          lineHeight: 1.1,
        }}>
          {parsed.num !== null ? (
            <AnimatedCounter
              value={parsed.num}
              prefix={parsed.prefix}
              suffix={parsed.suffix}
              decimals={decimals}
            />
          ) : (
            parsed.raw
          )}
        </p>
        <AnimatePresence>
          {trend && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, delay: 0.4 }}
              style={{
                fontSize: '11px',
                color: trend.value >= 0 ? '#34d399' : '#f87171',
                marginTop: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {trend.value >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {trend.value >= 0 ? '+' : ''}{trend.value}%{trend.label ? ` ${trend.label}` : ''}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </GlowCard>
  );
}
