'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';

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

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
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
        }),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setGeneralError(data.error || 'Gagal melakukan pendaftaran');
        }
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
      setGeneralError('Terjadi gangguan koneksi. Silakan periksa jaringanmu.');
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
            className="inline-flex items-center gap-1.5 text-ink font-extrabold text-2xl tracking-tight mb-2"
          >
            <span className="text-primary">Lepas</span>
            <span>In</span>
            <span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Buat Akun LepasIn
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Bergabung dengan ribuan mahasiswa se-Indonesia untuk jual beli barang kost preloved.
          </p>
        </div>

        {/* Toggle Pilihan Peran: Pembeli vs Penjual */}
        <div className="flex p-1.5 bg-surface rounded-2xl mb-6 border border-line/60">
          <button
            type="button"
            onClick={() => {
              setRole('buyer');
              setFieldErrors({});
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'buyer'
                ? 'bg-canvas text-primary shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sebagai Pembeli</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('seller');
              setFieldErrors({});
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'seller'
                ? 'bg-canvas text-primary shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Sebagai Penjual (Buka Toko)</span>
          </button>
        </div>

        {/* Notifikasi General Error */}
        {generalError && (
          <div className="mb-5 p-3 rounded-[14px] bg-danger-50 border border-danger/20 text-danger text-xs md:text-sm font-medium">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Dinda Putri"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            required
          />

          <Input
            label="Alamat Email Mahasiswa"
            type="email"
            placeholder="nama@kampus.ac.id"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            helperText="Gunakan email aktif untuk konfirmasi dan transaksi"
            required
          />

          <Input
            label="Nomor WhatsApp / HP"
            type="tel"
            placeholder="081234567890"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={fieldErrors.phone}
            helperText="Diperlukan untuk koordinasi COD sekampus atau pengiriman"
          />

          {/* Selektor Kampus */}
          <div className="flex flex-col gap-1.5">
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
                if (fieldErrors.campus_id) {
                  setFieldErrors((prev) => ({ ...prev, campus_id: null }));
                }
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
                label="Nama Toko"
                placeholder="Contoh: Lapak Dinda UNHAS"
                icon={Store}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                error={fieldErrors.store_name}
                helperText="Nama toko yang akan dilihat pembeli di katalog"
                required={role === 'seller'}
              />

              <Input
                label="Detail Lokasi / Area Kost"
                placeholder="Contoh: Tamalanrea, Pintu 1 UNHAS"
                icon={MapPin}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={fieldErrors.location}
                helperText="Lokasi favorit COD atau patokan sekitar kampus"
              />
            </div>
          )}

          {/* Password & Konfirmasi Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 karakter"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
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
              label="Ulangi Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Konfirmasi password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
    </div>
  );
}
