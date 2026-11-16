import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'LepasIn — Jual Beli Preloved Mahasiswa Se-Indonesia',
  description: 'Lepas barang kostmu ke sesama mahasiswa sekampus di seluruh kampus Indonesia.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink pb-24 md:pb-0">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
