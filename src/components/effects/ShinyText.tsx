import React from 'react';

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  size?: number;
  duration?: number;
  style?: React.CSSProperties;
}

/**
 * Animated shine sweep across text. The text shows a moving amber/white
 * gradient that loops every ~3s, used for page H1 titles.
 */
export function ShinyText({
  children,
  className,
  size,
  duration = 3,
  style,
}: ShinyTextProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        background:
          'linear-gradient(90deg, #edf1f6 40%, #ffb238 50%, #fff8e7 55%, #edf1f6 60%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        animation: `shine ${duration}s linear infinite`,
        fontSize: size ? `${size}px` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
