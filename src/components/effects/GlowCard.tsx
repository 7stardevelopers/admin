import React, { useRef } from 'react';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
  intensity?: number;
}

/**
 * GlowCard — a wrapper that adds a moving spotlight glow that follows the
 * mouse within the card. Uses CSS variables (no setState) so it's cheap.
 */
export function GlowCard({
  children,
  className,
  style,
  glowColor = 'rgba(255,178,56,0.18)',
  intensity = 1,
  onMouseMove,
  onMouseLeave,
  ...rest
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--glow-x', `${x}%`);
      el.style.setProperty('--glow-y', `${y}%`);
      el.style.setProperty('--glow-opacity', '1');
    }
    onMouseMove?.(e);
  };

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el) {
      el.style.setProperty('--glow-opacity', '0');
    }
    onMouseLeave?.(e);
  };

  return (
    <div
      ref={ref}
      className={`glow-card ${className ?? ''}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        {
          position: 'relative',
          overflow: 'hidden',
          '--glow-x': '50%',
          '--glow-y': '50%',
          '--glow-opacity': '0',
          '--glow-color': glowColor,
          '--glow-intensity': intensity,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
}
