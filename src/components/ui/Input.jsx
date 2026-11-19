'use client';

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    iconRight: IconRight,
    pill = false,
    className = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? `${label.toLowerCase().replace(/\s+/g, '-')}-${generatedId}` : generatedId);
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helperText ? `${inputId}-helper` : undefined;
  const radius = pill ? 'rounded-full' : 'rounded-lg';

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-secondary flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-ink-muted pointer-events-none">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          onWheel={(e) => {
            if (type === 'number') {
              e.currentTarget.blur();
            }
            if (props.onWheel) {
              props.onWheel(e);
            }
          }}
          className={`input-3d w-full h-11 ${Icon ? 'pl-10' : 'pl-3.5'} ${
            IconRight ? 'pr-10' : 'pr-3.5'
          } ${radius} bg-surface font-sans text-ink text-base md:text-sm placeholder:text-ink-muted ${
            type === 'number' || type === 'tel' ? 'tabular-nums' : ''
          } border ${
            error
              ? 'border-danger-text focus:border-danger-text focus:ring-3 focus:ring-danger-bg'
              : 'border-border-subtle focus:border-brand-blue focus:ring-3 focus:ring-brand-blue-soft'
          } outline-none disabled:opacity-60 disabled:bg-surface-muted ${className}`}
          {...props}
        />

        {IconRight && (
          <div className="absolute right-2.5 text-ink-muted flex items-center">
            {IconRight}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger-text font-medium mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = '',
    id,
    rows = 4,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? `${label.toLowerCase().replace(/\s+/g, '-')}-${generatedId}` : generatedId);
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-secondary"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        className={`input-3d w-full p-3.5 rounded-xl bg-surface text-ink text-base md:text-sm placeholder:text-ink-muted border ${
          error
            ? 'border-danger-text focus:border-danger-text focus:ring-3 focus:ring-danger-bg'
            : 'border-border-subtle focus:border-brand-blue focus:ring-3 focus:ring-brand-blue-soft'
        } outline-none resize-y disabled:opacity-60 disabled:bg-surface-muted ${className}`}
        {...props}
      />

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger-text font-medium mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    id,
    children,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? `${label.toLowerCase().replace(/\s+/g, '-')}-${generatedId}` : generatedId);
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-secondary"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-ink-muted pointer-events-none">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <select
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          className={`input-3d w-full h-11 ${Icon ? 'pl-10' : 'pl-3.5'} pr-9 rounded-xl bg-surface text-ink text-base md:text-sm border ${
            error
              ? 'border-danger-text focus:border-danger-text focus:ring-3 focus:ring-danger-bg'
              : 'border-border-subtle focus:border-brand-blue focus:ring-3 focus:ring-brand-blue-soft'
          } outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:bg-surface-muted ${className}`}
          {...props}
        >
          {children}
        </select>

        <div className="absolute right-3 pointer-events-none text-ink-muted">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger-text font-medium mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
