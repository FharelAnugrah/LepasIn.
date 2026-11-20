# PRD.md — LepasIn

> **Product Requirements Document.** Dokumen ini adalah acuan utama untuk agent di IDE. Baca juga `schema.md` (database, sumber kebenaran untuk tabel/kolom) dan `design.md` (tampilan, komponen, tema).
> Konteks: Tugas Final Praktikum Pemrograman Web 2026, _Individual Project 1: E-Commerce_. Dikerjakan individu dan akan dipresentasikan (15 menit presentasi + 15 menit tanya jawab dengan 3 penilai).
> Tanggal dokumen: 14 November 2026. **Deadline: Rabu, 25 November 2026** (dinilai dari commit terakhir di GitHub).

---

## 0. Aturan Kerja untuk Agent (WAJIB DIBACA)

1. **Ikuti stack wajib** di bagian 2. Jangan mengganti framework, bahasa, atau library inti.
2. **JavaScript + JSX saja, tanpa TypeScript.** File komponen berekstensi `.jsx` atau `.js`.
3. **Raw SQL dengan `pg`.** Dilarang memakai ORM/query builder. Semua query parameterized (`$1, $2`), tidak boleh ada string concatenation dari input user.
4. **Pemilik proyek harus bisa menjelaskan semua kode saat presentasi.** Tulis kode sederhana, lurus, dan mudah dibaca: hindari abstraksi berlebihan, metaprogramming, atau pola yang terlalu "pintar". Beri komentar singkat berbahasa Indonesia pada logika penting (auth, transaksi checkout, validasi, upload foto).
5. **Teks antarmuka dalam Bahasa Indonesia.** Identifier kode (nama variabel, fungsi, file, kolom DB) dalam bahasa Inggris.
6. **Jangan mengarang fitur di luar dokumen ini.** Jika ada hal yang tidak jelas, pilih opsi paling sederhana yang konsisten dengan dokumen dan catat asumsinya di `README.md`.
7. **Otorisasi selalu dicek di server**, bukan hanya menyembunyikan tombol (lihat bagian 7).
8. **Commit kecil dan sering** (minimal satu commit bermakna per hari kerja). Pesan commit deskriptif, mis. `feat: campus filter and product catalog`. Penilaian memakai commit terakhir dan riwayat commit dipakai untuk menjaga orisinalitas.
9. Jangan menaruh secret di repository. `.env.local` masuk `.gitignore`; sediakan `.env.example`.
10. Setelah selesai tiap fase di bagian 12, jalankan checklist uji di bagian 13 untuk fase itu.

---

## 1. Ringkasan Produk

**Nama:** LepasIn
**Tagline:** _Lepas barang kostmu ke sesama Mahasiswa sekampus._
**Jenis:** Marketplace web (e-commerce multi-peran) khusus barang preloved untuk Mahasiswa dan anak kost di **seluruh kampus Indonesia**.

### 1.1 Masalah

Mahasiswa dan anak kost di berbagai kota pendidikan di Indonesia (Makassar, Depok, Bandung, Yogyakarta, Surabaya, Malang, Semarang, Medan, dll.) sering memiliki barang yang masih layak pakai (kasur lipat, rice cooker, buku kuliah, kipas, laptop lama, perabot kost) saat pindah kost, KKN, magang, atau lulus kuliah. Jika dijual di media sosial umum, barang sulit ditemukan oleh Mahasiswa yang berada di kampus/kota yang sama, ongkos kirim antar-kota menjadi mahal, dan tidak ada sistem transaksi maupun ulasan yang terstruktur.

### 1.2 Solusi

Platform e-commerce berbasis **komunitas kampus se-Indonesia**. Setiap toko terhubung dengan **kampus tertentu** (mis. UNHAS, UI, ITB, UGM, ITS, UNAIR, UB, UNDIP, UNPAD, USU, dll.). Penjual dapat membuka toko, mengunggah barang dengan **foto langsung dari kamera atau galeri**, dan mengatur stok serta kondisi. Pembeli dapat **memfilter barang berdasarkan kampus di seluruh Indonesia** (untuk memudahkan COD/ketemuan di sekitar kampus) maupun menjelajah secara nasional, memasukkan ke keranjang, checkout, melacak pesanan, dan memberi rating serta ulasan.

