'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';
import ImageUploader from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/Toast';

export default function EditProductForm({ product, images = [], categories = [] }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(product.name || '');
  const [categoryId, setCategoryId] = useState(product.category_id || categories[0]?.id || '');
  const [condition, setCondition] = useState(product.condition || 'good');
  const [price, setPrice] = useState(product.price ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    product.original_price ? String(product.original_price) : ''
  );
  const [stock, setStock] = useState(product.stock !== undefined ? String(product.stock) : '1');
  const [description, setDescription] = useState(product.description || '');

  const initialUrls = images.length > 0 ? images.map((img) => img.url) : [];
  const [uploadedImages, setUploadedImages] = useState(initialUrls);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (uploadedImages.length === 0) {
      toast.error('Mohon sediakan minimal 1 foto barang.');
      return;
    }

    // Validasi ukuran gambar maksimal 2 MB
    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i];
      if (img instanceof File && img.size > 2 * 1024 * 1024) {
        toast.error(`Ukuran foto ke-${i + 1} melebihi batas maksimal 2 MB.`);
        return;
      }
    }

    const newErrors = {};

    // 1. Validasi Harga Lepas
    const priceStr = String(price).trim();
    if (!priceStr) {
      newErrors.price = ['Harga lepas wajib diisi.'];
    } else if (/^0\d+/.test(priceStr)) {
      newErrors.price = [
        'Harga lepas tidak boleh diawali dengan angka 0 (contoh: 050000). Masukkan nominal yang valid tanpa awalan 0.',
      ];
    } else if (priceStr === '0' || Number(priceStr) < 1000) {
      newErrors.price = ['Harga lepas minimal Rp 1.000 dan tidak boleh bernilai Rp 0.'];
    } else if (Number(priceStr) > 100000000) {
      newErrors.price = ['Harga lepas maksimal Rp 100.000.000.'];
    }

    // 2. Validasi Harga Coret (Opsional)
    if (originalPrice) {
      const origStr = String(originalPrice).trim();
      if (/^0\d+/.test(origStr)) {
        newErrors.original_price = [
          'Harga coret tidak boleh diawali dengan angka 0 (contoh: 050000). Masukkan nominal yang valid tanpa awalan 0.',
        ];
      } else if (origStr === '0' || Number(origStr) < 1000) {
        newErrors.original_price = ['Harga coret minimal Rp 1.000 dan tidak boleh bernilai Rp 0.'];
      } else if (Number(origStr) > 100000000) {
        newErrors.original_price = ['Harga coret maksimal Rp 100.000.000.'];
      } else if (!newErrors.price && Number(origStr) <= Number(priceStr)) {
        newErrors.original_price = [
          'Harga coret harus lebih besar dari harga lepas (contoh: harga asli Rp 120.000, harga lepas Rp 50.000).',
        ];
      }
    }

    const stockStr = String(stock).trim();
    if (/^0\d+/.test(stockStr)) {
      newErrors.stock = ['Jumlah stok tidak boleh diawali dengan angka 0 (contoh: 05).'];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstMsg = Object.values(newErrors)[0][0];
      toast.error(firstMsg);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category_id', String(categoryId));
      formData.append('condition', condition);
      formData.append('price', priceStr);
      if (originalPrice) {
        formData.append('original_price', String(originalPrice).trim());
      }
      formData.append('stock', stockStr);
      formData.append('description', description.trim());

      // Kirim gambar melalui FormData
      uploadedImages.forEach((img) => {
        formData.append('images', img);
      });

      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        toast.error(data.error || 'Gagal memperbarui barang');
        setLoading(false);
        return;
      }

      toast.success('Informasi barang berhasil diperbarui! 🎉');
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
          <span>Ubah Data Barang Preloved</span>
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Perbarui harga, stok sisa, atau keterangan foto barang tokomu.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Barang"
            placeholder="Contoh: Rice Cooker Miyako 1.2L Mulus"
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
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
              }}
              error={errors.price?.[0]}
              min="1000"
              required
            />

            <Input
              label="Harga Asli Baru (Opsional)"
              type="number"
              value={originalPrice}
              onChange={(e) => {
                setOriginalPrice(e.target.value);
                if (errors.original_price) setErrors((prev) => ({ ...prev, original_price: undefined }));
              }}
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
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description?.[0]}
            required
          />

          {/* Section Foto Produk (Kamera Langsung & Unggah File JPG/PNG) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
            <ImageUploader
              images={uploadedImages}
              onChange={setUploadedImages}
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
            <span>Simpan Perubahan</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
