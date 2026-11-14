import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Masuk — LepasIn',
  description: 'Masuk ke akun LepasIn untuk jual beli barang preloved kampus.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-canvas flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 text-center text-sm text-ink-soft">
            Memuat form login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
