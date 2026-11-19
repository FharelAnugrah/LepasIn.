'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  UploadCloud,
  Trash2,
  Star,
  Loader2,
  Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import CameraModal from '@/components/ui/CameraModal';
import { useToast } from '@/components/ui/Toast';

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 5,
  folder = 'products',
  className = '',
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes((file.type || '').toLowerCase()) && !validExtensions.includes(ext)) {
      toast.error(`"${file.name}" ditolak. Hanya format JPG/JPEG, PNG, dan WebP yang diperbolehkan.`);
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(`"${file.name}" melebihi batas maksimal 2 MB.`);
      return false;
    }

    return true;
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengunggah foto');
    }

    return data.url;
  };

  const handleFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${maxImages} foto telah tercapai.`);
      return;
    }

    const filesToUpload = Array.from(filesList)
      .slice(0, remainingSlots)
      .filter(validateFile);

    if (filesToUpload.length === 0) return;

    setUploading(true);
    const newUploadedUrls = [];

    for (const file of filesToUpload) {
      try {
        const url = await uploadFile(file);
        newUploadedUrls.push(url);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Gagal mengunggah foto');
      }
    }

    if (newUploadedUrls.length > 0) {
      onChange([...images, ...newUploadedUrls]);
      toast.success(`${newUploadedUrls.length} foto berhasil ditambahkan.`);
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...remaining]);
    toast.info('Foto utama berhasil diubah.');
  };

  const handleCameraCapture = async (capturedFile) => {
    if (!validateFile(capturedFile)) return;

    setUploading(true);
    try {
      const url = await uploadFile(capturedFile);
      onChange([...images, url]);
      toast.success('Foto dari kamera berhasil disimpan.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah foto dari kamera');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Area Unggah per design2.md 5.7 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`input-3d border-2 border-dashed rounded-2xl p-5 md:p-6 text-center transition-all ${
          isDragOver
            ? 'border-brand-blue bg-brand-blue-soft scale-[1.01]'
            : 'border-border-subtle hover:border-brand-blue bg-canvas/70'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-5 h-5" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold text-ink">
          Unggah 1 sampai {maxImages} foto barang
        </p>
        <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 mb-4 leading-relaxed">
          Ambil foto langsung lewat kamera atau pilih dari galeri (drag and drop di desktop).
          Format JPG/JPEG, PNG, atau WebP, maksimal 2 MB per foto.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="navy"
            disabled={uploading || images.length >= maxImages}
            onClick={() => setCameraModalOpen(true)}
            icon={Camera}
          >
            Ambil Foto (Kamera)
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={uploading || images.length >= maxImages}
            onClick={() => fileInputRef.current?.click()}
            icon={UploadCloud}
          >
            Pilih dari Galeri
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {uploading && (
          <div className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-brand-blue">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Sedang mengunggah dan memverifikasi foto...</span>
          </div>
        )}
      </div>

      {/* Grid Pratinjau Thumbnail (design2.md 5.7) */}
      {images.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink px-0.5">
            <span className="font-semibold tabular-nums">
              Daftar Foto ({images.length}/{maxImages})
            </span>
            <span className="text-ink-muted">
              Foto pertama otomatis menjadi foto utama sampul
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative w-24 h-24 rounded-lg bg-surface-muted border border-border-subtle overflow-visible shrink-0"
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Foto barang ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 z-10 bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Utama
                  </span>
                )}

                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute bottom-1.5 left-1.5 z-10 min-w-[28px] h-7 px-1.5 rounded-md bg-surface/95 text-ink border border-border-subtle hover:bg-campus-gold-soft hover:text-warning-text text-[10px] font-semibold shadow-xs flex items-center gap-0.5"
                    title="Jadikan Foto Utama"
                    aria-label={`Jadikan foto ${idx + 1} sebagai utama`}
                  >
                    <Star className="w-3 h-3 text-campus-gold fill-campus-gold" aria-hidden="true" />
                    <span>Utama</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-danger-text text-white shadow-xs flex items-center justify-center hover:bg-red-800 transition-colors"
                  title="Hapus Foto"
                  aria-label={`Hapus foto ${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}

            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-border-subtle hover:border-brand-blue bg-canvas hover:bg-surface flex flex-col items-center justify-center text-ink-muted hover:text-brand-blue transition-colors gap-1 shrink-0"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-semibold">Tambah</span>
              </button>
            )}
          </div>
        </div>
      )}

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
