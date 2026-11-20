'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, FileText, ImagePlus, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';
import ImageUploader from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/Toast';
import {
  PRODUCT_NAME_MIN_LENGTH,
  normalizeProductName,
  validateProductName,
} from '@/lib/product-validation';

const VALID_CONDITIONS = ['like_new', 'good', 'fair', 'minor_defect'];

/**
 * Validasi nominal harga Rupiah bulat (tanpa awalan 0, Rp 1.000 - Rp 100.000.000).
 */
function validateRupiahField(rawValue, label, { required = false } = {}) {
  const str = String(rawValue ?? '').trim();
  if (!str) {
    return { error: required ? `${label} wajib diisi.` : null, str: '' };
  }
  if (/^0\d+/.test(str)) {
    return {
      error: `${label} tidak boleh diawali dengan angka 0 (contoh: 050000). Masukkan nominal yang valid tanpa awalan 0.`,
      str,
    };
  }
  if (!/^-?\d+$/.test(str)) {
    return { error: `${label} harus berupa angka bulat.`, str };
  }
  const num = Number(str);
  if (num < 1000) {
    return { error: `${label} minimal Rp 1.000 dan tidak boleh bernilai Rp 0.`, str };
  }
  if (num > 100000000) {
    return { error: `${label} maksimal Rp 100.000.000.`, str };
  }
  return { error: null, str, num };
}

/**
 * Validasi input stok produk (bilangan bulat dengan batas minimum sesuai mode).
 */
function validateStockField(rawValue, minStock) {
  const str = String(rawValue ?? '').trim();
  if (!str) {
    return { error: 'Jumlah stok wajib diisi.', str: '' };
  }
  if (/^0\d+/.test(str)) {
    return { error: 'Jumlah stok tidak boleh diawali dengan angka 0 (contoh: 05).', str };
  }
  if (!/^-?\d+$/.test(str)) {
    return { error: 'Stok harus berupa bilangan bulat.', str };
  }
  const num = Number(str);
  if (num < minStock) {
    return {
      error:
        minStock >= 1
          ? 'Jumlah stok minimal 1 barang dan tidak boleh bernilai 0.'
          : 'Jumlah stok minimal 0.',
      str,
    };
  }
  if (num > 10000) {
    return { error: 'Jumlah stok maksimal 10.000.', str };
  }
  return { error: null, str };
}

function validateProductFields({
  name,
  categoryId,
  condition,
  price,
  originalPrice,
  stock,
  description,
  images,
  minStock,
  emptyImageMessage,
}) {
  const newErrors = {};

  const nameCheck = validateProductName(name);
  if (!nameCheck.valid) {
    newErrors.name = [nameCheck.error];
  }

  if (!categoryId || Number(categoryId) <= 0 || !Number.isInteger(Number(categoryId))) {
    newErrors.category_id = ['Kategori wajib dipilih.'];
  }

  if (!VALID_CONDITIONS.includes(condition)) {
    newErrors.condition = ['Kondisi barang wajib dipilih.'];
  }

  const priceCheck = validateRupiahField(price, 'Harga lepas', { required: true });
  if (priceCheck.error) {
    newErrors.price = [priceCheck.error];
  }

  const origCheck = validateRupiahField(originalPrice, 'Harga coret', { required: false });
  if (origCheck.error) {
    newErrors.original_price = [origCheck.error];
  } else if (origCheck.str && !newErrors.price && origCheck.num <= priceCheck.num) {
    newErrors.original_price = [
      'Harga coret harus lebih besar dari harga lepas (contoh: harga asli Rp 120.000, harga lepas Rp 50.000).',
    ];
  }

  const stockCheck = validateStockField(stock, minStock);
  if (stockCheck.error) {
    newErrors.stock = [stockCheck.error];
  }

  const descTrimmed = description.trim();
  if (!descTrimmed) {
    newErrors.description = ['Deskripsi barang wajib diisi.'];
  } else if (descTrimmed.length < 10) {
    newErrors.description = ['Deskripsi minimal 10 karakter.'];
  }

  if (images.length === 0) {
    newErrors.image_urls = [emptyImageMessage];
  } else {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img instanceof File && img.size > 2 * 1024 * 1024) {
        newErrors.image_urls = [`Ukuran foto ke-${i + 1} melebihi batas maksimal 2 MB.`];
        break;
      }
    }
  }

  return {
    errors: newErrors,
    normalizedName: nameCheck.normalizedName,
    priceStr: priceCheck.str,
    origStr: origCheck.str,
    stockStr: stockCheck.str,
  };
}

