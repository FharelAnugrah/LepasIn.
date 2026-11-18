import Link from 'next/link';
import { GraduationCap, Heart, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-line mt-auto pt-10 md:pt-12 pb-10 md:pb-12 text-ink">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 md:mb-12">
          {/* Brand & Tagline */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <Link href="/" className="inline-flex items-center font-display text-ink font-extrabold text-2xl tracking-tight">
              <span className="text-primary">Lepas</span><span>In</span><span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
            </Link>
            <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
              Platform jual beli barang preloved khusus mahasiswa & anak kost di seluruh kampus Indonesia. Hemat budget kuliah, kurangi limbah barang kost.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary font-medium mt-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Komunitas Kampus Se-Indonesia</span>
            </div>
          </div>

          {/* Kategori Populer */}
          <div>
            <h4 className="font-sans text-xs md:text-sm font-bold text-ink uppercase tracking-wider mb-3">
              Kategori Belanja
            </h4>
            <ul className="flex flex-col gap-2 text-xs md:text-sm text-ink-soft">
              <li>
                <Link href="/products?category=1" className="hover:text-primary transition-colors">
                  Elektronik & Gadget
                </Link>
              </li>
              <li>
                <Link href="/products?category=2" className="hover:text-primary transition-colors">
                  Perabot & Kasur Kost
                </Link>
              </li>
              <li>
                <Link href="/products?category=4" className="hover:text-primary transition-colors">
                  Buku & Alat Kuliah
                </Link>
              </li>
              <li>
                <Link href="/products?category=5" className="hover:text-primary transition-colors">
                  Perlengkapan Dapur Kost
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors font-medium text-primary">
                  Semua Produk →
                </Link>
              </li>
            </ul>
          </div>

          {/* Kampus Terhubung */}
          <div>
            <h4 className="font-sans text-xs md:text-sm font-bold text-ink uppercase tracking-wider mb-3">
              Kampus Populer
            </h4>
            <ul className="flex flex-col gap-2 text-xs md:text-sm text-ink-soft">
              <li>
                <Link href="/products?campus=1" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pine" />
                  <span>UNHAS Makassar</span>
                </Link>
              </li>
              <li>
                <Link href="/products?campus=2" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pine" />
                  <span>UI Depok</span>
                </Link>
              </li>
              <li>
                <Link href="/products?campus=3" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pine" />
                  <span>ITB Bandung</span>
                </Link>
              </li>
              <li>
                <Link href="/products?campus=4" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pine" />
                  <span>UGM Yogyakarta</span>
                </Link>
              </li>
              <li>
                <Link href="/products?campus=7" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pine" />
                  <span>UB Malang</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Akun & Navigasi */}
          <div>
            <h4 className="font-sans text-xs md:text-sm font-bold text-ink uppercase tracking-wider mb-3">
              Mulai Jual Beli
            </h4>
            <ul className="flex flex-col gap-2 text-xs md:text-sm text-ink-soft">
              <li>
                <Link href="/register?role=seller" className="hover:text-primary transition-colors">
                  Buka Toko Mahasiswa
                </Link>
              </li>
              <li>
                <Link href="/register?role=buyer" className="hover:text-primary transition-colors">
                  Daftar sebagai Pembeli
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Masuk ke Akun
                </Link>
              </li>
              <li className="pt-2">
                <div className="flex items-center gap-2 p-3 rounded-[14px] bg-primary-50 text-primary text-xs font-medium">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Transaksi aman dengan fitur COD / Ketemuan Sekampus</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-6 border-t border-line/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-soft">
          <p>© 2026 LepasIn. Tugas Final Praktikum Pemrograman Web.</p>
          <p className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-danger fill-danger" />
            <span>untuk anak kost se-Indonesia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
