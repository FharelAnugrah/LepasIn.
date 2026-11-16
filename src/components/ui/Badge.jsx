import { GraduationCap } from 'lucide-react';

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  icon: Icon = null,
}) {
  const variants = {
    primary: 'bg-primary-50 text-primary',
    secondary: 'bg-surface-alt text-ink',
    success: 'bg-success-50 text-success font-medium',
    warning: 'bg-warning-50 text-warning font-medium',
    danger: 'bg-danger-50 text-danger font-medium',
    info: 'bg-info-50 text-info font-medium',
    pine: 'bg-pine-50 text-pine font-semibold',
    sold: 'bg-ink/80 text-white backdrop-blur-xs font-bold tracking-wide',
    outline: 'border border-line text-ink-soft',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 rounded-[8px]',
    sm: 'text-xs px-2.5 py-1 rounded-[10px]',
    md: 'text-sm px-3 py-1 rounded-[12px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap select-none ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
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
 * Price Pill khas LepasIn (Biru kobalt #1E5EFF, rounded-full, teks putih tebal)
 */
export function PricePill({ amount, className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs md:text-sm px-3.5 py-1',
    lg: 'text-base md:text-lg px-4.5 py-1.5',
  };

  return (
    <div
      className={`bg-primary text-white font-extrabold rounded-full inline-flex items-center tracking-tight shadow-sm select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {formatRupiah(amount)}
    </div>
  );
}

/**
 * Badge Kondisi Barang Preloved
 */
export function ConditionBadge({ condition, className = '' }) {
  const conditionMap = {
    like_new: { text: 'Seperti Baru', variant: 'success' },
    good: { text: 'Baik', variant: 'primary' },
    fair: { text: 'Layak Pakai', variant: 'warning' },
    minor_defect: { text: 'Ada Minus', variant: 'danger' },
  };

  const current = conditionMap[condition] || { text: condition, variant: 'secondary' };

  return (
    <Badge variant={current.variant} size="xs" className={className}>
      {current.text}
    </Badge>
  );
}

/**
 * Badge Kampus Perguruan Tinggi
 */
export function CampusBadge({ shortName, cityName, className = '' }) {
  return (
    <Badge variant="pine" size="xs" icon={GraduationCap} className={className}>
      <span>{shortName}</span>
      {cityName && <span className="opacity-75">· {cityName}</span>}
    </Badge>
  );
}

/**
 * Badge Status Pesanan
 */
export function OrderStatusBadge({ status, deliveryMethod = 'delivery', className = '' }) {
  const statusMap = {
    pending_payment: { text: 'Menunggu Pembayaran', variant: 'warning' },
    processing: { text: 'Sedang Diproses', variant: 'info' },
    shipped: {
      text: deliveryMethod === 'meetup' ? 'Siap Ketemuan di Kampus' : 'Sedang Dikirim',
      variant: 'primary',
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
 * Badge Status Verifikasi Seller
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
