# DESIGN.md — LepasIn Design System

> **Acuan Visual & Komponen UI.** Dokumen ini melengkapi `PRD.md` dan `schema.md`. Seluruh implementasi wajib menggunakan **Next.js 16 (JavaScript/JSX)**, **Tailwind CSS v4**, **`lucide-react`**, dan font **`Plus Jakarta Sans`**. Seluruh teks antarmuka menggunakan **Bahasa Indonesia**.

---

## 1. Visual Theme & Atmosphere

**LepasIn** (*"Lepas barang kostmu ke sesama mahasiswa sekampus"*) mengusung estetika **Trusted Campus Utility**—bersih, terstruktur, ringan diakses lewat ponsel mahasiswa, dan menonjolkan kepercayaan komunitas kampus se-Indonesia (UNHAS, UI, ITB, UGM, ITS, UNAIR, UB, dll.).

* **Mood & Tone**: Terpercaya, praktis, rapi, dan ramah kantong mahasiswa (*high-clarity campus marketplace*).
* **Surface Philosophy**: Menggunakan latar belakang kanvas abu-abu sangat muda (**Canvas Cool White `#F8FAFC`**) agar kartu produk, ringkasan keranjang, dan panel dashboard berwarna putih bersih (**Pure Card White `#FFFFFF`**) tampil menonjol dengan garis tepi tipis (**Hairline Border `#E2E8F0`**) tanpa bayangan yang berlebihan.
* **Visual Anchors**: Perpaduan **Deep Campus Navy (`#0F294A`)** sebagai identitas utama, **Royal Campus Blue (`#1D4ED8`)** untuk *Price Pill* dan elemen interaktif aktif, serta **Campus Gold Amber (`#FBBF24`)** sebagai aksen kehangatan, rating bintang, dan lencana verifikasi kampus.
* **Kepatuhan Non-Goals (`PRD 1.4`)**: Desain ini **tidak** menyertakan komponen chat realtime, widget payment gateway pihak ketiga, maupun kalkulator ongkir otomatis. Fokus interaksi berada pada filter kampus, keranjang belanja, metode COD/ketemuan kampus, dan pelacakan status pesanan.

---

## 2. Konfigurasi Tailwind CSS v4 (`app/globals.css`)

Sesuai `PRD.md` Bagian 2, gunakan pendekatan *CSS-first* Tailwind CSS v4 dengan mendefinisikan token desain langsung di `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Font Family */
  --font-sans: var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;

  /* Brand & Accent Colors */
  --color-navy-900: #0F294A;
  --color-navy-800: #1B4375;
  --color-brand-blue: #1D4ED8;
  --color-brand-blue-hover: #1E40AF;
  --color-brand-blue-soft: #EFF6FF;
  --color-campus-gold: #FBBF24;
  --color-campus-gold-hover: #F59E0B;
  --color-campus-gold-soft: #FEF3C7;

  /* Neutral Surfaces & Borders */
  --color-canvas: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F5F9;
  --color-border-subtle: #E2E8F0;

  /* Typography Colors */
  --color-ink: #0F172A;
  --color-ink-secondary: #334155;
  --color-ink-muted: #64748B;

  /* Semantic Status Colors */
  --color-success-bg: #DCFCE7;
  --color-success-text: #15803D;
  --color-warning-bg: #FEF3C7;
  --color-warning-text: #B45309;
  --color-info-bg: #DBEAFE;
  --color-info-text: #1D4ED8;
  --color-danger-bg: #FEF2F2;
  --color-danger-text: #DC2626;
}
```

---

## 3. Color Palette & Semantic Tokens

### Brand & Accent Colors
* **Deep Campus Navy (`#0F294A`)** — Dasar gradien *Hero Banner*, chip kategori aktif, tombol sekunder gelap, dan *footer* global.
* **Midnight Royal Blue (`#1B4375`)** — Warna kedua gradien *Hero Banner* (`linear-gradient(135deg, #0F294A 0%, #1B4375 100%)`).
* **Royal Campus Blue (`#1D4ED8`)** — Warna wajib untuk **Blue Price Pill** pada kartu & detail produk (`PRD PUB-3`, `PUB-6`), tombol aksi utama (*Tambah ke Keranjang*, *Checkout*, *Simpan Produk*), serta item sidebar aktif.
* **Campus Gold Amber (`#FBBF24`)** — Titik aksen logo `LepasIn.`, tombol CTA utama pada banner biru (*Jelajah Produk*), ikon bintang ulasan (`1–5`), dan lencana promo.

