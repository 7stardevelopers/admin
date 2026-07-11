import React, { useId, useState } from 'react';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

type InputProps = BaseProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type TextareaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
    rows?: number;
  };

type SelectProps = BaseProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    as: 'select';
    children: React.ReactNode;
  };

type Props = InputProps | TextareaProps | SelectProps;

/**
 * Animated form input with a label that floats up on focus/fill.
 * Glass input style with amber focus ring.
 */
export const FloatingLabel = React.forwardRef<any, Props>(function FloatingLabel(
  props,
  ref,
) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const { label, error, hint, as = 'input', ...rest } = props as any;

  // We pull value from the controlled value OR uncontrolled defaultValue
  // We also infer "filled" from the actual DOM value via focus state.
  const [hasValue, setHasValue] = useState<boolean>(() => {
    const v =
      (props as any).value !== undefined
        ? (props as any).value
        : (props as any).defaultValue;
    return v !== undefined && v !== '' && v !== null;
  });

  const handleFocus = (e: any) => {
    setFocused(true);
    (rest as any).onFocus?.(e);
  };
  const handleBlur = (e: any) => {
    setFocused(false);
    setHasValue(!!e.target.value);
    (rest as any).onBlur?.(e);
  };
  const handleChange = (e: any) => {
    setHasValue(!!e.target.value);
    (rest as any).onChange?.(e);
  };

  const floated = focused || hasValue;

  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: as === 'textarea' ? '20px 14px 10px' : '20px 14px 8px',
    borderRadius: '12px',
    fontSize: '14px',
    color: 'var(--ink)',
    background: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(37,99,235,0.16)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    fontFamily: 'inherit',
    boxShadow: focused ? '0 0 0 2px rgba(37,99,235,0.22)' : 'none',
    resize: as === 'textarea' ? ('none' as const) : undefined,
    appearance: as === 'select' ? 'none' : undefined,
    cursor: as === 'select' ? 'pointer' : undefined,
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: 14,
    top: floated ? 6 : as === 'textarea' ? 18 : '50%',
    transform: floated
      ? 'translateY(0) scale(0.82)'
      : as === 'textarea'
        ? 'translateY(0)'
        : 'translateY(-50%)',
    transformOrigin: 'left top',
    pointerEvents: 'none',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    color: focused ? 'var(--amber)' : 'var(--muted)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--mono)',
    letterSpacing: '0.04em',
    background: 'transparent',
  };

  return (
    <div style={wrapStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          ref={ref as any}
          {...(rest as any)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          style={{ ...fieldStyle, ...(rest as any).style }}
        />
      ) : as === 'select' ? (
        <select
          id={id}
          ref={ref as any}
          {...(rest as any)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          style={{ ...fieldStyle, ...(rest as any).style }}
        >
          {(props as SelectProps).children}
        </select>
      ) : (
        <input
          id={id}
          ref={ref as any}
          {...(rest as any)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          style={{ ...fieldStyle, ...(rest as any).style }}
        />
      )}
      {error && (
        <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '4px' }}>
          {hint}
        </p>
      )}
    </div>
  );
});