### 1.3 Tujuan

- **G1.** Memenuhi seluruh requirement Tugas Final (Admin, Seller, Buyer, Public User, 6 modul CMS, 9 layout wajib) dengan nilai maksimal pada tiga kriteria: Frontend 30%, Backend 30%, Kelengkapan Fitur 40%.
- **G2.** Menghadirkan pengalaman jual-beli preloved berbasis kampus se-Indonesia yang relevan: filter kampus cepat, info lokasi kost sekitar kampus, foto langsung dari kamera ponsel, dan riwayat transaksi jelas.
- **G3.** Dapat dijalankan penilai dengan mudah: `database/lepasin.sql` + `npm install` + `npm run dev`.

### 1.4 Bukan Tujuan (Non-Goals)

- Payment gateway (pembayaran manual/COD di sekitar kampus atau transfer langsung di luar sistem).
- Integrasi kurir/ongkir otomatis, chat realtime, notifikasi email/push, sistem refund/komplain.
- Satu akun dengan dua peran sekaligus (role bersifat tunggal: `admin`, `seller`, atau `buyer`).

### 1.5 Persona

| Persona                        | Deskripsi                                                                              | Kebutuhan utama                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Dinda, penjual (UNHAS)**     | Mahasiswi semester akhir di Makassar, mau pindah kost, punya kasur lipat & rice cooker | Unggah barang cepat lewat ponsel, menautkan toko ke UNHAS agar mudah ditemukan adik tingkat  |
| **Andi, pembeli (UNHAS / UI)** | Mahasiswa baru yang baru ngekost dengan anggaran terbatas                              | Memfilter barang khusus di kampusnya sendiri agar bisa COD tanpa ongkir, cek kondisi & harga |
| **Rizky, penjual (UI Depok)**  | Mahasiswa tingkat akhir di Depok yang menjual buku referensi & elektronik bekas        | Menjangkau pembeli di area UI Depok maupun pengiriman antar-kota                             |
| **Admin LepasIn**              | Pengelola platform nasional                                                            | Verifikasi penjual baru, kelola data kampus, user, kategori, dan moderasi produk             |
| **Tamu (Guest)**               | Pengunjung belum login                                                                 | Menelusuri produk berdasarkan kampus/kategori sebelum mendaftar                              |

---

## 2. Tech Stack (Wajib)

| Lapisan   | Pilihan                                           | Catatan                                                                                      |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router), **JavaScript + JSX** | Wajib dari tugas                                                                             |
| Styling   | **Tailwind CSS v4**                               | Konfigurasi _CSS-first_ (`@import "tailwindcss";` dan `@theme { ... }` di `app/globals.css`) |
| Database  | **PostgreSQL 14+**                                | Wajib dari tugas                                                                             |
| Akses DB  | **`pg`** (node-postgres), Raw SQL                 | Tanpa ORM                                                                                    |
| Auth      | **`jose`** (JWT HS256) + **`bcryptjs`**           | Sesi di cookie `httpOnly`                                                                    |
| Validasi  | **`zod`**                                         | Validasi di server                                                                           |
| Ikon      | **`lucide-react`**                                |                                                                                              |
| Font      | `next/font/google`: _Plus Jakarta Sans_           | Lihat `design.md`                                                                            |

### 2.1 Hal yang berubah di Next.js 15/16

