# design.md — Desain Antarmuka LepasIn

> Panduan visual dan UX untuk agent di IDE. Dibaca bersama `PRD.md` (fitur dan alur) dan `schema.md` (data).
> Penilaian Frontend = **30%** (UI/UX dan responsivitas). Karena itu dokumen ini dibuat spesifik: ikuti token, komponen, dan tata letak di bawah ini, jangan memakai tampilan "template bawaan".
> Stack tampilan: Next.js (JSX) + **Tailwind CSS v4**. Tidak memakai library komponen UI siap pakai (shadcn, MUI, Chakra, DaisyUI, dsb.); komponen dibuat sendiri dari Tailwind agar konsisten dan mudah dijelaskan.

---

## 1. Arah Visual

**Konsep: "Modern Campus Marketplace — Bersih, Segar, dan Terpercaya."**
LepasIn mengadopsi estetika aplikasi *mobile-first* yang bersih dan modern: kanvas putih terang dengan permukaan kartu abu-abu lembut (`#F7F8FA`), dipadukan dengan biru kobalt (`#1E5EFF`) sebagai warna identitas utama yang tegas dan energik, serta aksen kuning cerah (`#FFD60A`) untuk tombol aksi promo dan sorotan rating.

**Tiga ciri khas (wajib konsisten di seluruh halaman):**

1. **Kanvas terang + kartu lembut bersudut membulat.** Latar utama `canvas` (`#FFFFFF`), permukaan kartu/input `surface` (`#F7F8FA`) dengan sudut membulat besar (`rounded-2xl` / `20px`) dan bayangan sangat halus (`shadow-card`), memberikan kesan lapang dan nyaman dipindai di layar ponsel maupun desktop.
2. **Aksen Cobalt Blue + Price Pill.** Warna utama biru kobalt (`#1E5EFF`) mendominasi elemen navigasi aktif, banner promo, dan *pill* harga yang menempel di bagian bawah foto produk (`rounded-full`, teks putih tebal).
3. **Navigasi & filter ringkas.** Chip kategori horizontal dengan ikon, selektor **Kampus** yang selalu mudah dijangkau di bagian atas, serta *floating bottom bar* untuk ringkasan keranjang dan navigasi utama di perangkat mobile.

**Yang dihindari:** border hitam tebal bergaya brutalism, bayangan offset keras, gradasi neon berlebihan, ikon emoji sebagai ikon UI, font bawaan sistem, dan hero dengan stock photo penuh teks.

**Nada bahasa (microcopy):** santai, jelas, ramah mahasiswa. Memakai "kamu" (bukan "Anda"), kalimat pendek dan langsung ke inti. Contoh: "Lepas barang kostmu ke sesama mahasiswa sekampus." Satu pengecualian: pesan sistem pada **Pending Seller Page** memakai kalimat dari tugas: "Akun Anda sedang ditinjau."

---

## 2. Design Tokens

### 2.1 Warna

Semua pasangan teks/latar di bawah sudah dihitung rasio kontrasnya (WCAG AA ≥ 4.5:1 untuk teks normal).

