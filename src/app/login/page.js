import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Masuk | LepasIn',
  description: 'Masuk ke akun LepasIn untuk jual beli barang preloved kampus.',
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-canvas flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 outline-none"
    >
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 text-center text-sm text-ink-muted">
            Memuat form masuk...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