- `params` dan `searchParams` adalah **Promise**: gunakan `const { id } = await params;` dan `const sp = await searchParams;`.
- `cookies()` dan `headers()` dari `next/headers` bersifat **async**: `const store = await cookies();`.
- Gunakan `proxy.js` di root proyek (pengganti `middleware.js` pada Next.js 16).
- Tambahkan `export const dynamic = 'force-dynamic';` pada setiap `page.js`/`layout.js` yang melakukan query DB.
- Atur `serverActions: { bodySizeLimit: '10mb' }` di `next.config.mjs` untuk mendukung upload foto produk.

---

## 3. Peran dan Hak Akses

### 3.1 Matriks

| Kemampuan                                                            | Guest | Buyer |      Seller (pending/rejected)       | Seller (approved) | Admin |
| -------------------------------------------------------------------- | :---: | :---: | :----------------------------------: | :---------------: | :---: |
| Lihat homepage, daftar & detail produk, filter kampus/kategori/harga |   ✔   |   ✔   |                  ✔                   |         ✔         |   ✔   |
| Register (Buyer atau Seller + pilih kampus) / Login                  |   ✔   |   -   |                  -                   |         -         |   -   |
| Tambah ke keranjang, checkout, riwayat pesanan, review               |   ✘   |   ✔   |                  ✘                   |         ✘         |   ✘   |
| Wishlist, alamat pengiriman, profil & kampus buyer                   |   ✘   |   ✔   |                  ✘                   |         ✘         |   ✘   |
| Dashboard seller (toko, produk, pesanan masuk)                       |   ✘   |   ✘   | ✘ (diarahkan ke Pending Seller Page) |         ✔         |   ✘   |
| Verifikasi seller (Approve/Reject)                                   |   ✘   |   ✘   |                  ✘                   |         ✘         |   ✔   |
| Kelola user (lihat/edit/hapus selain diri sendiri)                   |   ✘   |   ✘   |                  ✘                   |         ✘         |   ✔   |
| Kelola kategori & daftar kampus (CRUD)                               |   ✘   |   ✘   |                  ✘                   |         ✘         |   ✔   |
| Hapus produk penjual mana pun yang melanggar                         |   ✘   |   ✘   |                  ✘                   |         ✘         |   ✔   |
| Hapus akun sendiri                                                   |   ✘   |   ✘   |      ✔ (hanya bila `rejected`)       |         ✘         |   ✘   |

### 3.2 Aturan pengalihan (redirect)

- Setelah login: `admin` → `/admin`; `seller` approved → `/seller`; `seller` pending/rejected → `/pending-seller`; `buyer` → `/` (atau halaman `next` bila ada).
- Guest membuka `/buyer/*`, `/seller/*`, `/admin/*` → `/login?next=<url asal>`.
- Guest menekan **Tambah ke Keranjang** atau **Favorit** → `/login?next=/products/<id>`.
- Role yang salah membuka area role lain → diarahkan ke dashboard miliknya.
- Seller `pending`/`rejected` yang membuka `/seller/*` → `/pending-seller`.

---

## 4. Peta Halaman dan Endpoint

### 4.1 Halaman

