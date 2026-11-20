'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';
import { preventEnterSubmitOnInput } from '@/lib/form-utils';
import { validateFullName, validatePhone } from '@/lib/validation';

export default function EditUserClient({ user, initialCampus }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState(user.role);
  const [sellerStatus, setSellerStatus] = useState(user.seller_status || 'pending');
  const [campus, setCampus] = useState(initialCampus);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errs = {};
    const nameErr = validateFullName(name);
    if (nameErr) errs.name = nameErr;
    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) errs.phone = phoneErr;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
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
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs md:text-sm font-semibold text-brand-blue hover:text-brand-blue-hover transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Pengguna</span>
        </Link>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          Edit Pengguna: {user.name}
        </h1>
        <p className="text-xs md:text-sm text-ink-muted mt-1">
          Ubah peran, status verifikasi penjual, nomor kontak, atau asal kampus pengguna.
        </p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8">
        {error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-danger-bg border border-red-200 text-danger-text text-xs md:text-sm font-medium"
          >
            {error}
          </div>
        )}

        <form
          noValidate
          onSubmit={handleSubmit}
          onKeyDown={preventEnterSubmitOnInput}
          className="flex flex-col gap-4"
        >
          <Input
            id="admin-edit-name"
            label="Nama Lengkap"
            icon={User}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                const err = validateFullName(e.target.value);
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.name = err;
                  else delete n.name;
                  return n;
                });
              }
            }}
            onBlur={() => {
              const err = validateFullName(name);
              setFieldErrors((prev) => {
                const n = { ...prev };
                if (err) n.name = err;
                else delete n.name;
                return n;
              });
            }}
            error={fieldErrors.name}
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
            id="admin-edit-phone"
            label="Nomor WhatsApp / HP"
            type="tel"
            icon={Phone}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) {
                const err = e.target.value ? validatePhone(e.target.value) : null;
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.phone = err;
                  else delete n.phone;
                  return n;
                });
              }
            }}
            onBlur={() => {
              if (phone) {
                const err = validatePhone(phone);
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.phone = err;
                  else delete n.phone;
                  return n;
                });
              }
            }}
            error={fieldErrors.phone}
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
            <span className="text-xs md:text-sm font-semibold text-ink">
              Asal Kampus
            </span>
            <CampusSelector
              value={campus}
              onChange={setCampus}
              allowAll={true}
              allLabel="Tidak Mengikat Kampus"
              placeholder="Pilih kampus..."
              fullWidth={true}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-2">
            <Button
              href="/admin/users"
              variant="secondary"
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
