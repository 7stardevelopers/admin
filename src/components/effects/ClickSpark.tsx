import React, { useRef } from 'react';

interface ClickSparkProps {
  children: React.ReactElement;
  color?: string;
  count?: number;
  /** Don't render sparks (e.g. when reduced motion is requested) */
  disabled?: boolean;
}

/**
 * Wrap a button to emit a burst of amber particles when clicked.
 * Spawns N absolutely-positioned divs that scatter outward + fade.
 */
export function ClickSpark({
  children,
  color = '#ffb238',
  count = 8,
  disabled,
}: ClickSparkProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  const spawn = (e: React.MouseEvent) => {
    const host = ref.current;
    if (!host || disabled) return;
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const distance = 32 + Math.random() * 24;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 6px;
        height: 6px;
        margin: -3px 0 0 -3px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 8px ${color};
        pointer-events: none;
        opacity: 1;
        transform: translate(0, 0) scale(1);
        transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease-out;
        z-index: 5;
      `;
      host.appendChild(dot);
      // next frame
      requestAnimationFrame(() => {
        dot.style.transform = `translate(${tx}px, ${ty}px) scale(0.2)`;
        dot.style.opacity = '0';
      });
      setTimeout(() => dot.remove(), 650);
    }
  };

  // Attach our own onClick handler that runs before the child's
  const child = children as React.ReactElement<any>;
  const childOnClick = child.props.onClick as
    | ((e: React.MouseEvent) => void)
    | undefined;

  const wrappedOnClick = (e: React.MouseEvent) => {
    spawn(e);
    childOnClick?.(e);
  };

  return (
    <span
      ref={ref}
      style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'visible',
      }}
    >
      {React.cloneElement(child, { onClick: wrappedOnClick })}
    </span>
  );
}
