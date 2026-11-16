'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, GraduationCap, ShieldCheck, Check, MapPin, ChevronRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';

export default function ProfileForm({ user, initialCampus }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [campus, setCampus] = useState(initialCampus);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      toast.success('Profil berhasil diperbarui!');
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-line">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary font-bold text-2xl flex items-center justify-center uppercase shadow-xs">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">{user.name}</h2>
          <p className="text-xs text-ink-soft">{user.email}</p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-bold mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="capitalize">Peran: {user.role}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Link
          href="/buyer/addresses"
          className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface hover:border-primary transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-ink block group-hover:text-primary transition-colors">
                Alamat Pengiriman Kost / Rumah
              </span>
              <span className="text-[11px] text-ink-soft">
                Kelola alamat tersimpan untuk pengiriman barang
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-soft group-hover:text-primary transition-colors" />
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nama Lengkap"
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          label="Nomor WhatsApp / HP"
          type="tel"
          icon={Phone}
          placeholder="081234567890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText="Digunakan penjual untuk menghubungi saat COD ketemuan"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs md:text-sm font-semibold text-ink">
            Kampus Utama
          </label>
          <CampusSelector
            value={campus}
            onChange={setCampus}
            allowAll={true}
            allLabel="Pilih Kampus"
            placeholder="Pilih kampus tempat kuliahmu..."
            className="w-full"
          />
          <p className="text-xs text-ink-soft mt-0.5">
            Membantu LepasIn menampilkan rekomendasi barang sekampus secara otomatis di beranda.
          </p>
        </div>

        <div className="pt-3 border-t border-line/60">
          <Button type="submit" variant="primary" pill loading={loading} className="w-full sm:w-auto px-6">
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>
    </div>
  );
}
