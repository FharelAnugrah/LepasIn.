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
  loading = false,
  type = 'warning', // warning, info, danger, success
}) {
  const iconMap = {
    warning: <AlertTriangle className="w-6 h-6 text-warning" />,
    danger: <AlertTriangle className="w-6 h-6 text-danger" />,
    info: <Info className="w-6 h-6 text-info" />,
    success: <CheckCircle2 className="w-6 h-6 text-success" />,
  };

  const bgIconMap = {
    warning: 'bg-warning-50',
    danger: 'bg-danger-50',
    info: 'bg-info-50',
    success: 'bg-success-50',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={!loading} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            bgIconMap[type] || 'bg-surface-alt'
          }`}
        >
          {iconMap[type] || <AlertTriangle className="w-6 h-6 text-ink-soft" />}
        </div>

        <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">{message}</p>

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
            variant={confirmVariant}
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