### Neutral Surfaces & Text
* **Canvas Cool White (`#F8FAFC`)** — Latar belakang utama `<body>` di seluruh halaman publik maupun dashboard.
* **Pure Card White (`#FFFFFF`)** — Permukaan kartu produk, kartu toko, form autentikasi, tabel pesanan, dan *navbar*.
* **Soft Slate Surface (`#F1F5F9`)** — Latar kolom pencarian, wadah pratinjau foto sebelum dimuat, dan header tabel.
* **Hairline Border Slate (`#E2E8F0`)** — Garis pemisah standar `1px solid` untuk semua kartu, input, dan chip non-aktif.
* **Ink Charcoal (`#0F172A`)** — Teks judul, nama produk, dan angka KPI.
* **Slate Body Gray (`#334155`)** — Teks deskripsi produk, paragraf ulasan, dan label form.
* **Muted Caption Gray (`#64748B`)** — Teks sisa stok, area kost, tanggal pesanan, dan subjudul.

### Semantic & Status Tokens (Selaras `PRD 5.1, 5.4, 5.6`)

| Konteks | Status / Label UI | Teks | Latar (`bg`) | Border |
|---|---|---|---|---|
| **Kondisi Barang** | `Seperti Baru` / `Mulus` | `#047857` | `#ECFDF5` | `#A7F3D0` |
| **Kondisi Barang** | `Layak Pakai` / `Wajar` | `#B45309` | `#FFFBEB` | `#FDE68A` |
| **Status Order** | `Menunggu Pembayaran` (`pending_payment`) | `#B45309` | `#FEF3C7` | `#FDE68A` |
| **Status Order** | `Diproses Penjual` (`processing`) | `#1D4ED8` | `#EFF6FF` | `#BFDBFE` |
| **Status Order** | `Siap Ketemuan di Kampus` (`shipped` + `meetup`) | `#0F294A` | `#DBEAFE` | `#93C5FD` |
| **Status Order** | `Sedang Dikirim` (`shipped` + `delivery`) | `#1D4ED8` | `#DBEAFE` | `#93C5FD` |
| **Status Order** | `Selesai` (`completed`) / Seller `approved` | `#15803D` | `#DCFCE7` | `#BBF7D0` |
| **Status Order / Akun** | `Dibatalkan` (`cancelled`) / Seller `rejected` | `#DC2626` | `#FEF2F2` | `#FECACA` |
| **Verifikasi Seller** | `Menunggu Verifikasi` (`pending`) | `#B45309` | `#FFFBEB` | `#FDE68A` |

---

## 4. Typography Rules

* **Font Family**: `Plus Jakarta Sans` (dimuat lewat `next/font/google` di `app/layout.js` dengan variable `--font-plus-jakarta`).
* **Format Angka & Mata Uang**: Terapkan kelas `tabular-nums` (`font-variant-numeric: tabular-nums`) pada seluruh harga Rupiah (`Rp 145.000`), sisa stok, jumlah keranjang, dan metrik dashboard.

### Type Scale
* **Hero Banner Title**: `28px`–`36px` (`text-3xl md:text-4xl`), `font-bold` (`700`), `leading-tight`, `tracking-tight`.
* **Page / Dashboard Heading**: `24px` (`text-2xl`), `font-bold` (`700`), `text-ink` (`#0F172A`).
* **Section Heading**: `18px`–`20px` (`text-lg md:text-xl`), `font-bold` (`700`), `text-ink` (`#0F172A`).
* **Product Card Title**: `14px` (`text-sm`), `font-semibold` (`600`), `leading-snug`, wajib `line-clamp-2` agar tinggi kartu seragam.
* **Blue Price Pill Text**: `13px`–`14px` (`text-sm`), `font-bold` (`700`), teks putih (`#FFFFFF`) di atas pill biru (`#1D4ED8`).
* **Detail Page Price Pill**: `20px`–`24px` (`text-xl md:text-2xl`), `font-bold` (`700`), teks putih di atas pill biru (`#1D4ED8`), berdampingan dengan harga awal dicoret (`text-sm line-through text-ink-muted`) dan badge persentase hemat (`Hemat 45%`).
* **Body & Form Label**: `14px` (`text-sm`), `font-normal` (`400`) untuk isi dan `font-medium` (`500`) untuk label input.
* **Micro Metadata & Badges**: `11px`–`12px` (`text-xs`), `font-medium` (`500`).