| Token | Hex | Fungsi | Kontras penting |
|---|---|---|---|
| `canvas` | `#FFFFFF` | Latar utama halaman | - |
| `surface` | `#F7F8FA` | Latar kartu produk, input pencarian, panel | - |
| `surface-alt` | `#EFF2F7` | Latar chip non-aktif, hover baris, thumbnail | - |
| `ink` | `#111827` | Teks utama, judul, angka | 17.7:1 di atas `canvas` |
| `ink-soft` | `#6B7280` | Teks sekunder, label stok, nama toko | 4.8:1 di atas `canvas` |
| `line` | `#E5E7EB` | Border halus kartu, pemisah | (dekoratif) |
| `primary` | `#1E5EFF` | Aksi utama, pill harga, chip aktif, banner promo | putih di atasnya 5.3:1 |
| `primary-hover` | `#1549D6` | Hover/aktif tombol utama | putih 6.8:1 |
| `primary-50` | `#EEF4FF` | Latar lembut chip/badge aktif & kampus | `primary` di atasnya 4.9:1 |
| `accent` | `#FFD60A` | Tombol CTA di atas banner biru, bintang rating | `ink` di atasnya 12.6:1 |
| `accent-hover` | `#F0C800` | Hover tombol aksen kuning | `ink` 11.4:1 |
| `pine` | `#0D9488` | Badge terverifikasi, indikator kampus | putih 4.6:1 |
| `pine-50` | `#CCFBF1` | Latar badge `pine` | `#0F766E` 5.1:1 |
| `success` / `success-50` | `#166534` / `#DCFCE7` | Selesai, disetujui | 6.5:1 |
| `warning` / `warning-50` | `#92400E` / `#FEF3C7` | Menunggu, pending, stok menipis | 6.4:1 |
| `danger` / `danger-50` | `#DC2626` / `#FEE2E2` | Error, hapus, ditolak, ikon wishlist aktif | 4.8:1 (putih di `danger` 4.8:1) |
| `info` / `info-50` | `#1D4ED8` / `#DBEAFE` | Diproses | 5.9:1 |

Aturan pemakaian: `primary` dipakai untuk aksi utama, *price pill*, dan state aktif navigasi. Warna **tidak pernah** menjadi satu-satunya pembawa makna: badge status dan kondisi selalu memiliki teks.

### 2.2 Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul, harga, angka besar | **Plus Jakarta Sans** | 700–800 | `font-display`, letter-spacing −0.02em |
| Isi, form, tabel, tombol | **Plus Jakarta Sans** | 400, 500, 600, 700 | `font-sans` (default body) |

Muat lewat `next/font/google` dengan `variable: '--font-jakarta'`, `subsets: ['latin']`, `display: 'swap'`.

Skala (mobile → desktop):

| Gaya | Mobile | Desktop | Pemakaian |
|---|---|---|---|
| Display | 28/34 | 44/52 | Judul banner hero |
| H1 | 22/28 | 30/38 | Judul halaman |
| H2 | 18/24 | 22/28 | Judul section ("Produk Pilihan", "Baru Dilepas") |
| H3 | 15/20 | 17/24 | Judul kartu/panel |
| Body | 14/22 | 15/24 | Teks isi |
| Small | 12/18 | 13/18 | Info stok, rating, kampus, caption |
| Price | 13/18 (700) | 15/20 | Harga di *price pill* kartu & detail |

Input teks minimal **16 px** di ponsel agar iOS tidak melakukan zoom otomatis saat fokus.

### 2.3 Spasi, radius, bayangan, gerak

- Spasi basis 4 px (skala Tailwind). Gutter halaman: 16 px (mobile), 24 px (md), 32 px (lg). Jarak antar-section: 32 px (mobile) / 56 px (desktop).
- Radius: `sm` 10 px (badge, tombol kecil), `md` 14 px (input, tombol standar), `card` 20 px (kartu produk, banner promo, modal), `full` (price pill, chip filter, avatar, tombol hati).
- Bayangan: `card` = `0 2px 10px rgb(17 24 39 / 0.05)`; `card-hover` = `0 8px 24px rgb(30 94 255 / 0.12)`; `float` = `0 10px 25px rgb(17 24 39 / 0.12)` (floating cart bar & bottom nav).
- Gerak: durasi 150 ms (hover/press) dan 200 ms (modal/toast), easing `ease-out`. Hover kartu produk: `translateY(-2px)` + bayangan `card-hover`; active tombol: `scale(0.98)`. Hormati `prefers-reduced-motion`.
- Fokus: ring 3 px `primary-50` + outline 2 px `primary`.

### 2.4 Siap tempel: `app/globals.css` (Tailwind v4)

