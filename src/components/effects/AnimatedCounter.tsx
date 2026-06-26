import React, { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Counts up from 0 to value over ~1s using framer-motion's animate().
 */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1,
  style,
  className,
}: AnimatedCounterProps) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => {
    if (Number.isNaN(latest)) return '0';
    return Number(latest).toLocaleString('en-IN', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  });

  const [display, setDisplay] = useState<string>('0');

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const controls = animate(mv, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on('change', (latest) => setDisplay(latest));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, mv, rounded]);

  return (
    <span style={style} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