| Route                                                                    | Siapa                   | Keterangan                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                      | Semua                   | Homepage: header sapaan & selektor kampus, search bar, chip kategori, banner promo biru, grid produk pilihan (diprioritaskan sesuai kampus buyer jika dipilih), dan produk terbaru |
| `/products`                                                              | Semua                   | Daftar produk lengkap + filter **Kampus se-Indonesia**, kategori, kondisi, rentang harga + sorting + pagination                                                                    |
| `/products/[id]`                                                         | Semua                   | Detail produk, galeri foto, badge kampus & kondisi, rating & review, info toko & kampus, tombol keranjang                                                                          |
| `/stores/[id]`                                                           | Semua                   | Profil toko, asal kampus, dan daftar produknya                                                                                                                                     |
| `/login`, `/register`                                                    | Guest                   | Register memiliki pilihan peran Buyer/Seller serta pilihan **Kampus**                                                                                                              |
| `/pending-seller`                                                        | Seller pending/rejected | Info status; tombol Delete Account bila `rejected`                                                                                                                                 |
| `/buyer`                                                                 | Buyer                   | Ringkasan dashboard + navigasi                                                                                                                                                     |
| `/buyer/profile`                                                         | Buyer                   | Kelola profil, kampus utama, & ganti password                                                                                                                                      |
| `/buyer/cart`                                                            | Buyer                   | Keranjang belanja (dikelompokkan per toko)                                                                                                                                         |
| `/buyer/checkout`                                                        | Buyer                   | Pilih metode (COD/Ketemuan di kampus atau kirim), alamat, catatan, konfirmasi                                                                                                      |
| `/buyer/orders`                                                          | Buyer                   | Riwayat & tracking pesanan, tombol Pesanan Diterima (anti-penipuan), form review                                                                                                   |
| `/buyer/wishlist`                                                        | Buyer                   | Daftar produk favorit                                                                                                                                                              |
| `/buyer/addresses`                                                       | Buyer                   | CRUD alamat pengiriman/kost                                                                                                                                                        |
| `/seller`                                                                | Seller approved         | Ringkasan: jumlah produk, pesanan baru, pendapatan selesai                                                                                                                         |
| `/seller/store`                                                          | Seller approved         | Kelola info toko (nama, **kampus**, detail lokasi/area kost, deskripsi, foto toko)                                                                                                 |
| `/seller/products`, `/seller/products/new`, `/seller/products/[id]/edit` | Seller approved         | CRUD produk + **upload/ambil foto**                                                                                                                                                |
| `/seller/orders`, `/seller/orders/[id]`                                  | Seller approved         | Pesanan masuk & ubah status                                                                                                                                                        |
| `/admin`                                                                 | Admin                   | Ringkasan statistik nasional                                                                                                                                                       |
| `/admin/sellers`                                                         | Admin                   | Verifikasi Seller pending (Approve/Reject)                                                                                                                                         |
| `/admin/users`, `/admin/users/[id]/edit`                                 | Admin                   | Lihat, edit, hapus user                                                                                                                                                            |
| `/admin/categories`                                                      | Admin                   | CRUD kategori                                                                                                                                                                      |
| `/admin/campuses`                                                        | Admin                   | (Should) CRUD daftar kampus Indonesia                                                                                                                                              |
| `/admin/products`                                                        | Admin                   | Moderasi: daftar semua produk + hapus yang melanggar                                                                                                                               |

### 4.2 Route Handler (`app/api/**/route.js`)

