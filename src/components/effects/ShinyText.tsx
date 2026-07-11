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
          'linear-gradient(90deg, #0f172a 40%, #2563EB 50%, #60a5fa 55%, #0f172a 60%)',
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
