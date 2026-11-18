'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Lock,
  Phone,
  Store,
  MapPin,
  Eye,
  EyeOff,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Loader2,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import CameraModal from '@/components/ui/CameraModal';
import { useToast } from '@/components/ui/Toast';

const fieldLabels = {
  name: 'Nama Lengkap',
  email: 'Alamat Email',
  phone: 'Nomor WhatsApp / HP',
  password: 'Password',
  confirmPassword: 'Ulangi Password',
  role: 'Peran Akun',
  campus_id: 'Asal Kampus',
  store_name: 'Nama Toko / Lapak',
  location: 'Detail Lokasi Toko',
  id_card_url: 'Foto Selfie dengan KTM',
};

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';
  const toast = useToast();

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [campus, setCampus] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [idCardUrl, setIdCardUrl] = useState('');
  const [idCardUploading, setIdCardUploading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const idCardInputRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper untuk menghapus error saat user mengetik kembali
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  // Upload foto selfie dengan KTM ke /api/upload
  const handleIdCardFile = async (file) => {
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = file.name ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes(file.type.toLowerCase()) && !validExtensions.includes(ext)) {
      toast.error('Format foto ditolak. Hanya format JPG/JPEG dan PNG yang diperbolehkan.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran foto melebihi batas maksimal 10 MB.');
      return;
    }

    setIdCardUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'verifications');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah foto verifikasi');
      }

      setIdCardUrl(data.url);
      clearFieldError('id_card_url');
      toast.success('Foto selfie dengan KTM berhasil dilampirkan! 📸');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah foto');
    } finally {
      setIdCardUploading(false);
    }
  };

  // Helper scroll otomatis ke input yang bermasalah pertama kali
  const scrollToFirstError = (errs) => {
    const firstKey = Object.keys(errs || {})[0];
    if (!firstKey) return;
    setTimeout(() => {
      const el =
        document.getElementById(firstKey) ||
        document.getElementById('register-error-banner');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof el.focus === 'function') {
          el.focus();
        }
      }
    }, 100);
  };

  // Notifikasi toast yang spesifik dan informatif
  const notifyErrors = (errs = {}, fallbackMsg = '') => {
    const errorKeys = Object.keys(errs);
    if (errorKeys.length === 1) {
      const key = errorKeys[0];
      const msg = errs[key];
      toast.error(msg);
    } else if (errorKeys.length > 1) {
      const labels = errorKeys
        .map((k) => fieldLabels[k] || k)
        .slice(0, 3)
        .join(', ');
      toast.error(
        `Pendaftaran belum lengkap: Periksa ${labels}${
          errorKeys.length > 3 ? ' dan data lainnya' : ''
        }`
      );
    } else if (fallbackMsg) {
      toast.error(fallbackMsg);
    }
  };

  // Validasi di sisi klien sebelum submit
  const validateClientForm = () => {
    const errs = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      errs.name = 'Nama lengkap wajib diisi';
    } else if (trimmedName.length < 2) {
      errs.name = 'Nama lengkap minimal 2 karakter';
    }

    if (!trimmedEmail) {
      errs.email = 'Alamat email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Format email tidak valid (contoh: nama@kampus.ac.id)';
    }

    if (!trimmedPhone) {
      errs.phone = 'Nomor WhatsApp/HP wajib diisi';
    } else {
      const cleaned = trimmedPhone.replace(/[\s-]/g, '').replace(/^(\+62|62)/, '0');
      if (!/^08[0-9]{8,12}$/.test(cleaned)) {
        errs.phone = 'Nomor WhatsApp/HP tidak valid (harus diawali 08, 10-14 digit, contoh: 081234567890)';
      }
    }

    if (role === 'seller') {
      if (!campus || !campus.id) {
        errs.campus_id = 'Penjual wajib memilih kampus tempat berjualan';
      }
      if (!storeName.trim()) {
        errs.store_name = 'Nama toko/lapak wajib diisi untuk penjual';
      } else if (storeName.trim().length < 2) {
        errs.store_name = 'Nama toko minimal 2 karakter';
      }
      if (!location.trim()) {
        errs.location = 'Detail lokasi/area kost wajib diisi untuk penjual';
      } else if (location.trim().length < 2) {
        errs.location = 'Detail lokasi minimal 2 karakter';
      }
      if (!idCardUrl) {
        errs.id_card_url =
          'Wajib mengunggah foto selfie sambil memegang KTM atau kartu tanda pengenal lainnya';
      }
    }

    if (!password) {
      errs.password = 'Password wajib diisi';
    } else {
      const nonSpaceLength = password.replace(/\s/g, '').length;
      const allowedRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`\s]+$/;

      if (nonSpaceLength < 8) {
        errs.password = 'Password minimal 8 karakter';
      } else if (!allowedRegex.test(password)) {
        errs.password = 'Password hanya boleh memuat huruf, angka, dan simbol';
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        errs.password = 'Password harus memuat kombinasi huruf dan angka';
      }
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Ulangi password untuk konfirmasi';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Konfirmasi password tidak cocok dengan password yang dimasukkan';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');

    // 1. Validasi awal di browser
    const clientErrs = validateClientForm();
    if (Object.keys(clientErrs).length > 0) {
      setFieldErrors(clientErrs);
      setGeneralError('Terdapat data yang belum sesuai. Silakan periksa rincian di bawah.');
      notifyErrors(clientErrs);
      scrollToFirstError(clientErrs);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        campus_id: campus ? campus.id : null,
        ...(role === 'seller' && {
          store_name: storeName,
          location,
          id_card_url: idCardUrl,
        }),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errs = data.errors || {};
        const mainMsg = data.error || 'Pendaftaran belum berhasil. Silakan periksa formulir.';

        setFieldErrors(errs);
        setGeneralError(mainMsg);
        notifyErrors(errs, mainMsg);
        scrollToFirstError(errs);
        setLoading(false);
        return;
      }

      toast.success(
        role === 'seller'
          ? 'Toko berhasil didaftarkan! Menunggu verifikasi admin.'
          : 'Registrasi berhasil! Selamat datang di LepasIn.'
      );

      router.push(data.redirectTo || (role === 'seller' ? '/pending-seller' : '/'));
      router.refresh();
    } catch (err) {
      console.error('Registration submit error:', err);
      const networkError = 'Terjadi gangguan koneksi. Silakan periksa jaringan internetmu.';
      setGeneralError(networkError);
      toast.error(networkError);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card">
        {/* Header */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center font-display text-ink font-extrabold text-2xl tracking-tight mb-2"
          >
            <span className="text-primary">Lepas</span><span>In</span><span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Buat Akun LepasIn
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Bergabung dengan ribuan mahasiswa se-Indonesia untuk jual beli barang kost preloved.
          </p>
        </div>

        {/* Toggle Pilihan Peran: Pembeli vs Penjual */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-surface rounded-2xl mb-6 border border-line/60">
          <button
            type="button"
            onClick={() => {
              setRole('buyer');
              setFieldErrors({});
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl font-display text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center ${
              role === 'buyer'
                ? 'bg-canvas text-primary shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Sebagai Pembeli</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('seller');
              setFieldErrors({});
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl font-display text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center ${
              role === 'seller'
                ? 'bg-canvas text-primary shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>
              Sebagai Penjual<span className="hidden sm:inline"> (Buka Toko)</span>
            </span>
          </button>
        </div>

        {/* Notifikasi Informative Error Banner */}
        {(generalError || Object.keys(fieldErrors).length > 0) && (
          <div
            id="register-error-banner"
            className="mb-6 p-4 rounded-2xl bg-danger-50 border border-danger/30 text-danger animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
              <div className="flex-1">
                <h4 className="font-bold text-ink text-xs md:text-sm">
                  Pendaftaran Belum Berhasil
                </h4>
                {generalError && (
                  <p className="text-xs md:text-sm text-danger font-medium mt-1">
                    {generalError}
                  </p>
                )}
                {Object.keys(fieldErrors).length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-danger/20">
                    <p className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold mb-1.5">
                      Rincian bagian yang perlu diperbaiki:
                    </p>
                    <ul className="space-y-1 text-xs md:text-sm">
                      {Object.entries(fieldErrors).map(([key, msg]) => (
                        <li key={key} className="flex items-start gap-1.5 font-medium">
                          <span className="text-danger font-bold">•</span>
                          <span>
                            <strong className="text-ink font-semibold">
                              {fieldLabels[key] || key}:
                            </strong>{' '}
                            {msg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="name"
            label="Nama Lengkap"
            placeholder="Contoh: Dinda Putri"
            icon={User}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            error={fieldErrors.name}
            required
          />

          <Input
            id="email"
            label="Alamat Email Mahasiswa"
            type="email"
            placeholder="nama@kampus.ac.id"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            error={fieldErrors.email}
            helperText="Gunakan email aktif untuk konfirmasi dan transaksi"
            required
          />

          <Input
            id="phone"
            label="Nomor WhatsApp / HP"
            type="tel"
            placeholder="081234567890"
            icon={Phone}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError('phone');
            }}
            error={fieldErrors.phone}
            helperText="Wajib diisi untuk koordinasi COD sekampus atau pengiriman"
            required
          />

          {/* Selektor Kampus */}
          <div id="campus_id" className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-semibold text-ink flex items-center justify-between">
              <span>Asal Kampus {role === 'seller' ? '(Wajib)' : '(Opsional)'}</span>
              {role === 'buyer' && (
                <span className="text-[11px] text-ink-soft font-normal">
                  Agar langsung melihat rekomendasi sekampus
                </span>
              )}
            </label>
            <CampusSelector
              value={campus}
              onChange={(c) => {
                setCampus(c);
                clearFieldError('campus_id');
              }}
              allowAll={false}
              placeholder="Pilih kampusmu di Indonesia..."
              error={fieldErrors.campus_id}
              className="w-full"
            />
          </div>

          {/* Field Khusus Penjual */}
          {role === 'seller' && (
            <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary/20 flex flex-col gap-3.5 my-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" />
                <span>Informasi Lapak / Toko Preloved</span>
              </div>

              <Input
                id="store_name"
                label="Nama Toko"
                placeholder="Contoh: Lapak Dinda UNHAS"
                icon={Store}
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  clearFieldError('store_name');
                }}
                error={fieldErrors.store_name}
                helperText="Nama toko yang akan dilihat pembeli di katalog"
                required={role === 'seller'}
              />

              <Input
                id="location"
                label="Detail Lokasi / Area Kost"
                placeholder="Contoh: Tamalanrea, Pintu 1 UNHAS"
                icon={MapPin}
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  clearFieldError('location');
                }}
                error={fieldErrors.location}
                helperText="Lokasi favorit COD atau patokan sekitar kampus"
                required={role === 'seller'}
              />

              {/* Verifikasi Identitas (Selfie + KTM) */}
              <div
                id="id_card_url"
                className={`p-4 rounded-2xl border transition-all ${
                  fieldErrors.id_card_url
                    ? 'bg-danger-50/50 border-danger/40'
                    : 'bg-canvas border-primary/20 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                    <span>Verifikasi Identitas Mahasiswa</span>
                  </div>
                  <span className="text-[10px] font-bold text-danger bg-danger-50 px-2 py-0.5 rounded-full border border-danger/20 shrink-0">
                    Wajib
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed mb-3">
                  Unggah <strong className="text-ink">foto selfie sambil memegang Kartu Tanda Mahasiswa (KTM)</strong> atau kartu identitas resmi lainnya untuk memvalidasi akun tokomu dan mencegah penipuan.
                </p>

                {/* Panduan Foto */}
                <div className="p-3 rounded-xl bg-surface border border-line text-[11px] text-ink-soft flex flex-col gap-1 mb-3.5">
                  <span className="font-semibold text-ink flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                    Panduan Foto Selfie + KTM:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-ink-soft pl-1">
                    <li>Posisikan wajah dan kartu KTM berada dalam satu frame foto.</li>
                    <li>Pastikan nama, foto, atau NIM pada kartu terbaca jelas dan tidak buram/blur.</li>
                    <li>Gunakan format JPG/JPEG atau PNG (maks. 10 MB).</li>
                  </ul>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={idCardInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleIdCardFile(f);
                    e.target.value = '';
                  }}
                  accept="image/jpeg,image/png"
                  className="hidden"
                />

                {/* Jika Foto Sudah Diupload */}
                {idCardUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-line bg-surface p-2.5 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-canvas shrink-0 border border-line">
                      <Image
                        src={idCardUrl}
                        alt="Foto Selfie dengan KTM"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-success font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                        <span>Foto Selfie & KTM Terlampir</span>
                      </div>
                      <p className="text-[11px] text-ink-soft mt-0.5 truncate">
                        Foto siap diperiksa oleh admin LepasIn
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setCameraModalOpen(true)}
                          className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> Ambil Ulang
                        </button>
                        <span className="text-line">•</span>
                        <button
                          type="button"
                          onClick={() => idCardInputRef.current?.click()}
                          className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Pilih File Lain
                        </button>
                        <span className="text-line">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIdCardUrl('');
                            clearFieldError('id_card_url');
                          }}
                          className="text-danger font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tombol Pilihan Foto: Kamera atau Galeri */
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      pill
                      icon={idCardUploading ? Loader2 : Camera}
                      loading={idCardUploading}
                      onClick={() => setCameraModalOpen(true)}
                      className="flex-1"
                    >
                      Ambil Foto Selfie (Kamera)
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      pill
                      icon={idCardUploading ? Loader2 : UploadCloud}
                      loading={idCardUploading}
                      onClick={() => idCardInputRef.current?.click()}
                      className="flex-1"
                    >
                      Pilih dari Galeri
                    </Button>
                  </div>
                )}

                {/* Pesan Error Field */}
                {fieldErrors.id_card_url && (
                  <p className="text-xs text-danger font-medium mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.id_card_url}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Password & Konfirmasi Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 karakter"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={fieldErrors.password}
              helperText="Min. 8 karakter kombinasi huruf, angka"
              required
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-ink-soft hover:text-ink p-1"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Input
              id="confirmPassword"
              label="Ulangi Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Konfirmasi password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              error={fieldErrors.confirmPassword}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            pill
            loading={loading}
            className="w-full mt-3"
          >
            {role === 'seller' ? 'Daftar & Buka Toko' : 'Daftar sebagai Pembeli'}
          </Button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-line/70 text-xs md:text-sm text-ink-soft">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Masuk ke Akun
          </Link>
        </div>
      </div>

      {/* Modal Kamera Selfie KTM */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => {
          handleIdCardFile(file);
        }}
      />
    </div>
  );
}
