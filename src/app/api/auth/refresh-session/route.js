import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sellerStatus: user.seller_status,
      campusId: user.campus_id,
      storeId: user.store_id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        sellerStatus: user.seller_status,
      },
    });
  } catch (err) {
    console.error('Refresh session error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui sesi' }, { status: 500 });
  }
}
