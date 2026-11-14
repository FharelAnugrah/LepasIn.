'use client';

import { forwardRef } from 'react';

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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const radius = pill ? 'rounded-full' : 'rounded-[14px]';

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs md:text-sm font-semibold text-ink flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-ink-soft pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full h-[46px] ${Icon ? 'pl-10' : 'pl-4'} ${
            IconRight ? 'pr-10' : 'pr-4'
          } ${radius} bg-surface text-ink text-base md:text-sm placeholder:text-ink-soft/70 border ${
            error
              ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger-50'
              : 'border-line/70 focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary-50'
          } outline-none transition-all duration-150 disabled:opacity-50 disabled:bg-surface-alt ${className}`}
          {...props}
        />

        {IconRight && (
          <div className="absolute right-3.5 text-ink-soft flex items-center">
            {IconRight}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium flex items-center gap-1 mt-0.5">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-ink-soft mt-0.5">{helperText}</p>
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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs md:text-sm font-semibold text-ink"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`w-full p-4 rounded-[14px] bg-surface text-ink text-base md:text-sm placeholder:text-ink-soft/70 border ${
          error
            ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger-50'
            : 'border-line/70 focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary-50'
        } outline-none transition-all duration-150 resize-y disabled:opacity-50 disabled:bg-surface-alt ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-danger font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-soft mt-0.5">{helperText}</p>
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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs md:text-sm font-semibold text-ink"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-ink-soft pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          ref={ref}
          id={inputId}
          className={`w-full h-[46px] ${Icon ? 'pl-10' : 'pl-4'} pr-8 rounded-[14px] bg-surface text-ink text-base md:text-sm border ${
            error
              ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger-50'
              : 'border-line/70 focus:border-primary focus:bg-canvas focus:ring-4 focus:ring-primary-50'
          } outline-none transition-all duration-150 appearance-none cursor-pointer disabled:opacity-50 disabled:bg-surface-alt ${className}`}
          {...props}
        >
          {children}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-ink-soft">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-soft mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});