| Method + Path                          | Fungsi                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/register`              | Validasi (zod) → hash password → insert user (+ toko & `campus_id` untuk seller dalam satu transaksi) → set cookie sesi |
| `POST /api/auth/login`                 | Validasi → cek email/password → set cookie sesi → kembalikan `{ redirectTo }`                                           |
| `POST /api/auth/logout`                | Hapus cookie sesi                                                                                                       |
| `GET /api/products`                    | Daftar produk JSON dengan query `q`, `campus`, `category`, `condition`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| `GET /api/products/[id]`               | Detail produk JSON                                                                                                      |
| `GET /api/categories`                  | Daftar kategori JSON                                                                                                    |
| `GET /api/campuses`                    | Daftar kampus Indonesia JSON (mendukung pencarian `q` berdasarkan nama/singkatan/kota)                                  |
| `GET /api/uploads/[folder]/[filename]` | Menyajikan foto dari disk (`products`, `stores`, `avatars`)                                                             |

---

## 5. Spesifikasi Fitur

### 5.1 Autentikasi dan Registrasi

| ID     | Prioritas | Requirement                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | :-------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-1 |     M     | Halaman `/login` untuk Admin, Seller, Buyer dengan pesan error generik "Email atau password salah"                                                                                                                                                                                                                                                                                           |
| AUTH-2 |     M     | Halaman `/register` untuk Buyer dan Seller. Field: nama, email, no. HP, password, konfirmasi password, dan **Kampus** (wajib untuk Seller, opsional untuk Buyer). Jika memilih Seller, muncul field **Nama Toko** (wajib), **Detail Lokasi / Area Kost** (wajib), dan foto verifikasi **Selfie dengan memegang KTM / Kartu Identitas** (wajib untuk Seller, diunggah via kamera atau galeri) |
| AUTH-3 |     M     | Seller baru berstatus `pending` → `/pending-seller`. Buyer baru langsung login → `/`                                                                                                                                                                                                                                                                                                         |
| AUTH-4 |     M     | Sesi JWT di cookie `lepasin_session` (`httpOnly`, `sameSite=lax`, 7 hari)                                                                                                                                                                                                                                                                                                                    |
| AUTH-5 |     M     | Logout menghapus cookie                                                                                                                                                                                                                                                                                                                                                                      |
| AUTH-6 |     M     | Email unik case-insensitive (`23505` → "Email sudah terdaftar")                                                                                                                                                                                                                                                                                                                              |
| AUTH-7 |     M     | Password minimal 8 karakter (huruf + angka), hash `bcryptjs` cost 10                                                                                                                                                                                                                                                                                                                         |

### 5.2 Homepage, Daftar Produk, Filter Kampus, dan Detail Produk

| ID    | Prioritas | Requirement                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PUB-1 |     M     | **Homepage**: selektor **Kampus** di header (default: _Semua Kampus_, atau otomatis terisi kampus Buyer jika sudah diatur di profil dan user memilih filter tersebut), search bar, chip kategori horizontal, banner promo biru, serta grid produk tersedia                                                                                                                                 |
| PUB-2 |     M     | **Homepage Buyer**: section "Rekomendasi untukmu" (memprioritaskan produk dari kampus yang sama dengan Buyer jika tersedia, lalu produk acak lainnya dengan `stock > 0`, maks. 8 item)                                                                                                                                                                                                     |
| PUB-3 |     M     | **Product List** (`/products`): kartu produk (foto, _Price Pill_ biru, info sisa stok, rating & singkatan kampus, nama produk, ikon favorit), pagination 12 item per halaman                                                                                                                                                                                                               |
| PUB-4 |     M     | Pencarian berdasarkan nama produk (`ILIKE`), parameter URL `q`                                                                                                                                                                                                                                                                                                                             |
| PUB-5 |     M     | **Filter Kampus & Atribut**: filter berdasarkan **Kampus** (`campus` = ID kampus dari seluruh Indonesia), **Kategori** (`category`), **Kondisi** (`condition`), dan **Rentang Harga** (`minPrice`, `maxPrice`). **Sorting**: Terbaru, Harga Terendah, Harga Tertinggi, Rating Tertinggi. Semua state tersimpan di URL (`?q=&campus=&category=&condition=&minPrice=&maxPrice=&sort=&page=`) |
| PUB-6 |     M     | **Product Detail**: galeri foto, badge kampus & kondisi, nama, _Price Pill_ (+ harga beli awal dicoret & persentase hemat), stok, deskripsi, kategori, info toko (nama, status terverifikasi, nama kampus, area kost), daftar rating & review                                                                                                                                              |
| PUB-7 |     M     | Tombol Tambah ke Keranjang khusus Buyer. Guest diarahkan ke login                                                                                                                                                                                                                                                                                                                          |
| PUB-8 |     M     | Produk milik seller yang belum `approved` tidak tampil di area publik                                                                                                                                                                                                                                                                                                                      |

### 5.3 Keranjang dan Checkout (Buyer)

| ID     | Prioritas | Requirement                                                                                                                                  |
| ------ | :-------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CART-1 |     M     | Tambah produk ke keranjang (maksimal sebesar stok; stok 0 tidak bisa ditambahkan)                                                            |
| CART-2 |     M     | Halaman keranjang: dikelompokkan per toko (menampilkan nama toko & kampusnya), tombol +/- jumlah, hapus item, subtotal per item, total harga |
| CART-3 |     M     | Badge jumlah item di header & _Floating Cart Bar_                                                                                            |
| CHK-1  |     M     | Checkout tanpa payment gateway. Pilih metode: **COD / Ketemuan di Kampus** (`meetup`) atau **Dikirim ke Alamat** (`delivery`)                |
| CHK-2  |     S     | Metode `delivery` meminta alamat pengiriman (pilih tersimpan atau isi baru)                                                                  |
| CHK-3  |     M     | Catatan untuk penjual (opsional)                                                                                                             |
| CHK-4  |     M     | Transaksi atomik (`BEGIN ... COMMIT` + `FOR UPDATE`): validasi stok, pecah order per toko, kurangi stok, kosongkan keranjang                 |
| CHK-5  |     M     | Redirect ke `/buyer/orders` dengan status awal `pending_payment`                                                                             |

### 5.4 Pesanan & Review

| ID    | Prioritas | Requirement                                                                                                    |
| ----- | :-------: | -------------------------------------------------------------------------------------------------------------- |
| ORD-1 |     M     | Riwayat pesanan Buyer & filter status                                                                          |
| ORD-2 |     M     | Detail & stepper tracking pesanan Buyer                                                                        |
| ORD-3 |     M     | Daftar pesanan masuk Seller (khusus tokonya)                                                                   |
| ORD-4 |     M     | Seller mengubah status sesuai transisi valid di `schema.md`                                                    |
| ORD-5 |     M     | Pembatalan mengembalikan stok produk                                                                           |
| ORD-6 |     S     | Anti-penipuan: Buyer menekan **Pesanan Diterima** saat barang telah diterima & dicek (`shipped` → `completed`) |
| ORD-7 |     M     | Untuk metode `meetup`, status `shipped` ditampilkan sebagai **Siap Ketemuan di Kampus**                        |
| REV-1 |     M     | Buyer memberi rating 1–5 dan komentar per item setelah pesanan `completed`                                     |
| REV-2 |     M     | Rata-rata rating dan daftar ulasan tampil di halaman detail produk                                             |

### 5.5 Manajemen Produk, Toko (Seller), dan Upload Foto

| ID        | Prioritas | Requirement                                                                                                                                                                                                                                             |
| --------- | :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD-1..6  |     M     | CRUD produk seller (nama, deskripsi, harga, harga awal opsional, stok, kategori, kondisi, 1–5 foto) dengan validasi server & cek kepemilikan                                                                                                            |
| STO-1..2  |     M     | Kelola profil toko: nama toko, **asal kampus** (`campus_id`), detail lokasi/area kost (`location`), deskripsi, dan foto toko                                                                                                                            |
| PHO-1..11 |     M     | Komponen `ImageUploader` (kamera ponsel `capture="environment"`, galeri, drag-and-drop desktop, serta `CameraModal` `getUserMedia`), kompresi JPEG maks. 1280 px di klien, validasi magic bytes JPEG di server, simpan ke `uploads/products/<uuid>.jpg` |

### 5.6 Manajemen Admin

| ID       | Prioritas | Requirement                                                                                   |
| -------- | :-------: | --------------------------------------------------------------------------------------------- |
| ADM-1    |     M     | Verifikasi Seller (`pending` → `approved` / `rejected`) beserta informasi kampus pendaftar    |
| ADM-2..4 |     M     | Lihat, edit, dan hapus user (tidak boleh menghapus akun sendiri)                              |
| ADM-5    |     M     | CRUD Kategori (tolak hapus jika masih dipakai produk)                                         |
| ADM-6    |     M     | Moderasi produk (lihat semua produk lintas kampus & hapus produk pelanggar)                   |
| ADM-7    |     S     | CRUD Kampus (`/admin/campuses`) untuk menambah/mengedit daftar perguruan tinggi di Indonesia  |
| PEN-1..3 |     M     | Halaman Pending Seller (`"Akun Anda sedang ditinjau."` dan tombol hapus akun jika `rejected`) |