```css
@import "tailwindcss";

@theme {
  --color-canvas: #FFFFFF;
  --color-surface: #F7F8FA;
  --color-surface-alt: #EFF2F7;
  --color-ink: #111827;
  --color-ink-soft: #6B7280;
  --color-line: #E5E7EB;

  --color-primary: #1E5EFF;
  --color-primary-hover: #1549D6;
  --color-primary-50: #EEF4FF;
  --color-accent: #FFD60A;
  --color-accent-hover: #F0C800;
  --color-pine: #0D9488;
  --color-pine-50: #CCFBF1;

  --color-success: #166534;  --color-success-50: #DCFCE7;
  --color-warning: #92400E;  --color-warning-50: #FEF3C7;
  --color-danger:  #DC2626;  --color-danger-50:  #FEE2E2;
  --color-info:    #1D4ED8;  --color-info-50:    #DBEAFE;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-card: 20px;

  --shadow-card: 0 2px 10px rgb(17 24 39 / 0.05);
  --shadow-card-hover: 0 8px 24px rgb(30 94 255 / 0.12);
  --shadow-float: 0 10px 25px rgb(17 24 39 / 0.12);
}

@theme inline {
  --font-display: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html { background: var(--color-canvas); color: var(--color-ink); scroll-behavior: smooth; }
  body { font-family: var(--font-sans); font-size: 14px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
  h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.02em; }
  :focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; box-shadow: 0 0 0 4px var(--color-primary-50); }
  @media (min-width: 768px) { body { font-size: 15px; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
}
```

---

## 3. Layout dan Responsivitas

**Pendekatan mobile-first.** Rancang di 360 px dulu, lalu perluas.

| Breakpoint | Lebar | Perilaku utama |
|---|---|---|
| (dasar) | 360–639 | 1 kolom; grid produk 2 kolom (`gap-3`); bottom navigation 4 tab tetap di bawah |
| `sm` | ≥ 640 | Form 2 kolom bila perlu; thumbnail foto 5 kolom |
| `md` | ≥ 768 | Grid produk 3 kolom (`gap-4`); tabel muncul (di bawah ini tabel jadi kartu bertumpuk); search bar + selektor kampus tampil sebaris di navbar |
| `lg` | ≥ 1024 | Grid produk 4 kolom (`gap-5`); sidebar filter & sidebar dashboard tampil; detail produk 2 kolom |
| `xl` | ≥ 1280 | Lebar konten maks. `max-w-7xl` tercapai |

- **Kontainer:** area publik `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`; dashboard `max-w-6xl` di sisi konten.
- **Tanpa scroll horizontal** pada 360 px. Chip kategori dan filter horizontal memakai `overflow-x-auto no-scrollbar`.
- **Area sentuh** minimal 44×44 px (tombol ikon bulat diberi ukuran minimal `w-10 h-10` / `w-11 h-11`).
- **Grid produk:** `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5`.
- **Bottom Navigation (Ponsel `<md` untuk area publik & Buyer, `<lg` untuk Dashboard):**
  - 4 tab utama sesuai struktur modern: **Beranda** (`Home`), **Pesanan** (`Package`), **Favorit** (`Heart`), **Profil** (`User`). Tab aktif memakai ikon terisi berwarna `primary` (`#1E5EFF`) dan label teks `11px` tebal.
  - Saat keranjang Buyer berisi item (`cartCount > 0`), tampilkan **Floating Cart Bar** melayang tepat di atas bottom-nav (`bg-primary text-white rounded-full shadow-float px-5 py-3`): kiri `"Lihat Keranjang"` + pill putih jumlah item (`3x`), kanan total harga (`Rp 256.000`).

---

## 4. Komponen

Semua di `components/ui/*` kecuali disebut lain.

