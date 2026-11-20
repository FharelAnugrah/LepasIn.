import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { validateStoreName, validateLocation } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller') {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const { name, campus_id, location, description } = body;

    const nameErr = validateStoreName(name);
    if (nameErr) {
      return NextResponse.json({ error: nameErr }, { status: 400 });
    }

    const parsedCampusId = Number(campus_id);
    if (!parsedCampusId) {
      return NextResponse.json({ error: 'Kampus toko wajib dipilih' }, { status: 400 });
    }

    if (location) {
      const locErr = validateLocation(location);
      if (locErr) {
        return NextResponse.json({ error: locErr }, { status: 400 });
      }
    }

    const result = await query(
      `UPDATE stores
       SET name = $1,
           campus_id = $2,
           location = $3,
           description = $4
       WHERE user_id = $5
       RETURNING id, name, campus_id, location, description`,
      [name.trim(), parsedCampusId, location?.trim() || null, description?.trim() || '', user.id]
    );

    let store = result.rows[0];
    if (!store) {
      const insertRes = await query(
        `INSERT INTO stores (user_id, campus_id, name, location, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, campus_id, location, description`,
        [user.id, parsedCampusId, name.trim(), location?.trim() || null, description?.trim() || '']
      );
      store = insertRes.rows[0];
    }

    // Update juga campus_id di user agar sinkron
    await query(`UPDATE users SET campus_id = $1 WHERE id = $2`, [parsedCampusId, user.id]);

    return NextResponse.json({
      success: true,
      message: 'Informasi toko berhasil diperbarui',
      store,
    });
  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui toko' }, { status: 500 });
  }
}
