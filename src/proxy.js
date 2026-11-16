import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

/**
 * Next.js 16 Proxy (pengganti middleware.js)
 * Menangani pengalihan optimistik berbasis peran dan proteksi rute
 */
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  const isLoggedIn = !!session;
  const role = session?.role;
  const sellerStatus = session?.sellerStatus || session?.seller_status;

  // 1. Rute Khusus Tamu (Login & Register)
  if (pathname === '/login' || pathname === '/register') {
    if (isLoggedIn) {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (role === 'seller') {
        return NextResponse.redirect(new URL('/seller', request.url));
      }
      const nextParam = request.nextUrl.searchParams.get('next');
      if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
        return NextResponse.redirect(new URL(nextParam, request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Helper untuk redirect login dengan parameter next
  const redirectToLogin = () => {
    const nextUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${nextUrl}`, request.url));
  };

  // 2. Proteksi Rute Buyer (/buyer/*)
  if (pathname.startsWith('/buyer')) {
    if (!isLoggedIn) {
      return redirectToLogin();
    }
    if (role !== 'buyer') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'seller') {
        return NextResponse.redirect(new URL('/seller', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Proteksi Rute Seller (/seller/*)
  if (pathname.startsWith('/seller')) {
    if (!isLoggedIn) {
      return redirectToLogin();
    }
    if (role !== 'seller') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Validasi seller_status ditangani oleh Server Component (requireApprovedSeller)
    // agar selalu sinkron dengan database dan tidak menimbulkan redirect loop jika status baru disetujui/diubah admin
    return NextResponse.next();
  }

  // 4. Halaman Pending Seller (/pending-seller)
  if (pathname === '/pending-seller') {
    if (!isLoggedIn) {
      return redirectToLogin();
    }
    if (role !== 'seller') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Validasi seller_status ditangani oleh Server Component (PendingSellerPage) dari database langsung
    return NextResponse.next();
  }

  // 5. Proteksi Rute Admin (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return redirectToLogin();
    }
    if (role !== 'admin') {
      if (role === 'seller') {
        return NextResponse.redirect(new URL('/seller', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Jalankan proxy untuk semua rute kecuali aset statis dan API uploads
     */
    '/((?!_next/static|_next/image|favicon.ico|api/uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
