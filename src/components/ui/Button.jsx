import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon = null,
  iconRight = null,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
    accent: 'bg-accent text-ink hover:bg-accent-hover font-bold shadow-sm',
    secondary: 'bg-surface text-ink border border-line hover:bg-surface-alt',
    ghost: 'bg-transparent text-ink hover:bg-surface-alt',
    danger: 'bg-danger text-white hover:bg-red-700 shadow-sm',
    success: 'bg-success text-white hover:bg-green-700 shadow-sm',
    outline: 'border border-primary text-primary bg-transparent hover:bg-primary-50',
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-[50px] px-6 text-base gap-2.5',
  };

  const radius = pill ? 'rounded-full' : 'rounded-[14px]';

  const renderIcon = (ic) => {
    if (!ic) return null;
    if (React.isValidElement(ic)) {
      return ic;
    }
    const IconComponent = ic;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${radius} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {renderIcon(icon)}
          {children}
          {renderIcon(iconRight)}
        </>
      )}
    </button>
  );
}
