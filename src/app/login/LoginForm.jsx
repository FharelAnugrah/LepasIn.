'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

      toast.success('Selamat datang kembali!');
      router.push(data.redirectTo || '/');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  // Helper cepat untuk akun demo (mempermudah penilai)
  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('LepasIn123');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Kartu Form Login */}
      <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card">
        {/* Header Form */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-ink font-extrabold text-2xl tracking-tight mb-2"
          >
            <span className="text-primary">Lepas</span><span>In</span><span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Lepas barang kostmu ke sesama mahasiswa sekampus.
          </p>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="mb-4 p-3 rounded-[14px] bg-danger-50 border border-danger/20 text-danger text-xs md:text-sm font-medium flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Alamat Email"
            type="email"
            placeholder="nama@kampus.ac.id"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer text-ink-soft hover:text-ink transition-colors p-1"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            pill
            loading={loading}
            className="w-full mt-2"
          >
            Masuk Sekarang
          </Button>
        </form>

        {/* Tautan ke Halaman Register */}
        <div className="text-center mt-6 pt-5 border-t border-line/70 text-xs md:text-sm text-ink-soft">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Daftar sekarang
          </Link>
        </div>
      </div>

      {/* Panel Cepat Akun Demo (Untuk Penilai Penguji) */}
      <div className="mt-6 p-4 rounded-card bg-surface border border-line text-xs">
        <div className="flex items-center gap-1.5 font-bold text-ink mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Akun Demo Cepat (Password: LepasIn123)</span>
        </div>
        <p className="text-ink-soft mb-3 leading-relaxed">
          Klik tombol di bawah ini untuk mengisi kredensial demo secara instan:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDemoAccount('admin@lepasin.id')}
            className="p-2 rounded-xl bg-canvas border border-line hover:border-primary text-left transition"
          >
            <div className="font-bold text-ink">Admin</div>
            <div className="text-[10px] text-ink-soft truncate">admin@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('dinda@lepasin.id')}
            className="p-2 rounded-xl bg-canvas border border-line hover:border-primary text-left transition"
          >
            <div className="font-bold text-ink">Seller UNHAS</div>
            <div className="text-[10px] text-ink-soft truncate">dinda@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('andi@lepasin.id')}
            className="p-2 rounded-xl bg-canvas border border-line hover:border-primary text-left transition"
          >
            <div className="font-bold text-ink">Buyer UNHAS</div>
            <div className="text-[10px] text-ink-soft truncate">andi@lepasin.id</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoAccount('salsa@lepasin.id')}
            className="p-2 rounded-xl bg-canvas border border-line hover:border-primary text-left transition"
          >
            <div className="font-bold text-ink">Seller Pending</div>
            <div className="text-[10px] text-ink-soft truncate">salsa@lepasin.id</div>
          </button>
        </div>
      </div>
    </div>
  );
}
