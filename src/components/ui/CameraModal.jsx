'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Default untuk perangkat 2 kamera: kamera depan ('user')
  const [facingMode, setFacingMode] = useState('user');
  const [cameras, setCameras] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switchNotice, setSwitchNotice] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode) => {
    stopStream();
    setCameraError(null);
    setLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser ini.');
      }

      // Request stream video dengan ideal facingMode
      // Untuk perangkat 1 kamera, ideal: 'user' otomatis membuka kamera tunggal yang tersedia
      // Untuk perangkat 2 kamera, ideal: 'user' membuka kamera depan
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setLoading(false);

      // Setelah izin didapat, deteksi jumlah kamera fisik yang tersedia
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoInputs);
      } catch (enumErr) {
        console.warn('Gagal membaca daftar perangkat kamera:', enumErr);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.'
          : 'Tidak dapat mengakses kamera perangkat. Silakan gunakan tombol unggah file di bawah.'
      );
      setLoading(false);
    }
  }, [stopStream]);

  // Buka kamera saat modal aktif
  useEffect(() => {
    if (isOpen && !capturedBlob) {
      // Default: buka kamera depan ('user')
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, facingMode, capturedBlob, startCamera, stopStream, previewUrl]);

  /**
   * Logika Switch Kamera:
   * 1. Jika perangkat memiliki 2 kamera atau lebih: switch antara kamera depan dan belakang.
   * 2. Jika perangkat hanya memiliki 1 kamera: tetap mengarah ke kamera yang aktif.
   */
  const handleToggleCamera = () => {
    // Cek jika perangkat hanya terdeteksi 1 kamera
    if (cameras.length === 1) {
      setSwitchNotice('Perangkat hanya memiliki 1 kamera. Kamera aktif tetap dipertahankan.');
      setTimeout(() => setSwitchNotice(null), 2500);
      return;
    }

    // Jika memiliki 2 kamera atau lebih: beralih antara depan ('user') dan belakang ('environment')
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
    setSwitchNotice(
      nextMode === 'user'
        ? 'Beralih ke Kamera Depan'
        : 'Beralih ke Kamera Belakang'
    );
    setTimeout(() => setSwitchNotice(null), 2000);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');

    // Jika sedang memakai kamera depan, balik gambar secara horizontal (mirror)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopStream();
      },
      'image/jpeg',
      0.88
    );
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `kamera-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    onCapture(file);
    handleClose();
  };

  const handleClose = () => {
    stopStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    setCameraError(null);
    setSwitchNotice(null);
    // Reset facing mode ke depan ('user') untuk pembukaan berikutnya
    setFacingMode('user');
    onClose();
  };

  const handleNativeFallback = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-ink/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-black sm:rounded-card shadow-float overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 bg-black/70 text-white z-10 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Ambil Foto Barang</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Kamera Saat Ini */}
            {!cameraError && !previewUrl && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-white/90">
                {cameras.length <= 1
                  ? '1 Kamera Aktif'
                  : facingMode === 'user'
                  ? 'Kamera Depan'
                  : 'Kamera Belakang'}
              </span>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Kamera / Pratinjau Foto */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[420px] overflow-hidden">
          {/* Banner Pemberitahuan Switch Kamera */}
          {switchNotice && (
            <div className="absolute top-4 z-20 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-float flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{switchNotice}</span>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center flex flex-col items-center gap-3 max-w-xs text-white">
              <AlertCircle className="w-12 h-12 text-warning" />
              <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                {cameraError}
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-hover transition shadow-sm mt-2">
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Perangkat</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  capture={facingMode}
                  className="hidden"
                  onChange={handleNativeFallback}
                />
              </label>
            </div>
          ) : previewUrl ? (
            // Pratinjau Hasil Foto yang Dijepret
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Pratinjau Hasil Jepretan"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          ) : (
            // Live Video Streaming Kamera
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium">
                  Memulai kamera...
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-5 bg-black/80 border-t border-white/10 flex items-center justify-around text-white">
          {previewUrl ? (
            <div className="w-full flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                pill
                onClick={handleRetake}
                className="text-xs font-bold bg-white/20 text-white hover:bg-white/30 border-0"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Ambil Ulang
              </Button>
              <Button
                variant="primary"
                pill
                onClick={handleConfirmPhoto}
                className="text-xs font-bold"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Gunakan Foto Ini
              </Button>
            </div>
          ) : !cameraError ? (
            <div className="w-full flex items-center justify-between px-6">
              {/* Tombol Switch Kamera */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1.5"
                title={
                  cameras.length <= 1
                    ? '1 kamera terdeteksi'
                    : facingMode === 'user'
                    ? 'Ganti ke Kamera Belakang'
                    : 'Ganti ke Kamera Depan'
                }
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Tombol Jepret Foto Utama */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={loading}
                aria-label="Jepret Foto"
                className="w-16 h-16 rounded-full border-4 border-white bg-primary flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white" />
              </button>

              {/* Spacer penyeimbang layout */}
              <div className="w-11" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
