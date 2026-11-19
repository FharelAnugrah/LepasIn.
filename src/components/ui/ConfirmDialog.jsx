'use client';

import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah kamu yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  confirmVariant = 'danger',
  danger = false,
  loading = false,
  type = 'warning',
}) {
  const effectiveVariant = danger ? 'danger' : confirmVariant;
  const effectiveType = danger ? 'danger' : type;

  const iconMap = {
    warning: <AlertTriangle className="w-6 h-6 text-warning-text" aria-hidden="true" />,
    danger: <AlertTriangle className="w-6 h-6 text-danger-text" aria-hidden="true" />,
    info: <Info className="w-6 h-6 text-info-text" aria-hidden="true" />,
    success: <CheckCircle2 className="w-6 h-6 text-success-text" aria-hidden="true" />,
  };

  const bgIconMap = {
    warning: 'bg-warning-bg border border-amber-200',
    danger: 'bg-danger-bg border border-red-200',
    info: 'bg-info-bg border border-brand-blue-border',
    success: 'bg-success-bg border border-green-200',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={!loading} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_0_rgba(15,41,74,0.12)] ${
            bgIconMap[effectiveType] || 'bg-surface-muted border border-border-subtle'
          }`}
        >
          {iconMap[effectiveType] || <AlertTriangle className="w-6 h-6 text-ink-muted" aria-hidden="true" />}
        </div>

        <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-secondary mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={effectiveVariant}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
