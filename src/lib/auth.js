import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Hash password menggunakan bcrypt dengan cost faktor 10
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verifikasi password mentah terhadap hash di database
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Ambil data user lengkap yang sedang login berdasarkan sesi saat ini
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session || !session.userId) {
    return null;
  }

  try {
    const res = await query(
      `SELECT u.id, u.name, u.email, u.role, u.seller_status, u.phone, u.avatar_url,
              u.campus_id, c.name AS campus_name, c.short_name AS campus_short_name, c.city AS campus_city,
              s.id AS store_id, s.name AS store_name, s.location AS store_location
       FROM users u
       LEFT JOIN campuses c ON c.id = u.campus_id
       LEFT JOIN stores s ON s.user_id = u.id
       WHERE u.id = $1`,
      [session.userId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return res.rows[0];
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Pastikan user sudah login; jika belum, arahkan ke halaman login
 * Perhatian Next.js: redirect() tidak boleh dibungkus try/catch
 * @param {string} nextUrl URL tujuan kembali setelah login
 * @returns {Promise<object>} User data
 */
export async function requireUser(nextUrl = '') {
  const user = await getCurrentUser();
  if (!user) {
    const target = nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login';
    redirect(target);
  }
  return user;
}

/**
 * Pastikan user memiliki salah satu role yang diizinkan
 * @param {string|string[]} roles
 * @param {string} nextUrl URL tujuan kembali setelah login jika belum login
 * @returns {Promise<object>} User data
 */
export async function requireRole(roles, nextUrl = '') {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireUser(nextUrl);

  if (!allowed.includes(user.role)) {
    if (user.role === 'admin') redirect('/admin');
    if (user.role === 'seller') {
      redirect(user.seller_status === 'approved' ? '/seller' : '/pending-seller');
    }
    redirect('/');
  }

  return user;
}

/**
 * Pastikan user adalah admin
 * @param {string} nextUrl
 * @returns {Promise<object>}
 */
export async function requireAdmin(nextUrl = '') {
  return await requireRole('admin', nextUrl);
}

/**
 * Pastikan user adalah seller yang sudah disetujui (approved)
 * Jika seller berstatus pending atau rejected, diarahkan ke /pending-seller
 * @param {string} nextUrl
 * @returns {Promise<object>}
 */
export async function requireApprovedSeller(nextUrl = '') {
  const user = await requireRole('seller', nextUrl);

  if (user.seller_status !== 'approved') {
    redirect('/pending-seller');
  }

  return user;
}

/**
 * Pastikan user adalah buyer
 * @param {string} nextUrl
 * @returns {Promise<object>}
 */
export async function requireBuyer(nextUrl = '') {
  return await requireRole('buyer', nextUrl);
}