---

## 5. Spesifikasi Komponen UI (Terpetakan ke `PRD.md`)

### 5.1 Global Top Navigation Bar (`Navbar`)
* Tinggi `64px` (`h-16`), `sticky top-0 z-40`, latar `#FFFFFF`, border bawah `1px solid #E2E8F0`.
* **Brand Logo**: Teks `LepasIn` (`font-extrabold text-xl text-navy-900`) dengan titik aksen `6px` berwarna Campus Gold Amber (`#FBBF24`).
* **Campus Selector Pill (`PRD PUB-1`)**: Tombol kapsul (`rounded-full border border-border-subtle bg-canvas px-3.5 py-1.5`) dengan ikon `MapPin` (`lucide-react`). Menampilkan label kampus aktif (default: *"Semua Kampus"*, atau nama/singkatan kampus pilihan user seperti *"UNHAS Makassar"* / *"UI Depok"*) dan membuka dropdown/modal pencarian kampus se-Indonesia.
* **Search Bar (`PRD PUB-4`)**: Input `rounded-full bg-surface-muted px-4 py-2 text-sm` dengan ikon `Search` yang menyinkronkan parameter URL `?q=`.
* **Action Icons**:
  * **Buyer**: Ikon `Heart` (Wishlist), ikon `ShoppingCart` dengan badge bulat angka merah/emas (`CART-3`), dan menu profil (`Pesanan Saya`, `Profil & Kampus`, `Alamat Kost`, `Keluar`).
  * **Seller / Admin**: Tombol pintas menuju `/seller` atau `/admin`.
  * **Guest**: Tombol teks `Masuk` dan tombol solid `Daftar` (`bg-navy-900 text-white rounded-lg px-4 py-2 text-sm`).

### 5.2 Hero Banner & Category Chips (`PRD PUB-1`, `PUB-2`)
* **Hero Banner Card**: Kontainer `rounded-2xl` dengan latar `linear-gradient(135deg, #0F294A 0%, #1B4375 100%)`, padding `p-6 md:p-10`, menampilkan tagline *"Lepas barang kostmu ke sesama mahasiswa sekampus."* dan CTA primer berwarna emas (`bg-campus-gold hover:bg-campus-gold-hover text-ink font-bold rounded-lg px-5 py-2.5`).
* **Horizontal Category Chips**: Baris *scrollable* (`overflow-x-auto no-scrollbar gap-2 py-3`) dengan ikon `lucide-react`.
  * **Active**: `bg-navy-900 text-white rounded-lg px-3.5 py-2 text-xs font-semibold`.
  * **Inactive**: `bg-white text-ink-secondary border border-border-subtle hover:bg-canvas rounded-lg px-3.5 py-2 text-xs font-medium`.

### 5.3 Product Card (`PRD PUB-3`)
Setiap kartu produk (`rounded-xl border border-border-subtle bg-white overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md`) wajib menampilkan elemen sesuai `PUB-3`:
1. **Thumbnail (`aspect-[4/3]`)**: Latar `#F1F5F9`, gambar `object-cover w-full h-full`.
   * **Pojok Kiri Atas**: Badge kondisi barang (`rounded-full px-2.5 py-0.5 text-[11px] font-semibold`).
   * **Pojok Kanan Atas**: Tombol favorit lingkaran (`w-8 h-8 rounded-full bg-white/90 shadow-xs flex items-center justify-center`) dengan ikon `Heart` (merah solid bila tersimpan di wishlist Buyer).
   * **Pojok Kiri Bawah (Overlay/Overlap)**: **Blue Price Pill** (`bg-brand-blue text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs tabular-nums`) menampilkan harga, mis. `Rp 145.000`.
2. **Card Content (`p-3.5 space-y-2`)**:
   * **Baris Metadata Kampus & Rating**: Singkatan kampus dalam pill kecil (`bg-brand-blue-soft text-brand-blue font-semibold text-[11px] px-2 py-0.5 rounded-md`, mis. `UNHAS` atau `UI`) di kiri, serta ikon `Star` emas + rata-rata rating (`4.9`) di kanan.
   * **Judul Produk**: `text-sm font-semibold text-ink line-clamp-2 min-h-[2.5rem]`.
   * **Footer Kartu**: Info sisa stok (`Sisa 1` / `Stok: 3` dalam `text-xs text-ink-muted`; jika `0`, tampilkan badge `Habis` berwarna merah) dan indikator siap COD kampus.

