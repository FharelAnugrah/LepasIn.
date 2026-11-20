import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import PendingSellerClient from './PendingSellerClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Status Verifikasi Penjual | LepasIn',
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
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8 outline-none"
    >
      <PendingSellerClient user={user} />
    </main>
  );
}
