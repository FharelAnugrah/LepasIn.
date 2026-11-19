export const PRODUCT_NAME_MIN_LENGTH = 5;
export const PRODUCT_NAME_MAX_LENGTH = 100;

export const ALLOWED_PRODUCT_NAME_REGEX = /^[A-Za-z0-9 .,()&+\/|-]+$/;
const ALLOWED_PRODUCT_NAME_CHAR_REGEX = /^[A-Za-z0-9 .,()&+\/|-]$/;
const HAS_ALPHANUMERIC_REGEX = /[A-Za-z0-9]/;

const ALLOWED_CHARS_DESCRIPTION =
  'huruf (A-Z, a-z), angka (0-9), spasi, serta simbol - . , ( ) & + / |';

function isPrintableChar(ch) {
  const code = ch.codePointAt(0);
  if (code === undefined) return false;
  if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return false;
  if ((code >= 0x200b && code <= 0x200f) || code === 0xfe0e || code === 0xfe0f) {
    return false;
  }
  return true;
}

/**
 * Merapikan spasi berlebih di awal, akhir, maupun di antara kata pada nama produk.
 * Input yang hanya berisi whitespace dinormalisasi menjadi string kosong.
 */
export function normalizeProductName(value) {
  if (typeof value !== 'string') return '';
  if (!value.trim()) return '';
  return value.replace(/[ \u00A0]+/g, ' ').replace(/^ +| +$/g, '');
}

function getDisallowedProductNameChars(value) {
  const disallowed = [];
  const seen = new Set();

  for (const ch of value) {
    if (!ALLOWED_PRODUCT_NAME_CHAR_REGEX.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      disallowed.push(ch);
    }
  }

  return disallowed;
}

function formatDisallowedCharsMessage(disallowedChars) {
  const visible = disallowedChars.filter(isPrintableChar);
  if (visible.length === 0) {
    return `Nama produk mengandung karakter yang tidak diperbolehkan. Hanya boleh berisi ${ALLOWED_CHARS_DESCRIPTION}.`;
  }
  const preview =
    visible.length > 3 ? `${visible.slice(0, 3).join(', ')}, ...` : visible.join(', ');
  return `Karakter tidak diperbolehkan (${preview}). Nama produk hanya boleh berisi ${ALLOWED_CHARS_DESCRIPTION}.`;
}

/**
 * Memvalidasi nama produk sesuai aturan karakter, huruf/angka wajib,
 * panjang 5-100 karakter, dan normalisasi spasi berlebih.
 */
export function validateProductName(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return {
      valid: false,
      code: 'REQUIRED',
      error: 'Nama produk wajib diisi.',
      normalizedName: '',
    };
  }

  if (typeof rawValue !== 'string') {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      error: 'Nama produk harus berupa teks.',
      normalizedName: '',
    };
  }

  const normalizedName = normalizeProductName(rawValue);

  if (!normalizedName) {
    return {
      valid: false,
      code: 'REQUIRED',
      error: 'Nama produk wajib diisi.',
      normalizedName: '',
    };
  }

  if (!ALLOWED_PRODUCT_NAME_REGEX.test(normalizedName)) {
    const disallowedChars = getDisallowedProductNameChars(normalizedName);
    return {
      valid: false,
      code: 'DISALLOWED_CHARS',
      error: formatDisallowedCharsMessage(disallowedChars),
      normalizedName,
    };
  }

  if (!HAS_ALPHANUMERIC_REGEX.test(normalizedName)) {
    return {
      valid: false,
      code: 'NO_ALPHANUMERIC',
      error: 'Nama produk wajib mengandung minimal satu huruf atau angka.',
      normalizedName,
    };
  }

  if (normalizedName.length < PRODUCT_NAME_MIN_LENGTH) {
    return {
      valid: false,
      code: 'TOO_SHORT',
      error: `Nama produk minimal ${PRODUCT_NAME_MIN_LENGTH} karakter.`,
      normalizedName,
    };
  }

  if (normalizedName.length > PRODUCT_NAME_MAX_LENGTH) {
    return {
      valid: false,
      code: 'TOO_LONG',
      error: `Nama produk maksimal ${PRODUCT_NAME_MAX_LENGTH} karakter.`,
      normalizedName,
    };
  }

  return {
    valid: true,
    code: null,
    error: null,
    normalizedName,
  };
}

/**
 * Membuat schema Zod untuk validasi dan normalisasi nama produk di API backend.
 */
export function createProductNameSchema(z) {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined || issue.input === null
          ? 'Nama produk wajib diisi.'
          : 'Nama produk harus berupa teks.',
    })
    .transform((val) => normalizeProductName(val))
    .superRefine((normalized, ctx) => {
      const result = validateProductName(normalized);
      if (!result.valid) {
        ctx.addIssue({
          code: 'custom',
          message: result.error,
        });
      }
    });
}