### 5.4 Product Detail & Store Info (`PRD PUB-6`, `PUB-7`)
* **Layout 2 Kolom Desktop (`grid-cols-1 lg:grid-cols-12 gap-8`)**:
  * **Kolom Kiri (`lg:col-span-5`)**: Galeri foto utama (`aspect-square rounded-2xl border border-border-subtle overflow-hidden`) + deretan *thumbnail* kecil (1–5 foto) di bawahnya.
  * **Kolom Kanan (`lg:col-span-7`)**:
    * Badge kampus lengkap + badge kondisi + kategori.
    * Judul produk (`text-2xl font-bold text-ink`).
    * **Blok Harga**: **Blue Price Pill** besar (`bg-brand-blue text-white text-xl font-bold px-4 py-1.5 rounded-full inline-flex items-center`), diikuti harga beli awal dicoret (`line-through text-ink-muted text-sm`) dan pill hemat (`bg-success-bg text-success-text text-xs font-bold px-2 py-0.5 rounded-md`) jika `original_price` tersedia.
    * **Kartu Info Toko & Lokasi Kost (`STO-1`)**: Kotak `rounded-xl border border-border-subtle bg-canvas p-4` berisi avatar toko, nama toko, lencana `Terverifikasi`, nama kampus (`GraduationCap` icon), dan detail area kost (`MapPin` icon, mis. *"Sekitar Pintu 1 UNHAS / Tamalanrea"*).
    * **Action Bar**: Kontrol jumlah (`- 1 +`, dibatasi `stock`), tombol utama **Tambah ke Keranjang** (`bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold h-11 px-6 rounded-xl flex items-center gap-2`), dan tombol ikon Wishlist.

### 5.5 Cart, Floating Cart Bar & Checkout (`PRD CART-1..3`, `CHK-1..5`)
* **Keranjang Dikelompokkan per Toko (`CART-2`)**: Setiap grup toko dibungkus kartu putih (`rounded-xl border border-border-subtle p-4`) dengan header nama toko + badge singkatan kampusnya.
* **Floating Cart Bar (`CART-3`)**: Bilah mengambang di bagian bawah layar (`fixed bottom-4 inset-x-4 max-w-3xl mx-auto bg-navy-900 text-white rounded-2xl p-3.5 shadow-lg flex items-center justify-between`) yang muncul saat keranjang berisi item, menampilkan total item, total harga, dan tombol emas `Lihat Keranjang`.
* **Checkout Method Selector (`CHK-1`, `CHK-2`)**: Dua kartu pilihan interaktif (*radio cards*):
  1. **COD / Ketemuan di Kampus (`meetup`)**: Ikon `Handshake`, keterangan *"Ketemuan langsung di titik aman sekitar kampus, bayar di tempat setelah cek barang."* (Tidak mewajibkan alamat pengiriman).
  2. **Dikirim ke Alamat (`delivery`)**: Ikon `Truck`, membuka pemilih alamat kost tersimpan atau form alamat baru.

### 5.6 Order Tracking Stepper & Anti-Fraud CTA (`PRD ORD-1..7`, `REV-1`)
* **Horizontal / Vertical Order Stepper (`ORD-2`)**:
  * Step 1: `Pesanan Dibuat` (`pending_payment`)
  * Step 2: `Diproses Penjual` (`processing`)
  * Step 3: Label dinamis berdasarkan metode (`ORD-7`) — **`Siap Ketemuan di Kampus`** (jika `meetup`) atau **`Sedang Dikirim`** (jika `delivery`) untuk status `shipped`.
  * Step 4: `Selesai` (`completed`)
* **Tombol Anti-Penipuan Buyer (`ORD-6`)**: Saat status `shipped`, tampilkan banner info lembut (`bg-info-bg border border-blue-200 rounded-xl p-4`) dengan tombol menonjol **Pesanan Diterima** (`bg-success-text text-white font-semibold px-5 py-2.5 rounded-lg`) disertai teks pengingat agar Buyer memeriksa kondisi barang terlebih dahulu sebelum menekan tombol.
* **Modal / Form Ulasan (`REV-1`)**: Muncul pada item pesanan berstatus `completed`, berisi pemilih 1–5 bintang interaktif berwarna `#FBBF24` dan kolom komentar singkat.

