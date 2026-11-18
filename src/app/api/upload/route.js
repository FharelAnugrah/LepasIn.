import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Format yang didukung: JPEG, PNG, dan WebP (maksimal 2 MB)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

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
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image');
    const folder = (formData.get('folder') || 'products').toString();

    // Verifikasi identitas (KTM / selfie) diizinkan saat pendaftaran sebelum memiliki sesi aktif
    const user = await getCurrentUser();
    if (!user && folder !== 'verifications') {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    // 1. Validasi tipe MIME
    const mimeType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Hanya file foto JPG/JPEG, PNG, dan WebP yang diperbolehkan.' },
        { status: 400 }
      );
    }

    // 2. Validasi ukuran file (maksimal 2 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran foto terlalu besar. Maksimal 2 MB per foto.' },
        { status: 400 }
      );
    }

    // 3. Baca buffer dan validasi magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'File gambar rusak atau bukan file JPG/PNG/WebP yang valid.' },
        { status: 400 }
      );
    }

    // 4. Konversi langsung ke Base64 Data URL (data:image/...;base64,...) tanpa menyimpan ke public/uploads/
    const base64DataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Foto berhasil diproses',
      url: base64DataUrl,
      fileName: file.name || 'foto.jpg',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses foto' },
      { status: 500 }
    );
  }
}
