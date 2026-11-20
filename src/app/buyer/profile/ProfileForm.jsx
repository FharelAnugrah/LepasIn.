'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';
import { validateFullName, validatePhone } from '@/lib/validation';

export default function ProfileForm({ user, initialCampus }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [campus, setCampus] = useState(initialCampus);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

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

    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/buyer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          campus_id: campus ? campus.id : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan profil');
        setLoading(false);
        return;
      }

      toast.success('Profil berhasil diperbarui.');
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          Profil dan Kampus Utama
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Perbarui identitas kontak serta kampus asalmu agar rekomendasi produk lebih relevan.
        </p>
      </div>

      <div className="surface-3d rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
          <div className="w-14 h-14 rounded-2xl icon-plinth-gold text-ink font-extrabold text-xl flex items-center justify-center uppercase shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink truncate">{user.name}</h2>
            <p className="text-xs text-ink-muted truncate">{user.email}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-brand-blue-soft text-brand-blue border border-brand-blue-border text-xs font-semibold mt-1.5 shadow-[0_1.5px_0_#C5D6EA]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="capitalize">Peran: {user.role}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/buyer/addresses"
            className="flex items-center justify-between p-3.5 rounded-2xl card-3d group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl icon-plinth-3d text-brand-blue flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-sm font-semibold text-ink block group-hover:text-brand-blue transition-colors">
                  Alamat Pengiriman Kost / Rumah
                </span>
                <span className="text-xs text-ink-muted">
                  Kelola alamat tersimpan untuk pengiriman barang
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-brand-blue transition-colors" aria-hidden="true" />
          </Link>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="profile-name"
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
            label="Email Mahasiswa"
            type="email"
            icon={Mail}
            value={user.email}
            disabled
            helperText="Alamat email tidak dapat diubah"
          />

          <Input
            id="profile-phone"
            label="Nomor WhatsApp / HP"
            type="tel"
            icon={Phone}
            placeholder="081234567890"
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
            helperText="Digunakan penjual untuk koordinasi saat COD ketemuan"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-secondary">
              Kampus Utama
            </span>
            <CampusSelector
              value={campus}
              onChange={setCampus}
              allowAll={true}
              allLabel="Pilih Kampus"
              placeholder="Pilih kampus tempat kuliahmu..."
              fullWidth={true}
              className="w-full"
            />
            <p className="text-xs text-ink-muted mt-0.5">
              Membantu menampilkan rekomendasi barang sekampus secara otomatis di beranda.
            </p>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto px-6">
              Simpan Perubahan Profil
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