### 5.7 Komponen Upload Foto & Kamera (`PRD PHO-1..11`, `AUTH-2`)
* **`ImageUploader` (1–5 Foto Produk / Foto Toko)**:
  * Area unggah bertipe `border-2 border-dashed border-border-subtle hover:border-brand-blue rounded-xl bg-canvas p-5 text-center`.
  * Menyediakan dua tombol jelas berdampingan:
    1. **Ambil Foto (Kamera)**: Memicu input `capture="environment"` pada perangkat mobile atau membuka `CameraModal` (`getUserMedia`) pada desktop.
    2. **Pilih dari Galeri / Drag & Drop**: Mendukung pemilihan banyak file sekaligus (maksimal 5 foto).
  * **Grid Pratinjau Thumbnail**: Menampilkan foto terunggah (`w-24 h-24 rounded-lg object-cover border`) dengan badge `Utama` pada foto pertama dan tombol hapus bulat (`bg-danger-text text-white`) di pojok kanan atas tiap foto.
* **`CameraModal` (`PHO-6`)**: Modal layar penuh/tengah (`bg-ink/80 backdrop-blur-xs`) dengan pratinjau `<video>` langsung, tombol shutter lingkaran besar (`w-14 h-14 rounded-full bg-white ring-4 ring-brand-blue`), tombol ganti kamera (*flip*), dan konfirmasi hasil jepretan sebelum kompresi JPEG (`1280px`).
* **Kartu Verifikasi KTM Seller (`/register` — `AUTH-2`)**: Muncul otomatis saat pengguna memilih peran **Penjual (Seller)**, menampilkan panduan ilustrasi singkat (*"Foto selfie sambil memegang KTM / Kartu Mahasiswa yang terbaca jelas"*) beserta komponen `ImageUploader` tunggal wajib isi.

### 5.8 Layout Dashboard Peran (`/buyer`, `/seller`, `/admin`, `/pending-seller`)
* **Dashboard Shell (`/buyer`, `/seller`, `/admin`)**:
  * Desktop: Sidebar kiri tetap (`w-64 bg-white border-r border-border-subtle min-h-[calc(100vh-4rem)] p-4`) + area konten utama (`flex-1 bg-canvas p-6`).
  * Mobile: Navigasi tab horizontal *scrollable* di bagian atas area konten agar tetap nyaman tanpa *drawer* rumit.
  * Item Navigasi Aktif: `bg-brand-blue-soft text-brand-blue font-semibold rounded-xl px-3.5 py-2.5` dengan ikon `lucide-react` `18px`.
* **Halaman `/pending-seller` (`PRD PEN-1..3`)**:
  * Kartu terpusat (`max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-border-subtle p-8 text-center`).
  * Jika status `pending`: Ikon jam pasir (`Clock` dalam lingkaran `#FEF3C7`), judul *"Akun Anda sedang ditinjau."*, ringkasan nama toko & kampus terdaftar, serta tombol `Keluar`.
  * Jika status `rejected`: Ikon peringatan (`AlertCircle` dalam lingkaran `#FEF2F2`), penjelasan penolakan, dan tombol merah **Hapus Akun** (`bg-danger-text text-white rounded-lg px-5 py-2.5`) untuk menghapus akun agar dapat mendaftar ulang.

---

## 6. Layout Principles & Agent Guardrails

1. **Container & Spacing**:
   * Lebar kontainer maksimum `1280px` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
   * Gunakan skala spasi kelipatan `4px` (`gap-4` = `16px` untuk grid produk mobile, `gap-6` = `24px` untuk grid desktop, `space-y-8` antar section).
2. **Responsive Grid Standards**:
   * **Katalog Produk (`/` & `/products`)**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6` (optimal untuk layar ponsel mahasiswa maupun layar laptop penilai).
   * **KPI Summary Cards (`/seller` & `/admin`)**: `grid-cols-1 sm:grid-cols-3 gap-4`.
3. **Pagination (`PRD PUB-3`)**:
   * Halaman `/products` menampilkan maksimal **12 produk per halaman** dengan komponen pagination bernomor (`1, 2, 3...`) dan tombol `Sebelumnya` / `Berikutnya` berbasis parameter URL `?page=`.
4. **Anti-Patterns yang Dilarang**:
   * Jangan membuat file `tailwind.config.js` terpisah jika menggunakan Tailwind CSS v4—simpan semua token tema di `@theme` dalam `app/globals.css`.
   * Jangan menampilkan tombol *"Chat Penjual"* atau lencana status online penjual karena tidak ada fitur chat di `PRD.md`.
   * Jangan me-render input user mentah sebagai HTML; selalu render sebagai teks React standar untuk mencegah XSS.