/**
 * Form modular 4 kartu (tata letak 2 kolom) untuk tambah maupun edit produk penjual.
 */
export default function ProductForm({
  mode = 'create',
  product = null,
  initialImages = [],
  categories = [],
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = mode === 'edit';
  const minStock = isEdit ? 0 : 1;

  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(
    product?.category_id || categories[0]?.id || ''
  );
  const [condition, setCondition] = useState(product?.condition || 'good');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    product?.original_price ? String(product.original_price) : ''
  );
  const [stock, setStock] = useState(
    product?.stock !== undefined ? String(product.stock) : '1'
  );
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState(
    initialImages.length > 0 ? initialImages.map((img) => img.url) : []
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nameTouched, setNameTouched] = useState(false);

  const emptyImageMessage = isEdit
    ? 'Mohon sediakan minimal 1 foto barang.'
    : 'Mohon unggah minimal 1 foto barang.';

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNameChange = (e) => {
    const nextValue = e.target.value;
    setName(nextValue);

    const liveValidation = validateProductName(nextValue);
    if (liveValidation.valid) {
      clearFieldError('name');
      return;
    }

    const hasExistingError = Boolean(errors.name);
    const shouldShowLiveError =
      liveValidation.code === 'DISALLOWED_CHARS' ||
      liveValidation.code === 'TOO_LONG' ||
      (liveValidation.code === 'NO_ALPHANUMERIC' &&
        liveValidation.normalizedName.length >= PRODUCT_NAME_MIN_LENGTH) ||
      nameTouched ||
      hasExistingError;

    if (shouldShowLiveError) {
      setErrors((prev) => ({ ...prev, name: [liveValidation.error] }));
    } else {
      clearFieldError('name');
    }
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    const normalized = normalizeProductName(name);
    if (normalized !== name) {
      setName(normalized);
    }

    const blurValidation = validateProductName(normalized);
    if (!blurValidation.valid) {
      setErrors((prev) => ({ ...prev, name: [blurValidation.error] }));
    } else {
      clearFieldError('name');
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target?.tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrors({});
    setNameTouched(true);

    const validation = validateProductFields({
      name,
      categoryId,
      condition,
      price,
      originalPrice,
      stock,
      description,
      images,
      minStock,
      emptyImageMessage,
    });

    if (validation.normalizedName !== name) {
      setName(validation.normalizedName);
    }

    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      const firstMsg = Object.values(validation.errors)[0][0];
      toast.error(firstMsg);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', validation.normalizedName);
      formData.append('category_id', String(categoryId));
      formData.append('condition', condition);
      formData.append('price', validation.priceStr);
      if (validation.origStr) {
        formData.append('original_price', validation.origStr);
      }
      formData.append('stock', validation.stockStr);
      formData.append('description', description.trim());

      images.forEach((img) => {
        formData.append('images', img);
      });

      const endpoint = isEdit
        ? `/api/seller/products/${product.id}`
        : '/api/seller/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        toast.error(
          data.error || (isEdit ? 'Gagal memperbarui barang' : 'Gagal menyimpan barang')
        );
        setLoading(false);
        return;
      }

      toast.success(
        isEdit
          ? 'Informasi barang berhasil diperbarui.'
          : 'Barang preloved berhasil dipajang di tokomu.'
      );
      router.push('/seller/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-secondary hover:text-brand-blue transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Daftar Produk</span>
        </Link>
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-brand-blue" aria-hidden="true" />
          <span>{isEdit ? 'Ubah Data Barang Preloved' : 'Tambah Barang Preloved'}</span>
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {isEdit
            ? 'Perbarui harga, sisa stok, deskripsi, atau foto barang tokomu.'
            : 'Pajang barang kostmu agar mudah ditemukan Mahasiswa sekampus.'}
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Kolom Kiri (2/3): Informasi Barang & Foto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kartu 1: Informasi Barang */}
            <section
              aria-labelledby="card-product-info"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="card-product-info" className="text-base font-bold text-ink">
                    Informasi Barang
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Nama, kategori, kondisi, dan deskripsi barang yang kamu lepas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label="Nama Barang"
                  placeholder="Contoh: Rice Cooker Miyako 1.2L Mulus"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  error={errors.name?.[0]}
                  minLength={PRODUCT_NAME_MIN_LENGTH}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Kategori Barang"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      clearFieldError('category_id');
                    }}
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
                    onChange={(e) => {
                      setCondition(e.target.value);
                      clearFieldError('condition');
                    }}
                    error={errors.condition?.[0]}
                    required
                  >
                    <option value="like_new">Seperti Baru (Mulus 95%+)</option>
                    <option value="good">Baik (Normal dipakai, fungsi 100%)</option>
                    <option value="fair">Layak Pakai (Ada tanda bekas pemakaian)</option>
                    <option value="minor_defect">Ada Minus (Fungsi normal, minus fisik)</option>
                  </Select>
                </div>

                <Textarea
                  label="Deskripsi Lengkap Barang"
                  placeholder="Jelaskan alasan dijual, lama pemakaian, kelengkapan kardus/kabel, minus kecil bila ada, dan area COD sekampus..."
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFieldError('description');
                  }}
                  error={errors.description?.[0]}
                  minLength={10}
                  required
                />
              </div>
            </section>

            {/* Kartu 2: Foto Barang Preloved */}
            <section
              aria-labelledby="card-product-photos"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="card-product-photos" className="text-base font-bold text-ink">
                    Foto Barang Preloved
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Unggah 1 hingga 5 foto kondisi barang secara jelas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <ImageUploader
                  images={images}
                  onChange={(nextImages) => {
                    setImages(nextImages);
                    clearFieldError('image_urls');
                  }}
                  maxImages={5}
                  folder="products"
                />
                {errors.image_urls?.[0] && (
                  <p role="alert" className="text-xs text-danger-text font-medium mt-1">
                    {errors.image_urls[0]}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Kolom Kanan (1/3 sticky): Harga & Stok + Kartu Aksi */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
            {/* Kartu 3: Harga & Stok */}
            <section
              aria-labelledby="card-product-pricing"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="card-product-pricing" className="text-base font-bold text-ink">
                    Harga &amp; Stok
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Atur harga jual dan ketersediaan barang.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label="Harga Lepas (Rp)"
                  type="number"
                  placeholder="50000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    clearFieldError('price');
                  }}
                  error={errors.price?.[0]}
                  min="1000"
                  step="1"
                  required
                />

                <Input
                  label="Harga Asli Baru (Opsional)"
                  type="number"
                  placeholder="120000"
                  value={originalPrice}
                  onChange={(e) => {
                    setOriginalPrice(e.target.value);
                    clearFieldError('original_price');
                  }}
                  error={errors.original_price?.[0]}
                  min="1000"
                  step="1"
                  helperText="Akan ditampilkan sebagai harga coret"
                />

                <Input
                  label="Jumlah Stok"
                  type="number"
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    clearFieldError('stock');
                  }}
                  error={errors.stock?.[0]}
                  min={String(minStock)}
                  step="1"
                  helperText={isEdit ? 'Minimal 0 (isi 0 jika barang habis)' : 'Minimal 1 barang'}
                  required
                />
              </div>
            </section>

            {/* Kartu 4: Kartu Aksi */}
            <section
              aria-label="Aksi simpan produk"
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex flex-wrap justify-end gap-3">
                <Button href="/seller/products" variant="secondary" disabled={loading}>
                  Batal
                </Button>
                <Button type="submit" variant="navy" loading={loading}>
                  {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
