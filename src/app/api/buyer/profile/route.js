import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { validateFullName, validatePhone } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, campus_id } = body;

    const nameErr = validateFullName(name);
    if (nameErr) {
      return NextResponse.json({ error: nameErr }, { status: 400 });
    }

    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        return NextResponse.json({ error: phoneErr }, { status: 400 });
      }
    }

    const parsedCampusId = campus_id ? Number(campus_id) : null;

    const result = await query(
      `UPDATE users
       SET name = $1,
           phone = $2,
           campus_id = $3
       WHERE id = $4
       RETURNING id, name, email, phone, campus_id`,
      [name.trim(), phone ? phone.trim() : null, parsedCampusId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui profil' }, { status: 500 });
  }
}
