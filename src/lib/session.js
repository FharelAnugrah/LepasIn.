import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'lepasin_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 hari dalam detik

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lepasin-secure-jwt-secret-key-for-session-auth-2026'
);

/**
 * Buat token JWT untuk sesi pengguna
 * @param {object} payload Data pengguna yang disimpan dalam sesi
 * @returns {Promise<string>} Token JWT
 */
export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verifikasi token JWT tanpa dependensi cookies() (berguna untuk proxy.js dan request context)
 * @param {string} token
 * @returns {Promise<object|null>} Payload jika valid, null jika invalid/expired
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Buat sesi baru dan set cookie lepasin_session di respons
 * @param {object} payload { userId, email, name, role, sellerStatus, campusId, storeId }
 * @returns {Promise<string>} Token JWT yang baru dibuat
 */
export async function createSession(payload) {
  const token = await signSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

/**
 * Baca sesi saat ini dari cookie lepasin_session
 * @returns {Promise<object|null>} Payload sesi atau null
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return await verifySessionToken(token);
}

/**
 * Hapus sesi cookie lepasin_session (logout)
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
