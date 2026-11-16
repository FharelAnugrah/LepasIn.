'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, MapPin, FileText, GraduationCap } from 'lucide-react';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';

export default function StoreSettingsClient({ store, initialCampus, campuses }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(store?.name || '');
  const [location, setLocation] = useState(store?.location || '');
  const [description, setDescription] = useState(store?.description || '');
  const [campus, setCampus] = useState(initialCampus);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campus) {
      toast.error('Kampus wajib dipilih');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/seller/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          campus_id: campus.id,
          location: location.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menyimpan perubahan toko');
        setLoading(false);
        return;
      }

      toast.success('Informasi toko berhasil diperbarui!');
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card max-w-xl">
      <div className="mb-6 pb-4 border-b border-line">
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <span>Pengaturan Lapak & Lokasi COD</span>
        </h1>
        <p className="text-xs text-ink-soft mt-1">
          Sesuaikan nama toko, asal kampus, dan titik kumpul COD favorit di sekitar kampus.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nama Toko / Lapak"
          placeholder="Contoh: Lapak Dinda UNHAS"
          icon={Store}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs md:text-sm font-semibold text-ink">
            Kampus Toko Terdaftar (Wajib)
          </label>
          <CampusSelector
            value={campus}
            onChange={setCampus}
            campuses={campuses}
            allowAll={false}
            placeholder="Pilih kampus..."
            className="w-full"
          />
        </div>

        <Input
          label="Detail Lokasi / Area Kost"
          placeholder="Contoh: Tamalanrea, Pintu 1 UNHAS atau Kukusan Teknik"
          icon={MapPin}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          helperText="Area patokan untuk mempermudah pembeli COD di sekitarmu"
        />

        <Textarea
          label="Deskripsi / Catatan Lapak"
          placeholder="Tuliskan info barang yang sering kamu jual atau aturan COD toko..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="pt-3 border-t border-line/60">
          <Button type="submit" variant="primary" pill loading={loading} className="w-full">
            Simpan Informasi Toko
          </Button>
        </div>
      </form>
    </div>
  );
}
