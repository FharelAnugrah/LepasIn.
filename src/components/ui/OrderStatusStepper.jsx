import { Check, XCircle } from 'lucide-react';

/**
 * Stepper 4 Tahap Status Pesanan (PRD ORD-2, ORD-7, design2.md 5.6)
 */
export default function OrderStatusStepper({ status, deliveryMethod = 'meetup' }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-danger-bg border border-red-200 text-danger-text text-xs font-semibold">
        <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Pesanan dibatalkan dan stok produk telah dikembalikan.</span>
      </div>
    );
  }

  const steps = [
    { key: 'pending_payment', label: 'Pesanan Dibuat' },
    { key: 'processing', label: 'Diproses Penjual' },
    {
      key: 'shipped',
      label: deliveryMethod === 'meetup' ? 'Siap Ketemuan di Kampus' : 'Sedang Dikirim',
    },
    { key: 'completed', label: 'Selesai' },
  ];

  const statusOrder = ['pending_payment', 'processing', 'shipped', 'completed'];
  const currentIdx = Math.max(0, statusOrder.indexOf(status));

  return (
    <div aria-label="Progres status pesanan" className="py-1">
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx || status === 'completed';
          const isCurrent = idx === currentIdx && status !== 'completed';
          const isReached = isCompleted || isCurrent;

          return (
            <li
              key={step.key}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'nav-pill-3d-active font-semibold'
                  : isCompleted
                  ? 'bg-success-bg/85 border-green-200 text-success-text font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_0_#BBF7D0]'
                  : 'bg-canvas border-border-subtle text-ink-muted shadow-[inset_0_1px_2px_rgba(15,41,74,0.05)]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 tabular-nums ${
                  isCompleted
                    ? 'bg-success-text text-white shadow-[0_2px_0_#14532D]'
                    : isCurrent
                    ? 'bg-brand-blue text-white shadow-[0_2px_0_#0D2545]'
                    : 'bg-surface-muted text-ink-subtle border border-border-subtle'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" aria-hidden="true" /> : idx + 1}
              </span>
              <span className="leading-tight">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
