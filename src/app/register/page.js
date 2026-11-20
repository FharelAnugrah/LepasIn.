import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daftar Akun | LepasIn',
  description: 'Daftar akun LepasIn untuk mulai melepas atau membeli barang kost preloved di seluruh kampus Indonesia.',
};

export default function RegisterPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-canvas flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 outline-none"
    >
      <Suspense
        fallback={
          <div className="w-full max-w-2xl mx-auto p-8 text-center text-sm text-ink-muted">
            Memuat form pendaftaran...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}
