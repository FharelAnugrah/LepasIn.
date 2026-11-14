'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';
import ImageUploader from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/Toast';

export default function NewProductForm({ categories = [] }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (images.length === 0) {
      toast.error('Mohon unggah minimal 1 foto barang.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category_id: Number(categoryId),
          condition,
          price: Number(price),
          original_price: originalPrice ? Number(originalPrice) : null,
          stock: Number(stock),
          description: description.trim(),
          image_urls: images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        toast.error(data.error || 'Gagal menyimpan barang');
        setLoading(false);
        return;
      }

      toast.success('Barang preloved berhasil dipajang di tokomu! 🎉');
      router.push('/seller/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-soft hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Produk</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <Package className="w-7 h-7 text-primary" />
          <span>Tambah Barang Preloved</span>
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Pajang barang kostmu agar mudah ditemukan adik tingkat atau mahasiswa sekampus.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Barang"
            placeholder="Contoh: Rice Cooker Miyako 1.2L Mulus / Kipas Angin Meja"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name?.[0]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Kategori Barang"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={errors.category_id?.[0]}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Kondisi Barang"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              error={errors.condition?.[0]}
              required
            >
              <option value="like_new">Seperti Baru (Mulus 95%+)</option>
              <option value="good">Baik (Normal dipakai, fungsi 100%)</option>
              <option value="fair">Layak Pakai (Ada tanda bekas pemakaian)</option>
              <option value="minor_defect">Ada Minus (Fungsi normal, minus fisik)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Harga Lepas (Rp)"
              type="number"
              placeholder="50000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={errors.price?.[0]}
              min="1000"
              required
            />

            <Input
              label="Harga Asli Baru (Opsional)"
              type="number"
              placeholder="120000"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              error={errors.original_price?.[0]}
              helperText="Akan ditampilkan sebagai harga coret"
            />

            <Input
              label="Jumlah Stok"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              error={errors.stock?.[0]}
              min="0"
              required
            />
          </div>

          <Textarea
            label="Deskripsi Lengkap Barang"
            placeholder="Jelaskan alasan dijual, lama pemakaian, kelengkapan kardus/kabel, minus kecil bila ada, dan lokasi COD sekampus..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description?.[0]}
            required
          />

          {/* Section Foto Produk (Kamera Langsung & Unggah File JPG/PNG) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={5}
              folder="products"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Link href="/seller/products">
            <Button variant="secondary" pill disabled={loading}>
              Batal
            </Button>
          </Link>
          <Button type="submit" variant="primary" pill loading={loading}>
            <span>Simpan & Pasang Barang</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
