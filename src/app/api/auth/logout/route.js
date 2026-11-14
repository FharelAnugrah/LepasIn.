import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true, message: 'Berhasil keluar' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses logout' },
      { status: 500 }
    );
  }
}
