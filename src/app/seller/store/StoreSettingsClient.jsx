'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, MapPin } from 'lucide-react';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CampusSelector from '@/components/ui/CampusSelector';
import { useToast } from '@/components/ui/Toast';
import { validateStoreName, validateLocation } from '@/lib/validation';

export default function StoreSettingsClient({ store, initialCampus, campuses }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(store?.name || '');
  const [location, setLocation] = useState(store?.location || '');
  const [description, setDescription] = useState(store?.description || '');
  const [campus, setCampus] = useState(initialCampus);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    const nameErr = validateStoreName(name);
    if (nameErr) errs.name = nameErr;

    if (!campus || !campus.id || Number(campus.id) <= 0) {
      errs.campus = 'Kampus toko wajib dipilih.';
    }

    if (location) {
      const locErr = validateLocation(location);
      if (locErr) errs.location = locErr;
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

      toast.success('Informasi toko berhasil diperbarui.');
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
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-brand-blue" aria-hidden="true" />
          <span>Pengaturan Lapak dan Lokasi COD</span>
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Sesuaikan nama toko, asal kampus, dan area kost untuk mempermudah COD sekampus.
        </p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl p-6 md:p-8">
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="store-name-input"
            label="Nama Toko / Lapak"
            placeholder="Contoh: Lapak Dinda UNHAS"
            icon={Store}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                const err = validateStoreName(e.target.value);
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.name = err;
                  else delete n.name;
                  return n;
                });
              }
            }}
            onBlur={() => {
              const err = validateStoreName(name);
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

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-secondary">
              Kampus Toko Terdaftar (Wajib)
            </span>
            <CampusSelector
              value={campus}
              onChange={(val) => {
                setCampus(val);
                if (fieldErrors.campus) {
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.campus;
                    return n;
                  });
                }
              }}
              campuses={campuses}
              allowAll={false}
              placeholder="Pilih kampus..."
              fullWidth={true}
              className="w-full"
            />
            {fieldErrors.campus && (
              <p role="alert" className="text-xs text-danger-text font-medium mt-0.5">
                {fieldErrors.campus}
              </p>
            )}
          </div>

          <Input
            id="store-location-input"
            label="Detail Lokasi / Area Kost"
            placeholder="Contoh: Tamalanrea, Pintu 1 UNHAS atau Kukusan Teknik"
            icon={MapPin}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (fieldErrors.location) {
                const err = e.target.value ? validateLocation(e.target.value) : null;
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.location = err;
                  else delete n.location;
                  return n;
                });
              }
            }}
            onBlur={() => {
              if (location) {
                const err = validateLocation(location);
                setFieldErrors((prev) => {
                  const n = { ...prev };
                  if (err) n.location = err;
                  else delete n.location;
                  return n;
                });
              }
            }}
            error={fieldErrors.location}
            helperText="Area patokan untuk mempermudah pembeli COD di sekitarmu"
          />

          <Textarea
            label="Deskripsi / Catatan Lapak"
            placeholder="Tuliskan info barang yang sering kamu jual atau jam ketemuan COD toko..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="pt-4 border-t border-border-subtle">
            <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto px-6">
              Simpan Informasi Toko
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
