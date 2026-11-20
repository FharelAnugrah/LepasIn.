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
  ShoppingCart,
  AlertCircle,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Loader2,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import CameraModal from '@/components/ui/CameraModal';
import { useToast } from '@/components/ui/Toast';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateStoreName,
  validateLocation,
} from '@/lib/validation';

const fieldLabels = {
  name: 'Nama Lengkap',
  email: 'Alamat Email',
  phone: 'Nomor WhatsApp / HP',
  password: 'Password',
  confirmPassword: 'Ulangi Password',
  role: 'Peran Akun',
  campus_id: 'Asal Kampus',
  store_name: 'Nama Toko / Lapak',
  location: 'Detail Lokasi / Area Kost',
  id_card_url: 'Foto Selfie dengan KTM',
};

const SELLER_STEPS = [
  { step: 1, title: 'Informasi Pribadi', key: 'personal' },
  { step: 2, title: 'Informasi Toko', key: 'store' },
  { step: 3, title: 'Verifikasi dan Keamanan', key: 'verification' },
];



function FormSectionHeader({ id, step, title, badge = null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-navy-900 text-white text-[11px] font-bold shrink-0"
        >
          {step}
        </span>
        <h2 id={id} className="text-sm font-bold text-ink tracking-tight">
          {title}
        </h2>
      </div>
      {badge && (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
            badge === 'Wajib'
              ? 'bg-campus-gold-soft text-navy-900 border border-campus-gold/40'
              : 'bg-surface-muted text-ink-secondary border border-border-subtle'
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'buyer';
  const toast = useToast();

  const [role, setRole] = useState(initialRole);
  const [sellerStep, setSellerStep] = useState(1);
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
      toast.success('Foto selfie dengan KTM berhasil dilampirkan.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah foto');
    } finally {
      setIdCardUploading(false);
    }
  };

  const scrollToFirstError = (errs) => {
    const firstKey = Object.keys(errs || {})[0];
    if (!firstKey) return;
    setTimeout(() => {
      const el =
        document.getElementById(firstKey) ||
        document.getElementById('register-card') ||
        document.getElementById('main-content');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof el.focus === 'function') {
          el.focus();
        }
      }
    }, 100);
  };

  const scrollToFormCard = () => {
    setTimeout(() => {
      const el = document.getElementById('register-card') || document.getElementById('main-content');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const validateField = (fieldName, valueOverride = null) => {
    let err = null;
    switch (fieldName) {
      case 'name':
        err = validateFullName(valueOverride !== null ? valueOverride : name);
        break;
      case 'email':
        err = validateEmail(valueOverride !== null ? valueOverride : email);
        break;
      case 'phone':
        err = validatePhone(valueOverride !== null ? valueOverride : phone);
        break;
      case 'campus_id':
        if (!campus || !campus.id || Number(campus.id) <= 0) {
          err = 'Penjual wajib memilih kampus tempat berjualan dari daftar yang tersedia.';
        }
        break;
      case 'store_name':
        err = validateStoreName(valueOverride !== null ? valueOverride : storeName);
        break;
      case 'location':
        err = validateLocation(valueOverride !== null ? valueOverride : location);
        break;
      case 'id_card_url':
        if (!idCardUrl || !idCardUrl.trim()) {
          err = 'Wajib mengunggah foto selfie sambil memegang KTM atau kartu tanda pengenal lainnya.';
        }
        break;
      case 'password':
        err = validatePassword(valueOverride !== null ? valueOverride : password);
        break;
      case 'confirmPassword':
        err = validateConfirmPassword(
          password,
          valueOverride !== null ? valueOverride : confirmPassword
        );
        break;
      default:
        break;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[fieldName] = err;
      } else {
        delete next[fieldName];
      }
      return next;
    });

    return err;
  };

  // Validasi Buyer
  const validateBuyerForm = () => {
    const errs = {};
    const nameErr = validateFullName(name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;

    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;

    return errs;
  };

  // Validasi Seller STEP 1: Informasi Pribadi & Kampus
  const validateSellerStep1 = () => {
    const errs = {};
    const nameErr = validateFullName(name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;

    if (!campus || !campus.id || Number(campus.id) <= 0) {
      errs.campus_id = 'Penjual wajib memilih kampus tempat berjualan dari daftar yang tersedia.';
    }

    return errs;
  };

  // Validasi Seller STEP 2: Informasi Toko
  const validateSellerStep2 = () => {
    const errs = {};
    const storeErr = validateStoreName(storeName);
    if (storeErr) errs.store_name = storeErr;

    const locErr = validateLocation(location);
    if (locErr) errs.location = locErr;

    return errs;
  };

  // Validasi Seller STEP 3: Verifikasi Identitas & Keamanan
  const validateSellerStep3 = () => {
    const errs = {};

    if (!idCardUrl || !idCardUrl.trim()) {
      errs.id_card_url =
        'Wajib mengunggah foto selfie sambil memegang KTM atau kartu tanda pengenal lainnya.';
    }

    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;

    return errs;
  };

  const handleNextFromStep1 = () => {
    const errs = validateSellerStep1();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setGeneralError('');
      scrollToFirstError(errs);
      return;
    }
    setFieldErrors({});
    setGeneralError('');
    setSellerStep(2);
    scrollToFormCard();
  };

  const handleNextFromStep2 = () => {
    const errs = validateSellerStep2();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setGeneralError('');
      scrollToFirstError(errs);
      return;
    }
    setFieldErrors({});
    setGeneralError('');
    setSellerStep(3);
    scrollToFormCard();
  };

  const handlePrevStep = () => {
    setFieldErrors({});
    setGeneralError('');
    setSellerStep((prev) => Math.max(1, prev - 1));
    scrollToFormCard();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || idCardUploading) return;
    setFieldErrors({});
    setGeneralError('');

    if (role === 'seller') {
      if (sellerStep === 1) {
        handleNextFromStep1();
        return;
      }
      if (sellerStep === 2) {
        handleNextFromStep2();
        return;
      }

      // Step 3: Validasi seluruh tahap sebelum submit
      const step1Errs = validateSellerStep1();
      if (Object.keys(step1Errs).length > 0) {
        setFieldErrors(step1Errs);
        setSellerStep(1);
        setGeneralError('');
        scrollToFirstError(step1Errs);
        return;
      }

      const step2Errs = validateSellerStep2();
      if (Object.keys(step2Errs).length > 0) {
        setFieldErrors(step2Errs);
        setSellerStep(2);
        setGeneralError('');
        scrollToFirstError(step2Errs);
        return;
      }

      const step3Errs = validateSellerStep3();
      if (Object.keys(step3Errs).length > 0) {
        setFieldErrors(step3Errs);
        setGeneralError('');
        scrollToFirstError(step3Errs);
        return;
      }
    } else {
      // Buyer submit
      const clientErrs = validateBuyerForm();
      if (Object.keys(clientErrs).length > 0) {
        setFieldErrors(clientErrs);
        setGeneralError('');
        scrollToFirstError(clientErrs);
        return;
      }
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

        if (role === 'seller') {
          setGeneralError('');
          if (errs.name || errs.email || errs.phone || errs.campus_id) {
            setSellerStep(1);
          } else if (errs.store_name || errs.location) {
            setSellerStep(2);
          } else if (errs.id_card_url || errs.password || errs.confirmPassword) {
            setSellerStep(3);
          }
          if (Object.keys(errs).length === 0 && mainMsg) {
            toast.error(mainMsg);
          }
        } else {
          setGeneralError('');
          if (Object.keys(errs).length === 0 && mainMsg) {
            toast.error(mainMsg);
          }
        }

        scrollToFirstError(errs);
        setLoading(false);
        return;
      }

      toast.success(
        role === 'seller'
          ? 'Toko berhasil didaftarkan. Akun sedang menunggu verifikasi admin.'
          : 'Registrasi berhasil. Selamat datang di LepasIn.'
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

  const renderAccountSecuritySection = (stepLetter) => (
    <section aria-labelledby={`section-security-${role}`} className="flex flex-col gap-4">
      <FormSectionHeader id={`section-security-${role}`} step={stepLetter} title="Keamanan Akun" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 karakter"
          icon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              validateField('password', e.target.value);
            }
            if (confirmPassword && fieldErrors.confirmPassword) {
              validateField('confirmPassword');
            }
          }}
          onBlur={() => validateField('password')}
          error={fieldErrors.password}
          helperText="Minimal 8 karakter huruf dan angka"
          autoComplete="new-password"
          required
          iconRight={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ink-muted hover:text-ink w-10 h-10 flex items-center justify-center rounded-md transition-colors"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          }
        />

        <Input
          id="confirmPassword"
          label="Ulangi Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ketik ulang password"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              validateField('confirmPassword', e.target.value);
            }
          }}
          onBlur={() => validateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          helperText="Pastikan sama dengan password di samping"
          autoComplete="new-password"
          required
        />
      </div>
    </section>
  );

  const renderCampusField = (isRequired) => (
    <div id="campus_id" className="flex flex-col gap-1.5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-sm font-medium text-ink-secondary">
          Asal Kampus {isRequired ? '(Wajib)' : '(Opsional)'}
        </span>
        <span className="text-xs text-ink-muted font-normal">
          {isRequired
            ? 'Menghubungkan tokomu ke katalog kampus'
            : 'Memprioritaskan produk sekampus di beranda'}
        </span>
      </div>
      <CampusSelector
        value={campus}
        onChange={(c) => {
          setCampus(c);
          clearFieldError('campus_id');
        }}
        allowAll={false}
        placeholder="Pilih perguruan tinggi..."
        error={fieldErrors.campus_id}
        fullWidth={true}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        id="register-card"
        className="surface-3d rounded-3xl p-5 sm:p-7 md:p-8"
      >
        <header className="text-center pb-5 mb-6 border-b border-border-subtle">
          <Link
            href="/"
            className="inline-flex items-baseline font-extrabold text-2xl sm:text-[1.75rem] text-navy-900 tracking-tight mb-2"
          >
            <span>LepasIn</span>
            <span
              className="w-2 h-2 rounded-[4px] bg-campus-gold inline-block ml-0.5 mb-0.5 shadow-[0_2px_0_#B87D04]"
              aria-hidden="true"
            />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Buat Akun LepasIn
          </h1>
          <p className="text-sm text-ink-muted mt-1 max-w-md mx-auto leading-relaxed">
            Jual beli barang kost preloved aman antar-Mahasiswa di kampus Indonesia.
          </p>
        </header>

        {/* Toggle Peran 3D: Pembeli vs Penjual */}
        <div
          role="group"
          aria-label="Pilih peran akun"
          className="grid grid-cols-2 gap-2.5 p-1.5 bg-surface-muted rounded-2xl mb-6 border border-border-subtle shadow-[inset_0_2px_4px_rgba(15,41,74,0.06)]"
        >
          <button
            type="button"
            aria-pressed={role === 'buyer'}
            onClick={() => {
              setRole('buyer');
              setFieldErrors({});
              setGeneralError('');
            }}
            className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
              role === 'buyer'
                ? 'chip-3d-active'
                : 'text-ink-secondary hover:bg-surface/70 hover:text-ink transition-colors'
            }`}
          >
            <ShoppingCart
              className={`w-4 h-4 shrink-0 ${role === 'buyer' ? 'text-campus-gold' : ''}`}
              aria-hidden="true"
            />
            <span>Pembeli</span>
          </button>
          <button
            type="button"
            aria-pressed={role === 'seller'}
            onClick={() => {
              setRole('seller');
              setSellerStep(1);
              setFieldErrors({});
              setGeneralError('');
            }}
            className={`min-h-[46px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
              role === 'seller'
                ? 'chip-3d-active'
                : 'text-ink-secondary hover:bg-surface/70 hover:text-ink transition-colors'
            }`}
          >
            <Store
              className={`w-4 h-4 shrink-0 ${role === 'seller' ? 'text-campus-gold' : ''}`}
              aria-hidden="true"
            />
            <span>Penjual</span>
          </button>
        </div>

        {/* Form Registrasi BUYER (Dipertahankan Persis Seperti Semula) */}
        {role === 'buyer' && (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* A. Informasi Pribadi */}
            <section aria-labelledby="section-personal" className="flex flex-col gap-4">
              <FormSectionHeader id="section-personal" step="1" title="Informasi Pribadi" />

              <Input
                id="name"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                icon={User}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    validateField('name', e.target.value);
                  }
                }}
                onBlur={() => validateField('name')}
                error={fieldErrors.name}
                autoComplete="name"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <Input
                  id="email"
                  label="Alamat Email"
                  type="email"
                  placeholder="nama@kampus.ac.id"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      validateField('email', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('email')}
                  error={fieldErrors.email}
                  helperText="Email aktif untuk login dan transaksi"
                  autoComplete="email"
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
                    if (fieldErrors.phone) {
                      validateField('phone', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('phone')}
                  error={fieldErrors.phone}
                  helperText="Untuk koordinasi COD atau pengiriman"
                  autoComplete="tel"
                  required
                />
              </div>

              {renderCampusField(false)}
            </section>

            {/* B. Keamanan Akun */}
            {renderAccountSecuritySection('2')}

            <Button
              type="submit"
              variant="navy"
              size="lg"
              loading={loading}
              className="w-full mt-1 rounded-xl"
            >
              Daftar sebagai Pembeli
            </Button>
          </form>
        )}

        {/* Stepper Progres Horizontal KHUSUS Role Seller */}
        {role === 'seller' && (
          <div
            role="region"
            aria-label="Progres pendaftaran penjual"
            className="mb-6 px-1 py-1"
          >
            <div className="relative">
              {/* Background track line */}
              <div
                className="absolute top-4 sm:top-4.5 left-[16.666%] right-[16.666%] h-1 bg-border-subtle -translate-y-1/2 -z-0"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-navy-900 transition-all duration-300 ease-out"
                  style={{
                    width: sellerStep === 1 ? '0%' : sellerStep === 2 ? '50%' : '100%',
                  }}
                />
              </div>

              {/* Steps list */}
              <ol className="relative z-10 grid grid-cols-3">
                {SELLER_STEPS.map((s) => {
                  const isCompleted = s.step < sellerStep;
                  const isCurrent = s.step === sellerStep;

                  return (
                    <li key={s.step} className="flex flex-col items-center text-center">
                      <button
                        type="button"
                        disabled={!isCompleted}
                        onClick={() => {
                          if (isCompleted) {
                            setSellerStep(s.step);
                            setFieldErrors({});
                            setGeneralError('');
                          }
                        }}
                        aria-label={`${s.title} - ${
                          isCompleted
                            ? 'Tahap selesai, klik untuk kembali'
                            : isCurrent
                            ? 'Tahap aktif'
                            : 'Tahap belum dikerjakan'
                        }`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 select-none ${
                          isCompleted
                            ? 'bg-navy-900 text-white hover:bg-navy-800 cursor-pointer shadow-xs'
                            : isCurrent
                            ? 'bg-navy-900 text-white ring-4 ring-navy-900/20 shadow-xs'
                            : 'bg-surface text-ink-muted border border-border-subtle cursor-default'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                        ) : (
                          <span>{s.step}</span>
                        )}
                      </button>
                      <span
                        className={`mt-2 text-[11px] sm:text-xs leading-tight transition-colors px-1 ${
                          isCurrent
                            ? 'text-navy-900 font-bold'
                            : isCompleted
                            ? 'text-ink-secondary font-semibold'
                            : 'text-ink-muted font-normal'
                        }`}
                      >
                        {s.title}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        {/* Form Registrasi SELLER (Multi-Step Form 3 Tahap) */}
        {role === 'seller' && (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div key={sellerStep} className="animate-step-fade flex flex-col gap-6">
              {/* STEP 1: Informasi Pribadi & Kampus */}
              {sellerStep === 1 && (
                <>
                  <section aria-labelledby="section-seller-step1" className="flex flex-col gap-4">
                    <FormSectionHeader
                      id="section-seller-step1"
                      step="1"
                      title="Informasi Pribadi"
                    />

                    <Input
                      id="name"
                      label="Nama Lengkap"
                      placeholder="Masukkan nama lengkap"
                      icon={User}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          validateField('name', e.target.value);
                        }
                      }}
                      onBlur={() => validateField('name')}
                      error={fieldErrors.name}
                      helperText="Gunakan nama asli sesuai Kartu Mahasiswa (KTM)"
                      autoComplete="name"
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <Input
                        id="email"
                        label="Alamat Email"
                        type="email"
                        placeholder="nama@kampus.ac.id"
                        icon={Mail}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            validateField('email', e.target.value);
                          }
                        }}
                        onBlur={() => validateField('email')}
                        error={fieldErrors.email}
                        helperText="Email aktif untuk login dan transaksi"
                        autoComplete="email"
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
                          if (fieldErrors.phone) {
                            validateField('phone', e.target.value);
                          }
                        }}
                        onBlur={() => validateField('phone')}
                        error={fieldErrors.phone}
                        helperText="Untuk koordinasi COD atau pengiriman"
                        autoComplete="tel"
                        required
                      />
                    </div>

                    {renderCampusField(true)}
                  </section>

                  {/* Navigasi Step 1 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      Pastikan informasi pribadi sudah benar
                    </p>
                    <Button
                      type="button"
                      variant="navy"
                      size="lg"
                      onClick={handleNextFromStep1}
                      className="w-full sm:w-auto min-w-[140px] rounded-xl shrink-0"
                      iconRight={ArrowRight}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                </>
              )}

              {/* STEP 2: Informasi Toko */}
              {sellerStep === 2 && (
                <>
                  <section aria-labelledby="section-seller-step2" className="flex flex-col gap-4">
                    <FormSectionHeader
                      id="section-seller-step2"
                      step="2"
                      title="Informasi Toko"
                    />

                    <div className="p-4 sm:p-5 rounded-xl bg-canvas border border-border-subtle flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <Input
                          id="store_name"
                          label="Nama Toko / Lapak"
                          placeholder="Contoh: Lapak Kampus UNHAS"
                          icon={Store}
                          value={storeName}
                          onChange={(e) => {
                            setStoreName(e.target.value);
                            if (fieldErrors.store_name) {
                              validateField('store_name', e.target.value);
                            }
                          }}
                          onBlur={() => validateField('store_name')}
                          error={fieldErrors.store_name}
                          helperText="Ditampilkan ke pembeli di katalog"
                          required
                        />

                        <Input
                          id="location"
                          label="Detail Lokasi / Area Kost"
                          placeholder="Contoh: Tamalanrea, Pintu 1"
                          icon={MapPin}
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            if (fieldErrors.location) {
                              validateField('location', e.target.value);
                            }
                          }}
                          onBlur={() => validateField('location')}
                          error={fieldErrors.location}
                          helperText="Area sekitar kampus atau titik COD"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* Navigasi Step 2 */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto min-w-[120px] rounded-xl"
                      icon={ArrowLeft}
                    >
                      Kembali
                    </Button>
                    <Button
                      type="button"
                      variant="navy"
                      size="lg"
                      onClick={handleNextFromStep2}
                      className="w-full sm:w-auto min-w-[140px] rounded-xl"
                      iconRight={ArrowRight}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                </>
              )}

              {/* STEP 3: Verifikasi dan Keamanan */}
              {sellerStep === 3 && (
                <>
                  <div className="flex flex-col gap-6">
                    <FormSectionHeader
                      id="section-seller-step3"
                      step="3"
                      title="Verifikasi dan Keamanan"
                    />

                    {/* Verifikasi Identitas (KTM) */}
                    <section
                      id="id_card_url"
                      aria-labelledby="section-identity"
                      className={`p-4 sm:p-5 rounded-xl border flex flex-col gap-4 ${
                        fieldErrors.id_card_url
                          ? 'bg-danger-bg/50 border-danger-text'
                          : 'bg-canvas border-border-subtle'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                        <h3 id="section-identity" className="text-sm font-bold text-ink tracking-tight">
                          Verifikasi Identitas Mahasiswa
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-campus-gold-soft text-navy-900 border border-campus-gold/40">
                          Wajib
                        </span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-surface border border-border-subtle flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="text-xs text-ink-secondary leading-relaxed min-w-0">
                          <p className="font-semibold text-ink">
                            Foto selfie sambil memegang KTM / Kartu Mahasiswa yang terbaca jelas.
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Pastikan wajah serta nama/NIM terlihat utuh dalam satu frame. Format JPG/JPEG atau PNG, maksimal 10 MB.
                          </p>
                        </div>
                      </div>

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

                      {idCardUrl ? (
                        <div className="rounded-lg border border-border-subtle bg-surface p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="relative w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-surface-muted shrink-0 border border-border-subtle">
                            <Image
                              src={idCardUrl}
                              alt="Foto Selfie dengan KTM"
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-success-text font-semibold text-xs">
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Foto Selfie dan KTM Terlampir</span>
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5 truncate">
                              Siap diperiksa oleh admin LepasIn
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                              <button
                                type="button"
                                onClick={() => setCameraModalOpen(true)}
                                className="min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 py-1 rounded-lg bg-canvas border border-border-subtle text-brand-blue text-xs font-semibold hover:bg-brand-blue-soft inline-flex items-center gap-1.5 transition-colors"
                              >
                                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Ambil Ulang</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => idCardInputRef.current?.click()}
                                className="min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 py-1 rounded-lg bg-canvas border border-border-subtle text-brand-blue text-xs font-semibold hover:bg-brand-blue-soft inline-flex items-center gap-1.5 transition-colors"
                              >
                                <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Ganti File</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIdCardUrl('');
                                  clearFieldError('id_card_url');
                                }}
                                className="min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 py-1 rounded-lg bg-danger-bg border border-red-200 text-danger-text text-xs font-semibold hover:bg-red-100 inline-flex items-center gap-1.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            icon={idCardUploading ? Loader2 : Camera}
                            loading={idCardUploading}
                            onClick={() => setCameraModalOpen(true)}
                            className="flex-1"
                          >
                            Ambil Foto (Kamera)
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            icon={idCardUploading ? Loader2 : UploadCloud}
                            loading={idCardUploading}
                            onClick={() => idCardInputRef.current?.click()}
                            className="flex-1"
                          >
                            Pilih dari Galeri
                          </Button>
                        </div>
                      )}

                      {fieldErrors.id_card_url && (
                        <p role="alert" className="text-xs text-danger-text font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{fieldErrors.id_card_url}</span>
                        </p>
                      )}
                    </section>

                    {/* Keamanan Akun */}
                    <section aria-labelledby="section-security-seller" className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                        <h3 id="section-security-seller" className="text-sm font-bold text-ink tracking-tight">
                          Keamanan Akun
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-campus-gold-soft text-navy-900 border border-campus-gold/40">
                          Wajib
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <Input
                          id="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 8 karakter"
                          icon={Lock}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              validateField('password', e.target.value);
                            }
                            if (confirmPassword && fieldErrors.confirmPassword) {
                              validateField('confirmPassword');
                            }
                          }}
                          onBlur={() => validateField('password')}
                          error={fieldErrors.password}
                          helperText="Minimal 8 karakter huruf dan angka"
                          autoComplete="new-password"
                          required
                          iconRight={
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-ink-muted hover:text-ink w-10 h-10 flex items-center justify-center rounded-md transition-colors"
                              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                              ) : (
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              )}
                            </button>
                          }
                        />

                        <Input
                          id="confirmPassword"
                          label="Ulangi Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Ketik ulang password"
                          icon={Lock}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                              validateField('confirmPassword', e.target.value);
                            }
                          }}
                          onBlur={() => validateField('confirmPassword')}
                          error={fieldErrors.confirmPassword}
                          helperText="Pastikan sama dengan password di samping"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </section>
                  </div>

                  {/* Navigasi Step 3 */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handlePrevStep}
                      disabled={loading}
                      className="w-full sm:w-auto min-w-[120px] rounded-xl"
                      icon={ArrowLeft}
                    >
                      Kembali
                    </Button>
                    <Button
                      type="submit"
                      variant="navy"
                      size="lg"
                      loading={loading}
                      className="w-full sm:w-auto min-w-[200px] rounded-xl"
                    >
                      Daftar dan Buka Toko
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-5 border-t border-border-subtle text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-brand-blue font-semibold hover:underline">
            Masuk ke Akun
          </Link>
        </div>
      </div>

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