### 4.1 Button
| Varian | Gaya | Pemakaian |
|---|---|---|
| `primary` | Latar `primary`, teks putih, hover `primary-hover` | Aksi utama (Checkout, Simpan, Daftar, Tambah ke Keranjang) |
| `accent` | Latar `accent` (`#FFD60A`), teks `ink` tebal, hover `accent-hover` | CTA utama di atas banner biru atau sorotan |
| `secondary` | Latar `surface`, teks `ink`, border `line`, hover `surface-alt` | Aksi sekunder, tombol "Tambah" ringkas |
| `ghost` | Tanpa latar, hover `surface-alt` | Aksi tersier, navbar |
| `danger` | Latar `danger`, teks putih | Hapus, Reject |
| `success` | Latar `success`, teks putih | Approve |

Ukuran: `sm` (36 px), `md` (44 px; default), `lg` (50 px; CTA checkout). Radius `md` atau `full` (untuk tombol pill), font 600.

### 4.2 Input, Select, Textarea, Field Harga, dan CampusSelector
- Tinggi 46 px, radius `md` (`14px`), latar `surface` (`#F7F8FA`), border `1px solid transparent` → fokus latar `canvas`, border `primary`, ring `primary-50`.
- **`CampusSelector` (`components/ui/CampusSelector.jsx`)**:
  - Komponen kunci untuk memilih kampus di seluruh Indonesia (mis. *Semua Kampus*, *UNHAS - Makassar*, *UI - Depok*, *ITB - Bandung*, *UGM - Yogyakarta*, *ITS - Surabaya*, dll.).
  - Tampil sebagai tombol pill interaktif dengan ikon `GraduationCap` + nama singkat kampus + panah bawah (`ChevronDown`).
  - Saat diklik, membuka dropdown (desktop) atau *bottom sheet* berfitur pencarian cepat nama/kota kampus (ponsel) sehingga mahasiswa mudah menemukan kampusnya dari puluhan kampus se-Indonesia.

### 4.3 Badge & Price Pill
| Komponen | Gaya | Teks |
|---|---|---|
| **Price Pill** | `bg-primary text-white font-bold text-xs md:text-sm px-3 py-1 rounded-full inline-block` | `Rp 135.000` |
| Kondisi `like_new` | `bg-success-50 text-success` | Seperti Baru |
| Kondisi `good` | `bg-primary-50 text-primary` | Baik |
| Kondisi `fair` | `bg-warning-50 text-warning` | Layak Pakai |
| Kondisi `minor_defect` | `bg-danger-50 text-danger` | Ada Minus |
| Badge Kampus | `bg-pine-50 text-pine font-semibold` + ikon `GraduationCap` | `UNHAS` / `UI` / `UGM` |
| Terjual | `bg-ink/80 text-white backdrop-blur-xs` | TERJUAL |

### 4.4 ProductCard (`components/product/ProductCard.jsx`)

Mengikuti tata letak visual kartu produk referensi:

```
┌──────────────────────────┐
│ ┌──────────────────────┐ │
│ │  [Foto Produk 1:1]   │ │  ← sudut membulat rounded-2xl, latar surface
│ │                   ♥  │ │  ← tombol hati putih bulat (kanan-atas, Buyer)
│ │                      │ │  ← bila stok 0: overlay gelap + badge "TERJUAL"
│ └──────────────────────┘ │
│ ╭──────────────╮         │
│ │  Rp 135.000  │         │  ← Price Pill biru kobalt (#1E5EFF), teks putih tebal
│ ╰──────────────╯         │
│ Tersisa 15 Stok          │  ← teks kecil ink-soft (12 px)
│ ★ 4.5 (201) · 🎓 UNHAS   │  ← bintang kuning (#FFD60A) + rating + kode kampus
│ Nama Produk (maks. 2     │  ← font 600 text-ink, line-clamp-2
│ baris)                   │
└──────────────────────────┘
```
- Kartu dibungkus kontainer `bg-canvas border border-line/80 rounded-card p-2.5 shadow-card hover:shadow-card-hover transition`.
- Tombol wishlist (`♥`) berbentuk lingkaran putih `w-8 h-8 rounded-full bg-white shadow-sm` di kanan-atas area foto; ikon hati berwarna `danger` (`#DC2626`) saat aktif atau abu-abu saat belum difavoritkan.
- Informasi di bawah *Price Pill* disusun vertikal rapat dan bersih: baris stok (`Tersisa {stock} Stok`), baris rating & kampus (`★ 4.5 (12) · UNHAS`), diikuti judul produk maksimal 2 baris.

