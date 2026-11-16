import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTransaction, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const orderItemSchema = z.object({
  cart_item_id: z.coerce.number().int().positive().optional(),
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

const storeOrderSchema = z.object({
  store_id: z.coerce.number().int().positive(),
  delivery_method: z.enum(['meetup', 'delivery']),
  shipping_recipient: z.string().trim().optional().nullable(),
  shipping_phone: z.string().trim().optional().nullable(),
  shipping_address: z.string().trim().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Minimal satu barang per toko'),
}).refine((data) => {
  if (data.delivery_method === 'delivery') {
    return (
      data.shipping_recipient &&
      data.shipping_recipient.length > 0 &&
      data.shipping_phone &&
      data.shipping_phone.length > 0 &&
      data.shipping_address &&
      data.shipping_address.length > 0
    );
  }
  return true;
}, {
  message: 'Data penerima, no. HP, dan alamat wajib diisi untuk pengiriman ke kost',
  path: ['shipping_address'],
});

const checkoutSchema = z.object({
  orders: z.array(storeOrderSchema).min(1, 'Minimal satu pesanan'),
});

function generateOrderCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LP-${dateStr}-${rand}`;
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Akses ditolak, silakan login sebagai pembeli' }, { status: 403 });
    }

    const body = await request.json();
    const validated = checkoutSchema.safeParse(body);

    if (!validated.success) {
      const err = validated.error.flatten();
      return NextResponse.json({ error: 'Data formulir tidak valid', details: err }, { status: 400 });
    }

    const { orders: storeOrders } = validated.data;
    const createdOrders = [];

    await withTransaction(async (client) => {
      for (const orderData of storeOrders) {
        // Ambil nama toko
        const storeRes = await client.query('SELECT id, name FROM stores WHERE id = $1', [orderData.store_id]);
        if (storeRes.rows.length === 0) {
          throw new Error(`Toko dengan ID ${orderData.store_id} tidak ditemukan`);
        }
        const storeName = storeRes.rows[0].name;

        let totalAmount = 0;
        const verifiedItems = [];

        // Validasi stok dan kunci baris produk (FOR UPDATE)
        for (const it of orderData.items) {
          const prodRes = await client.query(
            `SELECT p.id, p.name, p.price, p.stock,
                    (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
             FROM products p
             WHERE p.id = $1 AND p.store_id = $2
             FOR UPDATE`,
            [it.product_id, orderData.store_id]
          );

          if (prodRes.rows.length === 0) {
            throw new Error(`Produk dengan ID ${it.product_id} tidak ditemukan di toko ini`);
          }

          const product = prodRes.rows[0];

          if (product.stock < it.quantity) {
            throw new Error(`Stok "${product.name}" tidak mencukupi (sisa ${product.stock}, diminta ${it.quantity})`);
          }

          // Kurangi stok
          await client.query(
            `UPDATE products SET stock = stock - $1 WHERE id = $2`,
            [it.quantity, it.product_id]
          );

          const subtotal = product.price * it.quantity;
          totalAmount += subtotal;

          verifiedItems.push({
            product_id: product.id,
            product_name: product.name,
            product_image_url: product.image_url || null,
            unit_price: product.price,
            quantity: it.quantity,
          });
        }

        const orderCode = generateOrderCode();

        // Pesanan kirim ke kost langsung terbayar (status: processing) saat checkout (Bayar Sekarang),
        // sedangkan pesanan COD berstatus pending_payment menunggu ketemuan di kampus.
        const initialStatus = orderData.delivery_method === 'delivery' ? 'processing' : 'pending_payment';

        // Insert pesanan ke tabel orders
        const insertOrderRes = await client.query(
          `INSERT INTO orders (
            order_code, buyer_id, store_id, buyer_name, store_name,
            status, delivery_method, shipping_recipient, shipping_phone, shipping_address,
            note, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, order_code, delivery_method, status`,
          [
            orderCode,
            user.id,
            orderData.store_id,
            user.name,
            storeName,
            initialStatus,
            orderData.delivery_method,
            orderData.delivery_method === 'delivery' ? orderData.shipping_recipient : null,
            orderData.delivery_method === 'delivery' ? orderData.shipping_phone : null,
            orderData.delivery_method === 'delivery' ? orderData.shipping_address : null,
            orderData.note || null,
            totalAmount,
          ]
        );

        const newOrder = insertOrderRes.rows[0];
        createdOrders.push(newOrder);

        // Insert order_items
        for (const vi of verifiedItems) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, product_image_url, unit_price, quantity
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              newOrder.id,
              vi.product_id,
              vi.product_name,
              vi.product_image_url,
              vi.unit_price,
              vi.quantity,
            ]
          );
        }

        // Hapus item dari cart_items buyer
        const cartItemIds = orderData.items
          .map((i) => i.cart_item_id)
          .filter(Boolean);

        if (cartItemIds.length > 0) {
          await client.query(
            `DELETE FROM cart_items WHERE user_id = $1 AND id = ANY($2::int[])`,
            [user.id, cartItemIds]
          );
        } else {
          // Jika cart_item_id tidak disertakan, hapus berdasarkan product_id
          const prodIds = orderData.items.map((i) => i.product_id);
          await client.query(
            `DELETE FROM cart_items WHERE user_id = $1 AND product_id = ANY($2::int[])`,
            [user.id, prodIds]
          );
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      orders: createdOrders,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses pesanan' },
      { status: 400 }
    );
  }
}
