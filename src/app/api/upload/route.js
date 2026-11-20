import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS = ['products', 'stores', 'avatars', 'verifications'];

// Untuk verifikasi KTM identitas: format wajib JPG/JPEG dan PNG, maksimal 10 MB
const VERIFICATION_MIMES = ['image/jpeg', 'image/png'];
const VERIFICATION_EXTS = ['.jpg', '.jpeg', '.png'];
const MAX_VERIFICATION_SIZE = 10 * 1024 * 1024; // 10 MB

// Untuk umum (produk, avatar, toko): JPEG, PNG, dan WebP, maksimal 10 MB
const GENERAL_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GENERAL_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validasi magic bytes untuk file gambar asli (mencegah file berbahaya/palsu)
 * JPEG: FF D8 FF
 * PNG: 89 50 4E 47 0D 0A 1A 0A
 * WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
 */
function isValidMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  return false;
}

export async function POST(request) {
  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    // Jika ukuran payload awal jelas melampaui batas maksimal 10 MB (tambah margin header ~128KB)
    if (contentLength > MAX_VERIFICATION_SIZE + 131072) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar. Maksimal 10 MB per foto.' },
        { status: 400 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar atau gagal diuraikan. Maksimal 10 MB per foto.' },
        { status: 400 }
      );
    }
    const file = formData.get('file') || formData.get('image');
    const rawFolder = (formData.get('folder') || 'products').toString();
    const sanitizedFolder = rawFolder.replace(/[^a-z0-9_-]/gi, '');
    const targetFolder = ALLOWED_FOLDERS.includes(sanitizedFolder) ? sanitizedFolder : 'products';

    // Verifikasi identitas (KTM / selfie) diizinkan saat pendaftaran sebelum memiliki sesi aktif
    const user = await getCurrentUser();
    if (!user && targetFolder !== 'verifications') {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    const mimeType = (file.type || '').toLowerCase();
    const originalExt = path.extname(file.name || '').toLowerCase();

    // 1. Validasi format file & ukuran berdasarkan folder tujuan
    if (targetFolder === 'verifications') {
      if (!VERIFICATION_MIMES.includes(mimeType)) {
        return NextResponse.json(
          { error: 'Format foto ditolak. Hanya format JPG/JPEG dan PNG yang diperbolehkan.' },
          { status: 400 }
        );
      }

      if (file.name && !VERIFICATION_EXTS.includes(originalExt) && originalExt !== '') {
        return NextResponse.json(
          { error: 'Format file tidak sesuai. Hanya ekstensi JPG/JPEG dan PNG yang diperbolehkan.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_VERIFICATION_SIZE) {
        return NextResponse.json(
          { error: 'Ukuran foto terlalu besar. Maksimal 10 MB per foto.' },
          { status: 400 }
        );
      }
    } else {
      if (!GENERAL_MIMES.includes(mimeType)) {
        return NextResponse.json(
          { error: 'Format file tidak didukung. Hanya file foto JPG/JPEG, PNG, dan WebP yang diperbolehkan.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_GENERAL_SIZE) {
        return NextResponse.json(
          { error: 'Ukuran foto terlalu besar. Maksimal 10 MB per foto.' },
          { status: 400 }
        );
      }
    }

    // 2. Baca buffer dan validasi integritas magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'File gambar rusak atau bukan file gambar yang valid.' },
        { status: 400 }
      );
    }

    // 3. Simpan file ke sistem penyimpanan file disk (public/uploads/[folder])
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let fileExt = '.jpg';
    if (mimeType === 'image/png') {
      fileExt = '.png';
    } else if (mimeType === 'image/webp') {
      fileExt = '.webp';
    } else if (originalExt === '.jpeg') {
      fileExt = '.jpg';
    }

    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    // URL publik yang dapat diakses browser
    const publicUrl = `/uploads/${targetFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Foto berhasil diunggah',
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (
      error?.message?.includes('FormData') ||
      error?.message?.includes('maxFileSize') ||
      error?.name === 'PayloadTooLargeError'
    ) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar. Maksimal 10 MB per foto.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses foto' },
      { status: 500 }
    );
  }
}
