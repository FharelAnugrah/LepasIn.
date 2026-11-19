import { Suspense } from 'react';
import { Compass, Home, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Suspense fallback={<div className="h-16 bg-surface border-b border-border-subtle" />}>
        <Navbar showSearchBar={false} />
      </Suspense>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-xl mx-auto outline-none"
      >
        <div className="surface-3d rounded-3xl p-8 sm:p-10 w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mb-6">
            <Compass className="w-8 h-8" aria-hidden="true" />
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-2">
            Error 404
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-sm text-ink-muted leading-relaxed max-w-md mb-8">
            Barang kost atau tautan yang kamu tuju mungkin sudah dilepas ke Mahasiswa lain, dihapus, atau alamat URL yang diketik kurang tepat.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <Button href="/" variant="primary" size="md">
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke Beranda</span>
            </Button>
            <Button href="/products" variant="secondary" size="md">
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Jelajah Produk Lain</span>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
