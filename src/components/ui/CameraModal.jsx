'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen && !capturedBlob) {
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

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
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
    const file = new File([capturedBlob], `camera-${Date.now()}.jpg`, {
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/60 text-white z-10 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Ambil Foto Barang</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Kamera / Pratinjau Foto */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[420px] overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center flex flex-col items-center gap-3 max-w-xs text-white">
              <AlertCircle className="w-12 h-12 text-warning" />
              <p className="text-xs md:text-sm text-white/80 leading-relaxed">
                {cameraError}
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-hover transition shadow-sm mt-2">
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Bawaan</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  capture="environment"
                  className="hidden"
                  onChange={handleNativeFallback}
                />
              </label>
            </div>
          ) : previewUrl ? (
            // Pratinjau Hasil Jepretan
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Hasil Foto"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          ) : (
            // Live Video Streaming
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
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
              {/* Tombol Balik Kamera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Ganti Kamera Depan/Belakang"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Tombol Jepret Utama */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={loading}
                aria-label="Jepret Foto"
                className="w-16 h-16 rounded-full border-4 border-white bg-primary flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white" />
              </button>

              {/* Spacer penyeimbang */}
              <div className="w-11" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
