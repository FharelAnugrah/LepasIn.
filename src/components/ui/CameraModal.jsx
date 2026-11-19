'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [facingMode, setFacingMode] = useState('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switchNotice, setSwitchNotice] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Deteksi apakah perangkat memiliki 2 kamera (kamera depan & kamera belakang).
   */
  const checkCameraConfiguration = useCallback((stream, devicesList) => {
    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
        (typeof navigator.maxTouchPoints === 'number' &&
          navigator.maxTouchPoints > 1 &&
          !/Windows NT/i.test(navigator.userAgent)));

    const validVideoInputs = (devicesList || []).filter((d) => {
      if (d.kind !== 'videoinput') return false;
      const lbl = (d.label || '').toLowerCase();
      if (lbl.includes('ir ') || lbl.includes('infrared')) return false;
      return true;
    });

    let supportsDualFacing = false;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities();
        if (
          Array.isArray(capabilities?.facingMode) &&
          capabilities.facingMode.includes('user') &&
          capabilities.facingMode.includes('environment')
        ) {
          supportsDualFacing = true;
        }
      }
    }

    const hasFrontAndBackLabels =
      validVideoInputs.some((d) => /front|user|depan|selfie/i.test(d.label)) &&
      validVideoInputs.some((d) => /back|rear|environment|belakang/i.test(d.label));

    const isDualCamera =
      supportsDualFacing ||
      (isMobileDevice && validVideoInputs.length >= 2) ||
      hasFrontAndBackLabels;

    setHasMultipleCameras(isDualCamera);
    return isDualCamera;
  }, []);

  const startCamera = useCallback(
    async (mode) => {
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

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          checkCameraConfiguration(stream, devices);
        } catch (enumErr) {
          console.warn('Gagal membaca enumerateDevices:', enumErr);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.'
            : 'Tidak dapat mengakses kamera perangkat. Silakan gunakan opsi Pilih dari Galeri.'
        );
        setLoading(false);
      }
    },
    [stopStream, checkCameraConfiguration]
  );

  const handleClose = useCallback(() => {
    stopStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    setCameraError(null);
    setSwitchNotice(null);
    setFacingMode('user');
    onClose();
  }, [stopStream, previewUrl, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    let timer = null;
    if (isOpen && !capturedBlob) {
      timer = setTimeout(() => {
        startCamera('user');
      }, 0);
    } else {
      stopStream();
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, capturedBlob, startCamera, stopStream, previewUrl]);

  const handleToggleCamera = () => {
    if (!hasMultipleCameras) {
      setSwitchNotice('Perangkat Anda hanya memiliki 1 kamera aktif.');
      setTimeout(() => setSwitchNotice(null), 2500);
      return;
    }

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

  const isMirrored = !hasMultipleCameras || facingMode === 'user';

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const maxW = 1280;
    const rawW = video.videoWidth || 1280;
    const rawH = video.videoHeight || 720;
    const scale = rawW > maxW ? maxW / rawW : 1;
    canvas.width = Math.round(rawW * scale);
    canvas.height = Math.round(rawH * scale);

    const ctx = canvas.getContext('2d');
    if (isMirrored) {
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
    const file = new File([capturedBlob], 'kamera-capture.jpg', {
      type: 'image/jpeg',
    });
    onCapture(file);
    handleClose();
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ambil Foto dengan Kamera"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-ink/80 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg bg-ink sm:rounded-2xl shadow-lg overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[90dvh] border border-white/15">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 bg-navy-900 text-white z-10 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-5 h-5 text-campus-gold shrink-0" aria-hidden="true" />
            <span className="font-bold text-sm truncate">Ambil Foto Barang</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!cameraError && !previewUrl && (
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white/15 text-white">
                {!hasMultipleCameras
                  ? 'Kamera Laptop'
                  : facingMode === 'user'
                  ? 'Kamera Depan'
                  : 'Kamera Belakang'}
              </span>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-11 h-11 md:w-10 md:h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Tutup kamera"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Viewport Kamera / Pratinjau Foto */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[240px] sm:min-h-[380px] overflow-hidden">
          {switchNotice && (
            <div className="absolute top-4 z-20 px-4 py-2 rounded-lg bg-navy-900/95 border border-white/20 text-white text-xs font-semibold shadow-lg flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-campus-gold" aria-hidden="true" />
              <span>{switchNotice}</span>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center flex flex-col items-center gap-3 max-w-xs text-white">
              <AlertCircle className="w-12 h-12 text-campus-gold" aria-hidden="true" />
              <p className="text-xs md:text-sm text-white/90 leading-relaxed">
                {cameraError}
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition-colors mt-2">
                <Camera className="w-4 h-4" aria-hidden="true" />
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
            <div className="relative w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Pratinjau Hasil Jepretan"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isMirrored ? 'scale-x-[-1]' : ''
                }`}
              />
              {loading && (
                <div className="absolute inset-0 bg-ink/70 flex items-center justify-center text-white text-xs font-medium">
                  Memulai kamera...
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Tombol Aksi */}
        <div className="px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-navy-900 border-t border-white/10 flex items-center justify-around text-white shrink-0">
          {previewUrl ? (
            <div className="w-full flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={handleRetake}
                className="bg-white/15 text-white border-white/25 hover:bg-white/25 hover:text-white"
                icon={RefreshCw}
              >
                Ambil Ulang
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPhoto}
                icon={Check}
              >
                Gunakan Foto Ini
              </Button>
            </div>
          ) : !cameraError ? (
            <div className="w-full flex items-center justify-between px-4">
              <button
                type="button"
                onClick={handleToggleCamera}
                className="w-11 h-11 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center justify-center"
                aria-label={
                  !hasMultipleCameras
                    ? 'Informasi kamera perangkat'
                    : facingMode === 'user'
                    ? 'Ganti ke Kamera Belakang'
                    : 'Ganti ke Kamera Depan'
                }
                title={
                  !hasMultipleCameras
                    ? 'Perangkat hanya memiliki 1 kamera'
                    : facingMode === 'user'
                    ? 'Ganti ke Kamera Belakang'
                    : 'Ganti ke Kamera Depan'
                }
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Tombol Shutter Lingkaran Besar per design2.md 5.7 */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={loading}
                aria-label="Jepret Foto"
                className="w-14 h-14 rounded-full bg-white ring-4 ring-brand-blue flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="w-5 h-5 rounded-full bg-brand-blue" />
              </button>

              <div className="w-11" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
