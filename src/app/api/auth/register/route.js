import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import {
  FULL_NAME_REGEX,
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateStoreName,
  validateLocation,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

const registerSchema = z
  .object({
    name: z
      .string({ message: 'Nama lengkap wajib diisi' })
      .trim()
      .min(1, 'Nama lengkap wajib diisi')
      .min(3, 'Nama lengkap minimal 3 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    email: z
      .string({ message: 'Alamat email wajib diisi' })
      .trim()
      .min(1, 'Alamat email wajib diisi')
      .email('Format email belum valid. Contoh: nama@gmail.com.')
      .max(255, 'Alamat email maksimal 255 karakter'),
    phone: z
      .string({ message: 'Nomor WhatsApp/HP wajib diisi' })
      .trim()
      .min(1, 'Nomor WhatsApp/HP wajib diisi'),
    password: z
      .string({ message: 'Password wajib diisi' })
      .min(1, 'Password wajib diisi'),
    confirmPassword: z
      .string({ message: 'Konfirmasi password wajib diisi' })
      .min(1, 'Konfirmasi password wajib diisi'),
    role: z.enum(['buyer', 'seller'], {
      errorMap: () => ({ message: 'Pilih peran sebagai Pembeli atau Penjual' }),
    }),
    campus_id: z.union([z.number(), z.string()]).nullable().optional(),
    store_name: z.string().trim().max(100).optional(),
    location: z.string().trim().max(150).optional(),
    id_card_url: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (!data.name) return true;
      return FULL_NAME_REGEX.test(data.name.trim());
    },
    {
      message: 'Nama hanya boleh menggunakan huruf, spasi, titik, dan apostrof.',
      path: ['name'],
    }
  )
  .refine(
    (data) => {
      if (!data.name || data.name.trim().length === 0) return false;
      return /[a-zA-Z]/.test(data.name);
    },
    {
      message: 'Nama lengkap harus memuat minimal satu huruf alfabet dan tidak boleh hanya berisi spasi, titik, atau apostrof.',
      path: ['name'],
    }
  )
  .refine(
    (data) => {
      const nonSpaceLength = (data.password || '').replace(/\s/g, '').length;
      return nonSpaceLength >= 8;
    },
    {
      message: 'Password minimal 8 karakter (spasi tidak dihitung)',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      // Hanya menerima angka, huruf, dan simbol (spasi tidak dihitung)
      const allowedRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`\s]+$/;
      return allowedRegex.test(data.password || '');
    },
    {
      message: 'Password hanya boleh memuat huruf, angka, dan simbol',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      return /^(?=.*[A-Za-z])(?=.*\d)/.test(data.password || '');
    },
    {
      message: 'Password harus memuat kombinasi huruf dan angka',
      path: ['password'],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok dengan password yang dimasukkan',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const err = validatePhone(data.phone);
      return !err;
    },
    {
      message: 'Masukkan nomor WhatsApp dengan format yang benar (diawali 08, 10–15 digit).',
      path: ['phone'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'seller') {
        return !!data.campus_id && Number(data.campus_id) > 0;
      }
      return true;
    },
    {
      message: 'Penjual wajib memilih kampus dari daftar perguruan tinggi yang tersedia',
      path: ['campus_id'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'seller') {
        const s = data.store_name ? data.store_name.trim() : '';
        if (s.length < 3) return false;
        if (!/[a-zA-Z]/.test(s)) return false;
        return /^[a-zA-Z0-9\s&'.,\-_/]+$/.test(s);
      }
      return true;
    },
    {
      message: 'Nama toko/lapak wajib diisi minimal 3 karakter dan tidak boleh hanya berisi angka atau simbol',
      path: ['store_name'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'seller') {
        const loc = data.location ? data.location.trim() : '';
        if (loc.length < 5) return false;
        if (!/[a-zA-Z]/.test(loc)) return false;
        return /^[a-zA-Z0-9\s&'.,\-_/()]+$/.test(loc);
      }
      return true;
    },
    {
      message: 'Detail lokasi/area kost wajib diisi minimal 5 karakter dan harus memuat informasi lokasi yang bermakna',
      path: ['location'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'seller') {
        return !!data.id_card_url && data.id_card_url.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Wajib mengunggah foto selfie dengan memegang KTM atau kartu tanda pengenal lainnya',
      path: ['id_card_url'],
    }
  )
  .refine(
    (data) => {
      if (data.role === 'seller' && data.id_card_url) {
        const val = data.id_card_url.trim();
        return (
          val.startsWith('/uploads/') ||
          val.startsWith('/api/uploads/') ||
          val.startsWith('http://') ||
          val.startsWith('https://') ||
          val.startsWith('data:image/')
        );
      }
      return true;
    },
    {
      message: 'Format URL foto identitas tidak valid',
      path: ['id_card_url'],
    }
  );

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      const fieldErrors = {};
      const issues = validated.error.issues || validated.error.errors || [];
      issues.forEach((err) => {
        const field = err.path[0];
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      const firstErrorMessage = Object.values(fieldErrors)[0];
      return NextResponse.json(
        {
          error: firstErrorMessage || 'Mohon lengkapi data formulir dengan benar',
          errors: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role, campus_id, store_name, location, id_card_url } = validated.data;
    const normalizedEmail = email.toLowerCase();
    const parsedCampusId = campus_id ? Number(campus_id) : null;
    const cleanPhone = phone
      ? phone.trim().replace(/[\s-]/g, '').replace(/^(\+62|62)/, '0')
      : null;

    // Cek apakah email sudah terdaftar
    const existing = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akunmu.',
          errors: {
            email: 'Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akunmu.',
          },
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const sellerStatus = role === 'seller' ? 'pending' : null;

    // Mutasi database dalam transaksi atomik
    const newUserData = await withTransaction(async (client) => {
      // 1. Insert ke tabel users
      const userRes = await client.query(
        `INSERT INTO users (campus_id, name, email, password_hash, role, seller_status, phone, id_card_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, role, seller_status, campus_id`,
        [
          parsedCampusId,
          name,
          normalizedEmail,
          passwordHash,
          role,
          sellerStatus,
          cleanPhone || null,
          role === 'seller' ? id_card_url?.trim() || null : null,
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
            `Toko Mahasiswa ${name} di sekitar kampus.`,
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
      const emailErr = 'Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akunmu.';
      return NextResponse.json(
        {
          error: emailErr,
          errors: { email: emailErr },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Terjadi gangguan pada server saat mendaftarkan akun. Silakan coba beberapa saat lagi.',
      },
      { status: 500 }
    );
  }
}
