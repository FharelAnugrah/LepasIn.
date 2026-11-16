'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

export default function WishlistManager({ initialProducts = [], user }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);

  const handleWishlistToggle = (productId, nextState) => {
    // Jika status berubah menjadi false (dihapus dari favorit),
    // segera keluarkan item dari tampilan list dan perbarui counter
    if (!nextState) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-danger fill-danger" />
            <span>Barang Favorit Saya</span>
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Daftar barang kost yang telah kamu simpan untuk dibeli nanti.
          </p>
        </div>
        <span className="text-xs text-ink-soft font-semibold">
          {products.length} barang disimpan
        </span>
      </div>

      {products.length === 0 ? (
        <div className="bg-canvas border border-line rounded-card p-12 text-center max-w-md mx-auto shadow-card my-8">
          <div className="w-16 h-16 rounded-full bg-danger-50 text-danger flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1">Belum Ada Barang Favorit</h2>
          <p className="text-xs text-ink-soft mb-6 leading-relaxed">
            Klik ikon hati di sudut kanan atas foto produk untuk menyimpan barang incaranmu.
          </p>
          <Link href="/products">
            <Button variant="primary" pill>
              <span>Jelajah Katalog</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isWishlisted={true}
              user={user}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
