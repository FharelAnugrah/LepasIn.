import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  next: z.string().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 400 }
      );
    }

    const { email, password, next: nextParam } = validated.data;
    const normalizedEmail = email.toLowerCase();

    // Query user beserta data toko (jika ada)
    const result = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.seller_status, u.campus_id,
              s.id AS store_id
       FROM users u
       LEFT JOIN stores s ON s.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Set cookie sesi lepasin_session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sellerStatus: user.seller_status,
      campusId: user.campus_id,
      storeId: user.store_id,
    });

    // Tentukan URL tujuan redirect
    let redirectTo = '/';
    if (user.role === 'admin') {
      redirectTo = nextParam && nextParam.startsWith('/admin') ? nextParam : '/admin';
    } else if (user.role === 'seller') {
      const defaultSeller = user.seller_status === 'approved' ? '/seller' : '/pending-seller';
      redirectTo =
        nextParam && nextParam.startsWith('/seller') && user.seller_status === 'approved'
          ? nextParam
          : defaultSeller;
    } else {
      // Buyer
      if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
        redirectTo = nextParam;
      } else {
        redirectTo = '/';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login' },
      { status: 500 }
    );
  }
}
