import { Suspense } from 'react';
import Link from 'next/link';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Suspense fallback={<div className="h-16 bg-canvas border-b border-line" />}>
        <Navbar showSearchBar={false} />
      </Suspense>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-xl mx-auto">
        {/* Lingkaran Ikon 404 */}
        <div className="w-20 h-20 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-6 shadow-sm">
          <Compass className="w-10 h-10 animate-spin-slow stroke-[1.8]" />
        </div>

        {/* Display Angka 404 */}
        <div className="inline-block bg-primary/10 text-primary font-black text-sm px-3.5 py-1 rounded-full mb-3 tracking-wider">
          ERROR 404
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight mb-2">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-xs md:text-sm text-ink-soft leading-relaxed max-w-md mb-8">
          Barang kost atau tautan yang kamu tuju mungkin sudah dilepas ke mahasiswa lain, dihapus, atau alamat URL yang diketik kurang tepat.
        </p>

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Link href="/">
            <Button variant="primary" size="md" pill>
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" size="md" pill>
              <Search className="w-4 h-4" />
              <span>Jelajah Produk Lain</span>
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
