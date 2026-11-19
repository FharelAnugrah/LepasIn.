import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'LepasIn | Marketplace Barang Kost Mahasiswa Se-Indonesia',
  description: 'Lepas barang kostmu ke sesama Mahasiswa sekampus di seluruh perguruan tinggi Indonesia.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <a href="#main-content" className="skip-link">
          Lewati ke konten utama
        </a>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