### 4.5 Navbar & Header (`components/layout/Navbar.jsx`)
Mengadopsi struktur *header* modern:
- **Baris Atas (64 px, sticky, `bg-canvas/95 backdrop-blur-md`):**
  - **Kiri:** Avatar pengguna + sapaan ringan (`Selamat datang,` + nama pengguna) untuk user login, atau wordmark **"LepasIn"** untuk Guest.
  - **Tengah/Kanan:** `CampusSelector` (pill pemilihan kampus aktif, mis. `🎓 Semua Kampus` atau `🎓 UNHAS`) + tombol ikon Keranjang dengan badge titik merah/biru (`ShoppingBag`).
- **Baris Pencarian & Filter Cepat (Homepage & `/products`):**
  - Input pencarian melengkung (`bg-surface rounded-full h-11 px-4`) dengan placeholder `"Cari kipas, kasur, buku kuliah..."` + tombol ikon *Filter* bulat di sebelah kanan (`SlidersHorizontal`) untuk membuka panel filter kampus, kategori, kondisi, dan harga.
- **Baris Chip Kategori Horizontal:**
  - Pil kategori dengan ikon (`Semua Produk`, `Elektronik`, `Perabot Kost`, `Buku & Kuliah`, `Fashion`, `Dapur`, dll.). Tab aktif menggunakan latar `primary` (`#1E5EFF`) dan teks putih.

### 4.6 Hero Promo Banner (Homepage)
- Kartu besar `bg-primary rounded-card p-6 md:p-8 text-white relative overflow-hidden` (mengadopsi kartu promo biru pada referensi).
- **Kiri:** Judul tebal (`"Lepas Barang Kostmu, Hemat Budget Kuliah!"`), subjudul singkat (`"Jual beli preloved aman sesama mahasiswa di seluruh kampus Indonesia."`), dan tombol CTA kuning `accent` (`"Mulai Jual"` atau `"Jelajah Produk"`) berbentuk `rounded-full`.
- **Kanan (desktop/tablet):** Ilustrasi bersih kartu produk / perangkat kost dengan indikator *carousel dots* di bagian bawah.

### 4.7 Category Icon Tiles (Opsional / Halaman Jelajah)
- Deretan kartu kategori persegi kecil (`w-16 h-16 rounded-2xl bg-surface`) dengan ikon berwarna di tengah dan label kecil di bawahnya. Item aktif mendapat latar `primary` dengan teks putih di bawahnya.

### 4.8 Modal, ConfirmDialog, Toast, Stepper, Pagination, EmptyState
- **Modal & ConfirmDialog:** Panel `bg-canvas rounded-card shadow-float p-6 max-w-md`; di ponsel muncul sebagai *bottom sheet* (`rounded-t-3xl`).
- **Toast:** Panel `bg-ink text-white rounded-full px-5 py-3 shadow-float` di atas-tengah layar.
- **Stepper Status Pesanan:** Garis progres biru `primary` dengan lingkaran indikator aktif/selesai.
- **Pagination:** Tombol pill `rounded-full`; halaman aktif `bg-primary text-white`.
- **EmptyState:** Ikon dalam lingkaran `bg-primary-50 text-primary`, judul H3, teks penjelasan, dan tombol CTA pill.

---

## 5. Komponen Foto: `ImageUploader` dan `CameraModal`

