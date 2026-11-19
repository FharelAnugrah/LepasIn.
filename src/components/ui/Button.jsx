import React from 'react';
import Link from 'next/link';
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
  href = null,
  ...props
}) {
  const baseStyles =
    'btn-3d inline-flex items-center justify-center font-semibold disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'btn-3d-primary',
    navy: 'btn-3d-navy',
    accent: 'btn-3d-accent font-bold',
    secondary: 'btn-3d-secondary',
    ghost: 'bg-transparent text-ink-secondary hover:bg-surface-muted hover:text-ink active:translate-y-0.5',
    danger: 'btn-3d-danger',
    success: 'btn-3d-success',
    outline: 'btn-3d-outline',
  };

  const sizes = {
    xs: 'min-h-[36px] md:min-h-[32px] px-2.5 text-xs gap-1.5',
    sm: 'min-h-[40px] md:min-h-[36px] px-3.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4.5 text-sm gap-2',
    lg: 'min-h-[48px] px-6 text-sm md:text-base gap-2',
  };

  const radius = pill ? 'rounded-full' : 'rounded-xl';

  const renderIcon = (ic) => {
    if (!ic) return null;
    if (React.isValidElement(ic)) {
      return ic;
    }
    const IconComponent = ic;
    return <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />;
  };

  const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${radius} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses} {...props}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            {renderIcon(icon)}
            {children}
            {renderIcon(iconRight)}
          </>
        )}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={combinedClasses}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
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
