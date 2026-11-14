'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, ShieldCheck, Store, GraduationCap } from 'lucide-react';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';

export default function EditUserClient({ user, initialCampus }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState(user.role);
  const [sellerStatus, setSellerStatus] = useState(user.seller_status || 'pending');
  const [campus, setCampus] = useState(initialCampus);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          role,
          seller_status: role === 'seller' ? sellerStatus : null,
          campus_id: campus ? campus.id : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal memperbarui pengguna');
        setLoading(false);
        return;
      }

      toast.success('Data pengguna berhasil diperbarui!');
      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary hover:underline mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pengguna</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">
          Edit Pengguna: {user.name}
        </h1>
        <p className="text-xs md:text-sm text-ink-soft">
          Ubah peran, status verifikasi penjual, nomor kontak, atau asal kampus pengguna.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-danger-50 border border-danger/20 text-danger text-xs md:text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nama Lengkap"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Alamat Email (Tidak dapat diubah)"
            type="email"
            icon={Mail}
            value={user.email}
            disabled
            helperText="Alamat email terikat pada akun pengguna"
          />

          <Input
            label="Nomor WhatsApp / HP"
            type="tel"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081234567890"
          />

          <Select
            label="Peran Akun (Role)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="buyer">Pembeli (Buyer)</option>
            <option value="seller">Penjual (Seller)</option>
            <option value="admin">Administrator (Admin)</option>
          </Select>

          {role === 'seller' && (
            <Select
              label="Status Verifikasi Penjual"
              value={sellerStatus}
              onChange={(e) => setSellerStatus(e.target.value)}
            >
              <option value="pending">Menunggu Verifikasi (Pending)</option>
              <option value="approved">Terverifikasi (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </Select>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-semibold text-ink">
              Asal Kampus
            </label>
            <CampusSelector
              value={campus}
              onChange={setCampus}
              allowAll={true}
              allLabel="Tidak Mengikat Kampus"
              placeholder="Pilih kampus..."
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line/60 mt-2">
            <Link href="/admin/users">
              <Button variant="secondary" pill disabled={loading}>
                Batal
              </Button>
            </Link>
            <Button type="submit" variant="primary" pill loading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
