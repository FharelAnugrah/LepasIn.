'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

export default function WishlistManager({ initialProducts = [], user }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);

  const handleWishlistToggle = (productId, nextState) => {
    if (!nextState) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-danger-text fill-danger-text" aria-hidden="true" />
            <span>Barang Favorit Saya</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Daftar barang kost yang disimpan untuk dibeli nanti.
          </p>
        </div>
        <span className="text-xs text-ink-secondary font-semibold tabular-nums">
          {products.length} barang disimpan
        </span>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-xl p-10 text-center max-w-md mx-auto my-6">
          <div className="w-14 h-14 rounded-xl bg-danger-bg text-danger-text border border-red-200 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink mb-1">Belum Ada Barang Favorit</h2>
          <p className="text-xs md:text-sm text-ink-muted mb-5 leading-relaxed">
            Tekan ikon hati pada kartu produk untuk menyimpan barang incaranmu.
          </p>
          <Button href="/products" variant="primary">Jelajah Katalog</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
