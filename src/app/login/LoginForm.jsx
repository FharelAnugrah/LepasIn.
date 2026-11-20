'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { validateEmail } from '@/lib/validation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '';
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateLoginForm = () => {
    const errs = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!password) {
      errs.password = 'Password wajib diisi.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const clientErrs = validateLoginForm();
    if (Object.keys(clientErrs).length > 0) {
      setFieldErrors(clientErrs);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next: nextUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Email atau password salah');
        setLoading(false);
        return;
      }

      toast.success('Selamat datang kembali.');
      router.push(data.redirectTo || '/');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('LepasIn123');
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="surface-3d rounded-3xl p-6 md:p-8">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-baseline font-extrabold text-2xl text-navy-900 tracking-tight mb-3"
          >
            <span>LepasIn</span>
            <span
              className="w-2 h-2 rounded-[4px] bg-campus-gold inline-block ml-0.5 mb-0.5 shadow-[0_2px_0_#B87D04]"
              aria-hidden="true"
            />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Lepas barang kostmu ke sesama Mahasiswa sekampus.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-danger-bg border border-red-200 text-danger-text text-xs md:text-sm font-medium"
          >
            {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="login-email"
            label="Alamat Email"
            type="email"
            placeholder="nama@kampus.ac.id"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              if (fieldErrors.email) {
                const err = validateEmail(e.target.value);
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.email = err;
                  else delete n.email;
                  return n;
                });
              }
            }}
            onBlur={() => {
              const err = validateEmail(email);
              setFieldErrors((prev) => {
                const n = { ...prev };
                if (err) n.email = err;
                else delete n.email;
                return n;
              });
            }}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <Input
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password"
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              if (fieldErrors.password && e.target.value) {
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.password;
                  return n;
                });
              }
            }}
            onBlur={() => {
              if (!password) {
                setFieldErrors((prev) => ({ ...prev, password: 'Password wajib diisi.' }));
              } else {
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  delete n.password;
                  return n;
                });
              }
            }}
            error={fieldErrors.password}
            required
            autoComplete="current-password"
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-ink-muted hover:text-ink transition-colors p-2 rounded-md"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2 rounded-xl"
          >
            Masuk Sekarang
          </Button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-border-subtle text-sm text-ink-muted">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="text-brand-blue font-semibold hover:underline"
          >
            Daftar sekarang
          </Link>
        </div>
      </div>

      {/* Panel Akun Demo 3D */}
      <div className="mt-5 p-4 rounded-2xl surface-3d text-xs">
        <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
          <KeyRound className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
          <span>Akun Demo Pengujian (Password: LepasIn123)</span>
        </div>
        <p className="text-ink-muted mb-3 leading-relaxed">
          Pilih salah satu akun di bawah untuk mengisi email dan password secara otomatis:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setDemoAccount('admin@lepasin.id')}
            className="chip-3d p-2.5 min-h-[44px] rounded-xl text-left"
          >
            <div className="font-bold text-ink">Admin</div>
            <div className="text-[11px] text-ink-muted truncate">admin@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('dinda@lepasin.id')}
            className="chip-3d p-2.5 min-h-[44px] rounded-xl text-left"
          >
            <div className="font-bold text-ink">Seller UNHAS</div>
            <div className="text-[11px] text-ink-muted truncate">dinda@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('andi@lepasin.id')}
            className="chip-3d p-2.5 min-h-[44px] rounded-xl text-left"
          >
            <div className="font-bold text-ink">Buyer UNHAS</div>
            <div className="text-[11px] text-ink-muted truncate">andi@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('salsa@lepasin.id')}
            className="chip-3d p-2.5 min-h-[44px] rounded-xl text-left"
          >
            <div className="font-bold text-ink">Seller Pending</div>
            <div className="text-[11px] text-ink-muted truncate">salsa@lepasin.id</div>
          </button>
        </div>
      </div>
    </div>
  );
}