Tetap mempertahankan seluruh fungsionalitas unggah & kamera langsung dengan gaya visual modern:
- **`ImageUploader`**: Kontainer `border-2 border-dashed border-primary/40 bg-primary-50/40 rounded-card p-6`; tombol **Ambil Foto** (`primary` rounded-full) dan **Pilih dari Galeri** (`secondary` rounded-full).
- **Thumbnail Grid**: `grid-cols-3 sm:grid-cols-5 gap-3`, setiap thumbnail `aspect-square rounded-2xl overflow-hidden border border-line`. Pita **"FOTO UTAMA"** memakai pill `bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full`.
- **`CameraModal`**: Layar penuh di ponsel / modal `rounded-card` di desktop dengan tombol jepret bulat putih-biru (`w-16 h-16 rounded-full border-4 border-white bg-primary`).

---

## 6. Tata Letak Halaman Utama

### 6.1 Homepage (`/`)
1. **Header**: Sapaan user / Logo + `CampusSelector` (filter kampus nasional) + Ikon Keranjang.
2. **Search + Filter Button**: Bar pencarian pill + tombol filter.
3. **Category Chips**: Chip horizontal (`Semua Produk`, `Elektronik`, `Perabot Kost`, `Buku & Kuliah`, dll.).
4. **Promo Banner Biru (`#1E5EFF`)**: Headline + subheadline + tombol kuning (`#FFD60A`).
5. **Section "Produk Pilihan" / "Rekomendasi Kampusmu"**: Grid 2 kolom (mobile) → 4 kolom (desktop) menggunakan `ProductCard` baru dengan *Price Pill* biru.
6. **Section "Baru Dilepas"**: Grid produk terbaru + tautan `"Lihat semua"`.
7. **Bottom Navigation (Mobile)** + **Floating Cart Bar** (bila keranjang terisi).

### 6.2 Daftar Produk (`/products`)
- Header pencarian + bar filter horizontal (`Filter`, `Kampus`, `Kategori`, `Kondisi`, `Harga`, `Urutkan`).
- **Desktop (`lg+`)**: Sidebar filter kiri 270 px (Dropdown/Search **Kampus**, Radio Kategori, Checkbox Kondisi, Rentang Harga) + Grid produk 3–4 kolom di kanan.
- **Mobile**: Tombol filter membuka *Bottom Sheet* filter lengkap (termasuk pencarian kampus se-Indonesia).

### 6.3 Detail Produk (`/products/[id]`)
- Galeri foto persegi `rounded-card` dengan thumbnail horizontal di bawahnya.
- Badge **Kampus** (`bg-pine-50 text-pine`) + Badge **Kondisi** + Kategori.
- Judul produk, rating bintang kuning `★`, info stok (`Tersisa {stock} Stok`), dan **Price Pill** besar (`bg-primary text-white text-lg font-bold px-4 py-1.5 rounded-full`).
- Kartu info toko (`bg-surface rounded-card p-4`): avatar toko, nama toko + ikon centang `Terverifikasi`, nama kampus & area kost.
- Sticky bottom action bar di ponsel: pemilih jumlah `[−][1][+]` + tombol pill `Tambah ke Keranjang` (`bg-primary text-white`).

### 6.4 Login & Register (`/login`, `/register`)
- Kartu form bersih `bg-canvas rounded-card border border-line p-6 md:p-8 shadow-card`.
- Pada `/register`:
  - Segmented toggle peran: **Pembeli** vs **Penjual**.
  - Field **Asal Kampus** (`CampusSelector` / select searchable dari daftar kampus Indonesia) — wajib untuk Seller agar tokonya terhubung ke kampus tersebut, dan opsional/direkomendasikan untuk Buyer agar langsung melihat produk di kampusnya.
  - Khusus Seller: field **Nama Toko** (wajib) dan **Detail Area/Kost** (opsional, mis. *"Tamalanrea / Pintu 1"*).
