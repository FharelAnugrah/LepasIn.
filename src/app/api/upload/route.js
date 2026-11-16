import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Allowed MIME types and extensions: strictly JPG/JPEG and PNG
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validasi magic bytes untuk file gambar asli (mencegah file palsu)
 * JPEG: FF D8 FF
 * PNG: 89 50 4E 47 0D 0A 1A 0A
 */
function isValidMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 8) return false;

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

  return false;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') || 'products').toString().replace(/[^a-z0-9_-]/gi, '');

    // Validasi folder yang diizinkan (verifications untuk foto selfie KTM saat registrasi seller)
    const allowedFolders = ['products', 'stores', 'avatars', 'verifications'];
    const targetFolder = allowedFolders.includes(folder) ? folder : 'products';

    // Verifikasi identitas (KTM / selfie) diizinkan saat pendaftaran sebelum memiliki sesi aktif
    const user = await getCurrentUser();
    if (!user && targetFolder !== 'verifications') {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    // 1. Validasi tipe MIME
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Hanya file foto JPG/JPEG dan PNG yang diperbolehkan.' },
        { status: 400 }
      );
    }

    // 2. Validasi ekstensi
    const origExt = path.extname(file.name || '').toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.includes(origExt)
      ? origExt === '.jpeg' ? '.jpg' : origExt
      : mimeType === 'image/png' ? '.png' : '.jpg';

    // 3. Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar. Maksimal 10 MB per foto.' },
        { status: 400 }
      );
    }

    // 4. Baca buffer dan validasi magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'File gambar rusak atau bukan file JPG/PNG yang valid.' },
        { status: 400 }
      );
    }

    // 5. Simpan ke direktori public/uploads/[folder]
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}${validExt}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${targetFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Foto berhasil diunggah',
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengunggah foto' },
      { status: 500 }
    );
  }
}
