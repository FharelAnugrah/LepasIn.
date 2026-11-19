/**
 * Modul Validasi Terpusat LepasIn
 * Menyediakan aturan validasi, regex, dan pesan kesalahan yang konsisten
 * untuk seluruh form frontend dan endpoint API backend.
 */

// 1. REGEX RESMI
export const FULL_NAME_REGEX = /^[A-Za-z.' ]+$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const STORE_NAME_REGEX = /^[a-zA-Z0-9\s&'.,\-_/]+$/;
export const LOCATION_REGEX = /^[a-zA-Z0-9\s&'.,\-_/()]+$/;
export const CAMPUS_NAME_REGEX = /^[a-zA-Z0-9\s&'.,\-_/()]+$/;
export const CAMPUS_SHORT_NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;
export const CITY_PROVINCE_REGEX = /^[a-zA-Z\s'.-]+$/;
export const CATEGORY_NAME_REGEX = /^[a-zA-Z0-9\s&'.,\-_/]+$/;
export const PASSWORD_ALLOWED_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`\s]+$/;

/**
 * Validasi Nama Lengkap:
 * - Hanya huruf alfabet (A-Z, a-z), spasi, tanda apostrof ('), dan titik (.).
 * - Tidak boleh hanya berisi spasi, titik, atau apostrof (harus ada minimal satu huruf).
 * - Tidak boleh memuat angka, simbol selain apostrof dan titik, emoji, atau karakter khusus lainnya.
 * - Minimal 3 karakter, maksimal 100 karakter.
 */
export function validateFullName(value) {
  if (value === undefined || value === null) {
    return 'Nama lengkap wajib diisi.';
  }
  const str = String(value);
  const trimmed = str.trim();
  if (!trimmed) {
    return 'Nama lengkap wajib diisi.';
  }
  if (trimmed.length < 3) {
    return 'Nama lengkap minimal 3 karakter.';
  }
  if (trimmed.length > 100) {
    return 'Nama lengkap maksimal 100 karakter.';
  }
  if (!FULL_NAME_REGEX.test(trimmed)) {
    return 'Nama hanya boleh menggunakan huruf, spasi, titik, dan apostrof.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Nama lengkap harus memuat minimal satu huruf alfabet dan tidak boleh hanya berisi spasi, titik, atau apostrof.';
  }
  return null;
}

/**
 * Validasi Format Alamat Email
 */
export function validateEmail(value) {
  if (value === undefined || value === null) {
    return 'Alamat email wajib diisi.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Alamat email wajib diisi.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Format email belum valid. Contoh: nama@gmail.com.';
  }
  if (trimmed.length > 255) {
    return 'Alamat email maksimal 255 karakter.';
  }
  return null;
}

/**
 * Normalisasi nomor WhatsApp / HP (menghilangkan spasi, tanda hubung, dan mengubah +62/62 menjadi 0)
 */
export function normalizePhoneNumber(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/[\s-]/g, '')
    .replace(/^(\+62|62)/, '0');
}

/**
 * Validasi Nomor WhatsApp / HP:
 * - Harus diawali 08
 * - Total digit 10 hingga 15 digit
 * - Tidak boleh mengandung huruf
 */
export function validatePhone(value) {
  if (value === undefined || value === null) {
    return 'Nomor WhatsApp/HP wajib diisi.';
  }
  const str = String(value).trim();
  if (!str) {
    return 'Nomor WhatsApp/HP wajib diisi.';
  }
  if (/[a-zA-Z]/.test(str)) {
    return 'Nomor WhatsApp/HP tidak boleh memuat huruf.';
  }
  const cleaned = normalizePhoneNumber(str);
  if (!/^08[0-9]{8,13}$/.test(cleaned)) {
    return 'Masukkan nomor WhatsApp dengan format yang benar (diawali 08, 10–15 digit).';
  }
  return null;
}

/**
 * Validasi Keamanan Password:
 * - Minimal 8 karakter (spasi tidak dihitung)
 * - Kombinasi huruf dan angka
 * - Boleh mengandung simbol umum
 */
export function validatePassword(value) {
  if (value === undefined || value === null) {
    return 'Password wajib diisi.';
  }
  const str = String(value);
  if (!str) {
    return 'Password wajib diisi.';
  }
  const nonSpaceLength = str.replace(/\s/g, '').length;
  if (nonSpaceLength < 8) {
    return 'Password minimal 8 karakter dan harus memenuhi ketentuan keamanan.';
  }
  if (!PASSWORD_ALLOWED_REGEX.test(str)) {
    return 'Password hanya boleh memuat huruf, angka, dan simbol.';
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(str)) {
    return 'Password minimal 8 karakter dan harus memenuhi ketentuan keamanan (kombinasi huruf dan angka).';
  }
  return null;
}

/**
 * Validasi Konfirmasi Password
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (confirmPassword === undefined || confirmPassword === null || !String(confirmPassword)) {
    return 'Ulangi password untuk konfirmasi.';
  }
  if (String(password) !== String(confirmPassword)) {
    return 'Konfirmasi password tidak cocok dengan password yang dimasukkan.';
  }
  return null;
}

/**
 * Validasi Nama Toko / Lapak (Seller)
 */
export function validateStoreName(value) {
  if (value === undefined || value === null) {
    return 'Nama toko/lapak wajib diisi untuk penjual.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Nama toko/lapak wajib diisi untuk penjual.';
  }
  if (trimmed.length < 3) {
    return 'Nama toko minimal 3 karakter.';
  }
  if (trimmed.length > 100) {
    return 'Nama toko maksimal 100 karakter.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Nama toko tidak boleh hanya terdiri dari angka atau simbol, harus memuat huruf.';
  }
  if (!STORE_NAME_REGEX.test(trimmed)) {
    return 'Nama toko memuat simbol yang tidak diperbolehkan.';
  }
  return null;
}

/**
 * Validasi Detail Lokasi / Area Kost (Seller)
 */
export function validateLocation(value) {
  if (value === undefined || value === null) {
    return 'Detail lokasi/area kost wajib diisi untuk penjual.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Detail lokasi/area kost wajib diisi untuk penjual.';
  }
  if (trimmed.length < 5) {
    return 'Detail lokasi minimal 5 karakter.';
  }
  if (trimmed.length > 150) {
    return 'Detail lokasi maksimal 150 karakter.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Detail lokasi tidak boleh hanya terdiri dari angka atau simbol, harus memuat informasi lokasi yang bermakna.';
  }
  if (!LOCATION_REGEX.test(trimmed)) {
    return 'Detail lokasi memuat simbol yang tidak diperbolehkan.';
  }
  return null;
}

/**
 * Validasi Nama Perguruan Tinggi / Kampus
 */
export function validateCampusName(value) {
  if (value === undefined || value === null) {
    return 'Nama perguruan tinggi/kampus wajib diisi.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Nama perguruan tinggi/kampus wajib diisi.';
  }
  if (trimmed.length < 3) {
    return 'Nama kampus minimal 3 karakter.';
  }
  if (trimmed.length > 150) {
    return 'Nama kampus maksimal 150 karakter.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Nama kampus harus memuat huruf alfabet.';
  }
  if (!CAMPUS_NAME_REGEX.test(trimmed)) {
    return 'Nama kampus memuat karakter yang tidak diperbolehkan.';
  }
  return null;
}

/**
 * Validasi Singkatan / Kode Kampus (misal: UNHAS, UI, ITB)
 */
export function validateCampusShortName(value) {
  if (value === undefined || value === null) {
    return 'Singkatan nama kampus wajib diisi.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Singkatan nama kampus wajib diisi.';
  }
  if (trimmed.length < 2) {
    return 'Singkatan kampus minimal 2 karakter.';
  }
  if (trimmed.length > 20) {
    return 'Singkatan kampus maksimal 20 karakter.';
  }
  if (!CAMPUS_SHORT_NAME_REGEX.test(trimmed)) {
    return 'Singkatan kampus hanya boleh huruf, angka, dan tanda hubung.';
  }
  return null;
}

/**
 * Validasi Kota / Provinsi Kampus
 */
export function validateCityOrProvince(value, label = 'Kota') {
  if (value === undefined || value === null) {
    return `${label} wajib diisi.`;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return `${label} wajib diisi.`;
  }
  if (trimmed.length < 3) {
    return `${label} minimal 3 karakter.`;
  }
  if (trimmed.length > 100) {
    return `${label} maksimal 100 karakter.`;
  }
  if (!CITY_PROVINCE_REGEX.test(trimmed)) {
    return `${label} hanya boleh menggunakan huruf, spasi, titik, dan tanda hubung.`;
  }
  return null;
}

/**
 * Validasi Nama Kategori Produk
 */
export function validateCategoryName(value) {
  if (value === undefined || value === null) {
    return 'Nama kategori wajib diisi.';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return 'Nama kategori wajib diisi.';
  }
  if (trimmed.length < 2) {
    return 'Nama kategori minimal 2 karakter.';
  }
  if (trimmed.length > 50) {
    return 'Nama kategori maksimal 50 karakter.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Nama kategori harus memuat huruf alfabet.';
  }
  if (!CATEGORY_NAME_REGEX.test(trimmed)) {
    return 'Nama kategori memuat simbol yang tidak diperbolehkan.';
  }
  return null;
}
