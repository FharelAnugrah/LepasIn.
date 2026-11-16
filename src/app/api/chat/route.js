import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sendMessageSchema = z.object({
  order_id: z.coerce.number().positive().optional().nullable(),
  store_id: z.coerce.number().positive().optional().nullable(),
  product_id: z.coerce.number().positive().optional().nullable(),
  recipient_id: z.coerce.number().positive().optional().nullable(),
  message: z.string().trim().min(1, 'Pesan tidak boleh kosong').max(1000, 'Pesan maksimal 1000 karakter'),
});

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get('order_id');
    const storeIdParam = searchParams.get('store_id');

    // 1. Jika chat terkait Pesanan Spesifik (order_id)
    if (orderIdParam) {
      const orderId = Number(orderIdParam);
      if (!orderId) {
        return NextResponse.json({ error: 'ID pesanan tidak valid' }, { status: 400 });
      }

      // Ambil detail order beserta seller dan buyer
      const orderRes = await query(
        `SELECT o.id, o.order_code, o.buyer_id, o.store_id, o.store_name, o.buyer_name,
                o.status, o.delivery_method, o.shipping_recipient, o.shipping_phone,
                o.shipping_address, o.note, o.total_amount, o.created_at,
                s.user_id AS seller_user_id,
                s.name AS store_display_name,
                s.location AS store_location,
                c.name AS campus_name,
                c.short_name AS campus_short_name,
                bu.name AS buyer_full_name,
                su.name AS seller_full_name
         FROM orders o
         LEFT JOIN stores s ON s.id = o.store_id
         LEFT JOIN campuses c ON c.id = s.campus_id
         LEFT JOIN users bu ON bu.id = o.buyer_id
         LEFT JOIN users su ON su.id = s.user_id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
      }

      const order = orderRes.rows[0];
      const isBuyer = order.buyer_id === user.id;
      const isSeller = order.seller_user_id === user.id || (user.store_id && user.store_id === order.store_id);

      if (!isBuyer && !isSeller) {
        return NextResponse.json({ error: 'Anda tidak memiliki akses ke percakapan pesanan ini' }, { status: 403 });
      }

      // Ambil item produk dalam pesanan
      const itemsRes = await query(
        `SELECT id, product_id, product_name, product_image_url, unit_price, quantity, subtotal
         FROM order_items
         WHERE order_id = $1
         ORDER BY id ASC`,
        [orderId]
      );

      // Ambil histori pesan chat pesanan
      const messagesRes = await query(
        `SELECT c.id, c.order_id, c.store_id, c.product_id, c.sender_id, c.receiver_id, c.message, c.created_at,
                u.name AS sender_name, u.role AS sender_role
         FROM chats c
         JOIN users u ON u.id = c.sender_id
         WHERE c.order_id = $1
         ORDER BY c.created_at ASC`,
        [orderId]
      );

      return NextResponse.json({
        type: 'order',
        order,
        items: itemsRes.rows,
        messages: messagesRes.rows,
        currentUser: {
          id: user.id,
          name: user.name,
          role: user.role,
          isBuyer,
        },
        partner: isBuyer
          ? {
              id: order.seller_user_id,
              name: order.store_display_name || order.store_name || order.seller_full_name || 'Penjual',
              role: 'seller',
            }
          : {
              id: order.buyer_id,
              name: order.buyer_name || order.buyer_full_name || 'Pembeli',
              role: 'buyer',
            },
      });
    }

    // 2. Jika chat Pra-Order / Tanya Produk langsung ke Toko (store_id)
    if (storeIdParam) {
      const storeId = Number(storeIdParam);
      if (!storeId) {
        return NextResponse.json({ error: 'ID toko tidak valid' }, { status: 400 });
      }

      const productIdParam = searchParams.get('product_id');
      const productId = productIdParam ? Number(productIdParam) : null;
      const buyerIdParam = searchParams.get('buyer_id');
      let buyerId = buyerIdParam ? Number(buyerIdParam) : null;

      // Ambil detail toko & penjual
      const storeRes = await query(
        `SELECT s.id, s.name AS store_display_name, s.location AS store_location, s.user_id AS seller_user_id,
                c.name AS campus_name, c.short_name AS campus_short_name,
                u.name AS seller_full_name
         FROM stores s
         LEFT JOIN campuses c ON c.id = s.campus_id
         LEFT JOIN users u ON u.id = s.user_id
         WHERE s.id = $1`,
        [storeId]
      );

      if (storeRes.rows.length === 0) {
        return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
      }

      const store = storeRes.rows[0];
      const isSeller = user.id === store.seller_user_id || (user.store_id && user.store_id === store.id);
      const isBuyer = !isSeller;

      if (isBuyer) {
        buyerId = user.id;
      } else if (!buyerId) {
        // Jika penjual membuka inquiry toko tanpa buyer_id, ambil pembeli terakhir yang mengobrol
        const lastInquiryRes = await query(
          `SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id
           FROM chats
           WHERE store_id = $2 AND order_id IS NULL AND (sender_id = $1 OR receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1`,
          [user.id, storeId]
        );
        if (lastInquiryRes.rows.length > 0) {
          buyerId = lastInquiryRes.rows[0].other_user_id;
        }
      }

      // Ambil data produk jika ada konteks produk
      let product = null;
      if (productId) {
        const prodRes = await query(
          `SELECT p.id, p.name, p.price, p.stock, p.condition,
                  (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
           FROM products p
           WHERE p.id = $1 AND p.store_id = $2`,
          [productId, storeId]
        );
        if (prodRes.rows.length > 0) {
          product = prodRes.rows[0];
        }
      }

      let partnerName = store.store_display_name || store.seller_full_name || 'Toko';
      if (isSeller) {
        if (buyerId) {
          const buyerRes = await query(`SELECT name FROM users WHERE id = $1`, [buyerId]);
          if (buyerRes.rows.length > 0) {
            partnerName = buyerRes.rows[0].name;
          }
        } else {
          partnerName = 'Belum ada pembeli';
        }
      }

      // Ambil histori pesan tanya produk
      let messages = [];
      if (buyerId) {
        const msgRes = await query(
          `SELECT c.id, c.order_id, c.store_id, c.product_id, c.sender_id, c.receiver_id, c.message, c.created_at,
                  u.name AS sender_name, u.role AS sender_role
           FROM chats c
           JOIN users u ON u.id = c.sender_id
           WHERE c.order_id IS NULL AND c.store_id = $1
             AND ((c.sender_id = $2 AND c.receiver_id = $3) OR (c.sender_id = $3 AND c.receiver_id = $2))
           ORDER BY c.created_at ASC`,
          [storeId, buyerId, store.seller_user_id]
        );
        messages = msgRes.rows;

        // Jika produk tidak dipassing di URL tapi ada pada riwayat chat sebelumnya, gunakan produk tersebut
        if (!product && messages.length > 0) {
          const foundProdMsg = messages.slice().reverse().find((m) => m.product_id);
          if (foundProdMsg) {
            const pRes = await query(
              `SELECT p.id, p.name, p.price, p.stock, p.condition,
                      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
               FROM products p
               WHERE p.id = $1`,
              [foundProdMsg.product_id]
            );
            if (pRes.rows.length > 0) {
              product = pRes.rows[0];
            }
          }
        }
      }

      return NextResponse.json({
        type: 'inquiry',
        store,
        product,
        messages,
        currentUser: {
          id: user.id,
          name: user.name,
          role: user.role,
          isBuyer,
        },
        partner: isBuyer
          ? {
              id: store.seller_user_id,
              name: store.store_display_name || store.seller_full_name || 'Penjual',
              role: 'seller',
            }
          : {
              id: buyerId || null,
              name: partnerName,
              role: 'buyer',
            },
      });
    }

    // 3. Jika tidak ada order_id atau store_id, ambil daftar seluruh percakapan aktif (Pesanan + Tanya Produk)
    const convSql = `
      SELECT * FROM (
        SELECT o.id AS order_id, o.order_code, o.status, o.delivery_method, o.total_amount, o.created_at,
               o.buyer_name, o.store_name, o.store_id, o.buyer_id,
               c.short_name AS campus_short_name,
               NULL::int AS product_id, NULL::text AS product_name, NULL::text AS product_image_url,
               (SELECT ch.message FROM chats ch WHERE ch.order_id = o.id ORDER BY ch.created_at DESC LIMIT 1) AS last_message,
               (SELECT ch.created_at FROM chats ch WHERE ch.order_id = o.id ORDER BY ch.created_at DESC LIMIT 1) AS last_message_time,
               (SELECT COUNT(ch.id)::int FROM chats ch WHERE ch.order_id = o.id) AS message_count
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        LEFT JOIN campuses c ON c.id = s.campus_id
        WHERE o.buyer_id = $1 OR s.user_id = $1

        UNION ALL

        SELECT NULL::int AS order_id, NULL::varchar AS order_code, 'inquiry'::varchar AS status, 'inquiry'::varchar AS delivery_method, NULL::int AS total_amount,
               MAX(ch.created_at) AS created_at,
               COALESCE(bu.name, 'Pembeli') AS buyer_name,
               s.name AS store_name, s.id AS store_id, bu.id AS buyer_id,
               cp.short_name AS campus_short_name,
               (SELECT ch_p.product_id FROM chats ch_p WHERE ch_p.store_id = s.id AND ch_p.order_id IS NULL AND ((ch_p.sender_id = bu.id AND ch_p.receiver_id = s.user_id) OR (ch_p.sender_id = s.user_id AND ch_p.receiver_id = bu.id)) AND ch_p.product_id IS NOT NULL ORDER BY ch_p.created_at DESC LIMIT 1) AS product_id,
               (SELECT p.name FROM products p WHERE p.id = (SELECT ch_p.product_id FROM chats ch_p WHERE ch_p.store_id = s.id AND ch_p.order_id IS NULL AND ((ch_p.sender_id = bu.id AND ch_p.receiver_id = s.user_id) OR (ch_p.sender_id = s.user_id AND ch_p.receiver_id = bu.id)) AND ch_p.product_id IS NOT NULL ORDER BY ch_p.created_at DESC LIMIT 1)) AS product_name,
               (SELECT pi.url FROM product_images pi WHERE pi.product_id = (SELECT ch_p.product_id FROM chats ch_p WHERE ch_p.store_id = s.id AND ch_p.order_id IS NULL AND ((ch_p.sender_id = bu.id AND ch_p.receiver_id = s.user_id) OR (ch_p.sender_id = s.user_id AND ch_p.receiver_id = bu.id)) AND ch_p.product_id IS NOT NULL ORDER BY ch_p.created_at DESC LIMIT 1) ORDER BY pi.position LIMIT 1) AS product_image_url,
               (SELECT ch2.message FROM chats ch2 WHERE ch2.store_id = s.id AND ch2.order_id IS NULL AND ((ch2.sender_id = bu.id AND ch2.receiver_id = s.user_id) OR (ch2.sender_id = s.user_id AND ch2.receiver_id = bu.id)) ORDER BY ch2.created_at DESC LIMIT 1) AS last_message,
               MAX(ch.created_at) AS last_message_time,
               COUNT(ch.id)::int AS message_count
        FROM chats ch
        LEFT JOIN stores s ON s.id = ch.store_id
        LEFT JOIN campuses cp ON cp.id = s.campus_id
        LEFT JOIN users bu ON bu.id = (CASE WHEN ch.sender_id = s.user_id THEN ch.receiver_id ELSE ch.sender_id END)
        WHERE ch.order_id IS NULL AND (ch.sender_id = $1 OR ch.receiver_id = $1)
        GROUP BY s.id, s.name, s.user_id, cp.short_name, bu.id, bu.name
      ) combined
      ORDER BY COALESCE(last_message_time, created_at) DESC
      LIMIT 30
    `;

    const convRes = await query(convSql, [user.id]);

    return NextResponse.json({
      conversations: convRes.rows,
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memuat chat' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0]?.message || 'Data pesan tidak valid' }, { status: 400 });
    }

    const { order_id, store_id, product_id, recipient_id, message } = validated.data;

    // 1. Jika pengiriman pesan terkait Pesanan (order_id)
    if (order_id) {
      const orderRes = await query(
        `SELECT o.id, o.buyer_id, o.store_id, s.user_id AS seller_user_id
         FROM orders o
         LEFT JOIN stores s ON s.id = o.store_id
         WHERE o.id = $1`,
        [order_id]
      );

      if (orderRes.rows.length === 0) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
      }

      const order = orderRes.rows[0];
      const isBuyer = order.buyer_id === user.id;
      const isSeller = order.seller_user_id === user.id || (user.store_id && user.store_id === order.store_id);

      if (!isBuyer && !isSeller) {
        return NextResponse.json({ error: 'Anda tidak berhak mengirim pesan pada pesanan ini' }, { status: 403 });
      }

      const receiverId = isBuyer ? order.seller_user_id : order.buyer_id;
      if (!receiverId) {
        return NextResponse.json({ error: 'Penerima pesan tidak ditemukan' }, { status: 400 });
      }

      const insertRes = await query(
        `INSERT INTO chats (order_id, store_id, sender_id, receiver_id, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, order_id, store_id, product_id, sender_id, receiver_id, message, created_at`,
        [order_id, order.store_id, user.id, receiverId, message]
      );

      const inserted = insertRes.rows[0];

      return NextResponse.json({
        success: true,
        message: {
          ...inserted,
          sender_name: user.name,
          sender_role: user.role,
        },
      });
    }

    // 2. Jika pengiriman pesan Pra-Order / Tanya Produk (store_id)
    if (store_id) {
      const storeRes = await query(
        `SELECT s.id, s.user_id AS seller_user_id
         FROM stores s
         WHERE s.id = $1`,
        [store_id]
      );

      if (storeRes.rows.length === 0) {
        return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
      }

      const store = storeRes.rows[0];
      const isSeller = user.id === store.seller_user_id || (user.store_id && user.store_id === store.id);

      let receiverId = null;
      if (isSeller) {
        if (!recipient_id) {
          // Fallback jika penjual belum memiliki recipient_id spesifik: ambil pembeli terakhir
          const lastInquiryRes = await query(
            `SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id
             FROM chats
             WHERE store_id = $2 AND order_id IS NULL AND (sender_id = $1 OR receiver_id = $1)
             ORDER BY created_at DESC LIMIT 1`,
            [user.id, store_id]
          );
          if (lastInquiryRes.rows.length > 0) {
            receiverId = lastInquiryRes.rows[0].other_user_id;
          } else {
            return NextResponse.json({ error: 'Belum ada pembeli yang memulai percakapan di lapak ini' }, { status: 400 });
          }
        } else {
          receiverId = recipient_id;
        }
      } else {
        receiverId = store.seller_user_id;
      }

      if (!receiverId || receiverId === user.id) {
        return NextResponse.json({ error: 'Penerima pesan tidak valid' }, { status: 400 });
      }

      const insertRes = await query(
        `INSERT INTO chats (order_id, store_id, product_id, sender_id, receiver_id, message)
         VALUES (NULL, $1, $2, $3, $4, $5)
         RETURNING id, order_id, store_id, product_id, sender_id, receiver_id, message, created_at`,
        [store_id, product_id || null, user.id, receiverId, message]
      );

      const inserted = insertRes.rows[0];

      return NextResponse.json({
        success: true,
        message: {
          ...inserted,
          sender_name: user.name,
          sender_role: user.role,
        },
      });
    }

    return NextResponse.json({ error: 'ID pesanan atau ID toko harus disertakan' }, { status: 400 });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
  }
}
