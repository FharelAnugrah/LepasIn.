'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  UploadCloud,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
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
  const mobileCameraInputRef = useRef(null);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file) => {
    const validMimes = ['image/jpeg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes(file.type.toLowerCase()) && !validExtensions.includes(ext)) {
      toast.error(`"${file.name}" ditolak. Hanya format JPG/JPEG dan PNG yang diperbolehkan.`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`"${file.name}" melebihi batas maksimal 10 MB.`);
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
      toast.success(`${newUploadedUrls.length} foto berhasil ditambahkan! 📸`);
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
    toast.info('Foto utama berhasil diubah ⭐');
  };

  const handleCameraCapture = async (capturedFile) => {
    if (!validateFile(capturedFile)) return;

    setUploading(true);
    try {
      const url = await uploadFile(capturedFile);
      onChange([...images, url]);
      toast.success('Foto dari kamera berhasil disimpan! 📸');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah foto dari kamera');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Area Drag & Drop / Tombol Unggah & Kamera */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-card p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all ${
          isDragOver
            ? 'border-primary bg-primary-50/70 scale-[1.01]'
            : 'border-primary/40 bg-primary-50/30 hover:border-primary/70 hover:bg-primary-50/50'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm md:text-base font-bold text-ink">
          Unggah Foto Barang Preloved
        </h3>
        <p className="text-xs text-ink-soft max-w-sm mt-1 mb-4 leading-relaxed">
          Ambil foto langsung dengan kamera ponsel/laptop atau pilih file dari galeri perangkat.
          <br />
          <span className="font-semibold text-primary">Hanya format JPG/JPEG dan PNG</span> (maks. 10 MB per foto).
        </p>

        {/* Tombol Utama: Kamera & File Galeri */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Tombol Kamera Web / Browser */}
          <Button
            type="button"
            variant="primary"
            pill
            disabled={uploading || images.length >= maxImages}
            onClick={() => setCameraModalOpen(true)}
            className="text-xs md:text-sm font-bold shadow-xs"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            <span>Buka Kamera Langsung</span>
          </Button>

          {/* Tombol Kamera Bawaan HP (capture="environment") */}
          <label className="cursor-pointer">
            <input
              ref={mobileCameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="environment"
              className="hidden"
              disabled={uploading || images.length >= maxImages}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-line bg-canvas hover:bg-surface text-ink text-xs md:text-sm font-bold transition shadow-xs">
              <Camera className="w-4 h-4 text-ink-soft" />
              <span>Kamera HP</span>
            </span>
          </label>

          {/* Tombol Pilih dari Galeri */}
          <Button
            type="button"
            variant="secondary"
            pill
            disabled={uploading || images.length >= maxImages}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs md:text-sm font-bold shadow-xs"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>Pilih dari Galeri / File</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {uploading && (
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-primary animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sedang mengunggah dan memverifikasi foto...</span>
          </div>
        )}
      </div>

      {/* Grid Pratinjau Foto */}
      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-ink px-1">
            <span>Daftar Foto ({images.length}/{maxImages})</span>
            <span className="text-[11px] text-ink-soft font-normal">
              Foto pertama otomatis menjadi foto utama sampul
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl bg-surface border border-line overflow-hidden group shadow-xs transition hover:border-primary"
              >
                <Image
                  src={url}
                  alt={`Foto barang ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="160px"
                />

                {/* Badge Foto Utama */}
                {idx === 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                      FOTO UTAMA
                    </span>
                  </div>
                )}

                {/* Overlay Aksi saat Hover / Tap */}
                <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="w-8 h-8 rounded-full bg-white text-ink hover:text-accent shadow-sm flex items-center justify-center transition hover:scale-110 cursor-pointer"
                      title="Jadikan Foto Utama"
                      aria-label="Jadikan Foto Utama"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="w-8 h-8 rounded-full bg-danger text-white shadow-sm flex items-center justify-center transition hover:scale-110 cursor-pointer"
                    title="Hapus Foto"
                    aria-label="Hapus Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Kotak Tambah Cepat jika slot belum penuh */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-2xl border-2 border-dashed border-line hover:border-primary bg-surface/40 hover:bg-surface flex flex-col items-center justify-center text-ink-soft hover:text-primary transition gap-1 cursor-pointer"
              >
                <Plus className="w-6 h-6" />
                <span className="text-[11px] font-bold">Tambah Foto</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Kamera Web */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
