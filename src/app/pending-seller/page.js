import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import PendingSellerClient from './PendingSellerClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Menunggu Verifikasi Toko — LepasIn',
  description: 'Status verifikasi akun penjual LepasIn.',
};

export default async function PendingSellerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'seller') {
    redirect('/');
  }

  if (user.seller_status === 'approved') {
    redirect('/seller');
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <PendingSellerClient user={user} />
    </main>
  );
}
