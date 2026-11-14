import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().trim().email('Format email tidak valid').max(255),
  phone: z.string().trim().regex(/^08[0-9]{8,12}$/, 'Nomor WhatsApp/HP tidak valid (contoh: 081234567890)').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password harus memuat kombinasi huruf dan angka'),
  confirmPassword: z.string(),
  role: z.enum(['buyer', 'seller'], {
    errorMap: () => ({ message: 'Pilih peran sebagai Pembeli atau Penjual' }),
  }),
  campus_id: z.union([z.number(), z.string()]).nullable().optional(),
  store_name: z.string().trim().max(100).optional(),
  location: z.string().trim().max(150).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'seller') {
    return !!data.campus_id && Number(data.campus_id) > 0;
  }
  return true;
}, {
  message: 'Penjual wajib memilih kampus tempat berjualan',
  path: ['campus_id'],
}).refine((data) => {
  if (data.role === 'seller') {
    return !!data.store_name && data.store_name.trim().length >= 2;
  }
  return true;
}, {
  message: 'Nama toko wajib diisi (minimal 2 karakter)',
  path: ['store_name'],
});

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const fieldErrors = {};
      validated.error.errors.forEach((err) => {
        const field = err.path[0];
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const { name, email, phone, password, role, campus_id, store_name, location } = validated.data;
    const normalizedEmail = email.toLowerCase();
    const parsedCampusId = campus_id ? Number(campus_id) : null;

    // Cek apakah email sudah terdaftar
    const existing = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { errors: { email: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const sellerStatus = role === 'seller' ? 'pending' : null;

    // Mutasi database dalam transaksi atomik
    const newUserData = await withTransaction(async (client) => {
      // 1. Insert ke tabel users
      const userRes = await client.query(
        `INSERT INTO users (campus_id, name, email, password_hash, role, seller_status, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, role, seller_status, campus_id`,
        [
          parsedCampusId,
          name,
          normalizedEmail,
          passwordHash,
          role,
          sellerStatus,
          phone || null,
        ]
      );

      const user = userRes.rows[0];
      let storeId = null;

      // 2. Jika seller, buat toko secara otomatis
      if (role === 'seller') {
        const storeRes = await client.query(
          `INSERT INTO stores (user_id, campus_id, name, description, location)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            user.id,
            parsedCampusId,
            store_name.trim(),
            `Toko mahasiswa ${name} di sekitar kampus.`,
            location ? location.trim() : null,
          ]
        );
        storeId = storeRes.rows[0].id;
      }

      return { ...user, storeId };
    });

    // Buat cookie sesi
    await createSession({
      userId: newUserData.id,
      email: newUserData.email,
      name: newUserData.name,
      role: newUserData.role,
      sellerStatus: newUserData.seller_status,
      campusId: newUserData.campus_id,
      storeId: newUserData.storeId,
    });

    const redirectTo = role === 'seller' ? '/pending-seller' : '/';

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      redirectTo,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { errors: { email: 'Email sudah terdaftar' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat registrasi' },
      { status: 500 }
    );
  }
}
