import Link from 'next/link';
import { GraduationCap, Handshake, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white border-t-4 border-navy-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] mt-auto pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8">
          {/* Identitas Brand & Jaminan COD Kampus */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <Link
              href="/"
              className="group inline-flex items-baseline font-extrabold text-xl text-white tracking-tight w-fit"
            >
              <span>LepasIn</span>
              <span
                className="w-2 h-2 rounded-[4px] bg-campus-gold inline-block ml-0.5 mb-0.5 shadow-[0_2px_0_#B87D04] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:rotate-12"
                aria-hidden="true"
              />
            </Link>
            <p className="text-sm text-slate-200 leading-relaxed max-w-md">
              Lepas barang kostmu ke sesama Mahasiswa sekampus. Marketplace preloved Mahasiswa di seluruh perguruan tinggi Indonesia dengan opsi COD di titik aman kampus atau pengiriman ke kost.
            </p>
          </div>

          {/* Katalog & Kampus */}
          <div className="md:col-span-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Jelajah Kampus dan Kategori
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-200">
              <Link href="/products" className="hover:text-campus-gold transition-colors py-0.5">
                Semua Produk
              </Link>
              <Link
                href="/products?campus=1"
                className="hover:text-campus-gold transition-colors py-0.5 inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-campus-gold shrink-0" aria-hidden="true" />
                <span>UNHAS Makassar</span>
              </Link>
              <Link href="/products?category=1" className="hover:text-campus-gold transition-colors py-0.5">
                Elektronik
              </Link>
              <Link
                href="/products?campus=2"
                className="hover:text-campus-gold transition-colors py-0.5 inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-campus-gold shrink-0" aria-hidden="true" />
                <span>UI Depok</span>
              </Link>
              <Link href="/products?category=2" className="hover:text-campus-gold transition-colors py-0.5">
                Perabot Kost
              </Link>
              <Link
                href="/products?campus=3"
                className="hover:text-campus-gold transition-colors py-0.5 inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-campus-gold shrink-0" aria-hidden="true" />
                <span>ITB Bandung</span>
              </Link>
              <Link href="/products?category=4" className="hover:text-campus-gold transition-colors py-0.5">
                Buku & Kuliah
              </Link>
              <Link
                href="/products?campus=4"
                className="hover:text-campus-gold transition-colors py-0.5 inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-campus-gold shrink-0" aria-hidden="true" />
                <span>UGM Yogyakarta</span>
              </Link>
            </div>
          </div>

          {/* Akun & Lapak */}
          <div className="md:col-span-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Akun dan Lapak
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-slate-200">
              <li>
                <Link href="/register?role=seller" className="hover:text-campus-gold transition-colors">
                  Buka Toko Mahasiswa
                </Link>
              </li>
              <li>
                <Link href="/register?role=buyer" className="hover:text-campus-gold transition-colors">
                  Daftar sebagai Pembeli
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-campus-gold transition-colors">
                  Masuk ke Akun
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <p>2026 LepasIn. Marketplace Preloved Mahasiswa Indonesia.</p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-campus-gold shrink-0" aria-hidden="true" />
            <span>Verifikasi identitas KTM untuk penjual terpercaya</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
