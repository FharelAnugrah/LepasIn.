import { GraduationCap } from 'lucide-react';

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  icon: Icon = null,
}) {
  const variants = {
    primary: 'bg-brand-blue-soft text-brand-blue border border-brand-blue-border',
    navy: 'bg-info-bg text-navy-900 border border-brand-blue-border',
    secondary: 'bg-surface-muted text-ink-secondary border border-border-subtle',
    success: 'bg-success-bg text-success-text border border-green-200',
    mint: 'bg-condition-mint-bg text-condition-mint-text border border-condition-mint-border',
    warning: 'bg-warning-bg text-warning-text border border-amber-200',
    danger: 'bg-danger-bg text-danger-text border border-red-200',
    info: 'bg-info-bg text-info-text border border-brand-blue-border',
    gold: 'bg-campus-gold-soft text-warning-text border border-amber-200',
    sold: 'bg-ink/85 text-white border border-white/15 font-bold tracking-wide',
    outline: 'border border-border-subtle text-ink-secondary bg-surface',
  };

  const sizes = {
    xs: 'text-[11px] px-2 py-0.5 rounded-md',
    sm: 'text-xs px-2.5 py-0.5 rounded-md',
    md: 'text-xs md:text-sm px-3 py-1 rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1.5px_0_rgba(15,41,74,0.08)] ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Format Rupiah rapi
 * @param {number} amount
 * @returns {string} mis. "Rp 135.000"
 */
export function formatRupiah(amount) {
  if (amount === undefined || amount === null) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Blue Price Pill khas LepasIn (#1B4375, rounded-full, teks putih tebal)
 */
export function PricePill({ amount, className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-3.5 py-1',
    lg: 'text-xl md:text-2xl px-4 py-1.5',
  };

  return (
    <span
      className={`price-pill-3d text-white font-bold tabular-nums rounded-full inline-flex items-center tracking-tight select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {formatRupiah(amount)}
    </span>
  );
}

/**
 * Badge Kondisi Barang Preloved (design2.md 3 & 5.3)
 */
export function ConditionBadge({ condition, className = '' }) {
  const conditionMap = {
    like_new: { text: 'Seperti Baru', variant: 'mint' },
    good: { text: 'Baik', variant: 'primary' },
    fair: { text: 'Layak Pakai', variant: 'warning' },
    minor_defect: { text: 'Ada Minus', variant: 'danger' },
  };

  const current = conditionMap[condition] || { text: condition, variant: 'secondary' };

  return (
    <Badge
      variant={current.variant}
      size="xs"
      className={`rounded-full px-2.5 py-0.5 ${className}`}
    >
      {current.text}
    </Badge>
  );
}

/**
 * Badge Kampus Perguruan Tinggi (design2.md 5.3)
 */
export function CampusBadge({ shortName, cityName, className = '' }) {
  return (
    <Badge variant="primary" size="xs" icon={GraduationCap} className={className}>
      <span>{shortName}</span>
      {cityName && <span className="opacity-80">- {cityName}</span>}
    </Badge>
  );
}

/**
 * Badge Status Pesanan (design2.md section 3 Semantic & Status Tokens)
 */
export function OrderStatusBadge({ status, deliveryMethod = 'delivery', className = '' }) {
  const statusMap = {
    pending_payment: { text: 'Menunggu Pembayaran', variant: 'warning' },
    processing: { text: 'Diproses Penjual', variant: 'primary' },
    shipped: {
      text: deliveryMethod === 'meetup' ? 'Siap Ketemuan di Kampus' : 'Sedang Dikirim',
      variant: deliveryMethod === 'meetup' ? 'navy' : 'info',
    },
    completed: { text: 'Selesai', variant: 'success' },
    cancelled: { text: 'Dibatalkan', variant: 'danger' },
  };

  const current = statusMap[status] || { text: status, variant: 'secondary' };

  return (
    <Badge variant={current.variant} size="sm" className={className}>
      {current.text}
    </Badge>
  );
}

/**
 * Badge Status Verifikasi Seller (design2.md section 3)
 */
export function SellerStatusBadge({ status, wasApproved = false, className = '' }) {
  const statusMap = {
    pending: { text: 'Menunggu Verifikasi', variant: 'warning' },
    approved: { text: 'Terverifikasi', variant: 'success' },
    rejected: {
      text: wasApproved ? 'Ditangguhkan' : 'Ditolak',
      variant: 'danger',
    },
  };

  const current = statusMap[status] || { text: status, variant: 'secondary' };

  return (
    <Badge variant={current.variant} size="xs" className={className}>
      {current.text}
    </Badge>
  );
}
