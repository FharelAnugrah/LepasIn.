import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Hanya akun pembeli yang dapat menambahkan produk ke keranjang' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productId = Number(body.product_id);
    const quantity = Math.max(1, Number(body.quantity) || 1);

    if (!productId) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    // Cek stok produk
    const productRes = await query(
      `SELECT p.id, p.name, p.stock, s.user_id AS seller_user_id
       FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.id = $1`,
      [productId]
    );

    if (productRes.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const product = productRes.rows[0];

    // Cek apakah pembeli mencoba membeli barang tokonya sendiri (jika ada)
    if (product.seller_user_id === user.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat membeli produk dari toko Anda sendiri' },
        { status: 400 }
      );
    }

    if (product.stock <= 0) {
      return NextResponse.json(
        { error: 'Stok produk sudah habis' },
        { status: 400 }
      );
    }

    // Cek jumlah saat ini di keranjang
    const cartRes = await query(
      `SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [user.id, productId]
    );

    let newQuantity = quantity;
    if (cartRes.rows.length > 0) {
      newQuantity = cartRes.rows[0].quantity + quantity;
    }

    if (newQuantity > product.stock) {
      return NextResponse.json(
        {
          error: `Jumlah melebihi stok yang tersedia. Maksimal ${product.stock} item.`,
        },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = $3`,
      [user.id, productId, newQuantity]
    );

    // Ambil total item dan total harga keranjang terbaru
    const cartTotalsRes = await query(
      `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count,
              COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [user.id]
    );

    const updatedCartCount = cartTotalsRes.rows[0]?.count || 0;
    const updatedCartTotal = cartTotalsRes.rows[0]?.total || 0;

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil ditambahkan ke keranjang!',
      quantity: newQuantity,
      cartCount: updatedCartCount,
      cartTotal: updatedCartTotal,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan produk ke keranjang' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    const res = await query(
      `SELECT ci.id, ci.quantity,
              p.id AS product_id, p.name AS product_name, p.price, p.stock, p.condition,
              s.id AS store_id, s.name AS store_name, s.location AS store_location,
              cp.id AS campus_id, cp.short_name AS campus_short_name, cp.city AS campus_city,
              (SELECT pi.url FROM product_images pi
                WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN stores s ON s.id = p.store_id
       JOIN campuses cp ON cp.id = s.campus_id
       WHERE ci.user_id = $1
       ORDER BY s.id, ci.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ items: res.rows });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Gagal memuat keranjang' }, { status: 500 });
  }
}
