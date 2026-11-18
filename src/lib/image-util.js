export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Validasi magic bytes file gambar asli
 */
export function isValidImageMagicBytes(buffer, mimeType) {
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

/**
 * Konversi File atau String Data URL menjadi Base64 Data URL terverifikasi
 * @param {File|Blob|string} item
 * @returns {Promise<string>} Base64 Data URL (data:image/...;base64,...)
 */
export async function processImageInput(item) {
  if (!item) return null;

  // Jika berupa objek File / Blob dari FormData
  if (typeof item === 'object' && typeof item.arrayBuffer === 'function') {
    const fileName = item.name || 'foto';
    const mimeType = (item.type || '').toLowerCase();

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Format file "${fileName}" tidak didukung. Hanya file JPG/JPEG, PNG, dan WebP yang diperbolehkan.`
      );
    }

    if (item.size > MAX_IMAGE_FILE_SIZE) {
      throw new Error(`Ukuran foto "${fileName}" melebihi batas maksimal 2 MB.`);
    }

    const arrayBuffer = await item.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer, mimeType)) {
      throw new Error(`File "${fileName}" rusak atau bukan file gambar yang valid.`);
    }

    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  // Jika berupa string (sudah berupa Data URL atau path string)
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:image/')) {
      const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1].toLowerCase();
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
          throw new Error(
            'Format gambar Base64 tidak didukung. Hanya JPG/JPEG, PNG, dan WebP yang diperbolehkan.'
          );
        }
        // Validasi panjang base64 tidak melebihi ~2 MB binary (~2.8 MB base64 string)
        if (match[2].length > 3 * 1024 * 1024) {
          throw new Error('Ukuran gambar Base64 melebihi batas maksimal 2 MB.');
        }
      }
      return trimmed;
    }

    // Path data lama yang valid
    return trimmed;
  }

  return null;
}

/**
 * Ekstrak dan konversi seluruh gambar dari FormData atau JSON payload
 * @param {FormData|object} container
 * @returns {Promise<string[]>} Daftar URL/Data URL gambar
 */
export async function extractAndProcessImages(container) {
  const rawList = [];

  if (typeof container.getAll === 'function') {
    // Berasal dari FormData
    const entries = [
      ...container.getAll('images'),
      ...container.getAll('files'),
      ...container.getAll('image_urls'),
      ...container.getAll('image_urls[]'),
    ];

    for (const entry of entries) {
      if (!entry) continue;

      // Jika ada JSON string array di dalam FormData
      if (typeof entry === 'string' && entry.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(entry);
          if (Array.isArray(parsed)) {
            rawList.push(...parsed);
            continue;
          }
        } catch {
          // Lanjutkan sebagai string biasa
        }
      }

      rawList.push(entry);
    }
  } else if (container && Array.isArray(container.image_urls)) {
    rawList.push(...container.image_urls);
  }

  const results = [];
  for (const item of rawList) {
    const processed = await processImageInput(item);
    if (processed) {
      results.push(processed);
    }
  }

  return results;
}
