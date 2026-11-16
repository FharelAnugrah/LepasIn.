'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Store,
  User as UserIcon,
  MapPin,
  Package,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import Badge, {
  PricePill,
  ConditionBadge,
  OrderStatusBadge,
  formatRupiah,
} from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ChatClient({
  user,
  initialOrderId = null,
  initialStoreId = null,
  initialProductId = null,
}) {
  const router = useRouter();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeTarget, setActiveTarget] = useState(() => {
    if (initialOrderId) {
      return { type: 'order', orderId: initialOrderId };
    }
    if (initialStoreId) {
      return {
        type: 'inquiry',
        storeId: initialStoreId,
        productId: initialProductId || null,
        buyerId: null,
      };
    }
    return null;
  });

  const [activeChat, setActiveChat] = useState(null); // { type, order/store, product, items, messages, partner, currentUser }
  const [messageText, setMessageText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll otomatis ke bawah chat
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Bangun URL endpoint API untuk target percakapan aktif
  const getChatQueryUrl = useCallback((target) => {
    if (!target) return null;
    if (target.type === 'order' && target.orderId) {
      return `/api/chat?order_id=${target.orderId}`;
    }
    if (target.type === 'inquiry' && target.storeId) {
      let url = `/api/chat?store_id=${target.storeId}`;
      if (target.productId) url += `&product_id=${target.productId}`;
      if (target.buyerId) url += `&buyer_id=${target.buyerId}`;
      return url;
    }
    return null;
  }, []);

  // Muat daftar percakapan
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Polling chat aktif secara silent untuk pembaruan realtime
  const pollActiveChat = useCallback(
    async (target) => {
      const url = getChatQueryUrl(target);
      if (!url) return;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setActiveChat((prev) => {
            const prevLen = prev?.messages?.length || 0;
            const nextLen = data.messages?.length || 0;
            if (nextLen > prevLen) {
              setTimeout(() => scrollToBottom('smooth'), 100);
            }
            return data;
          });
        }
      } catch (err) {
        console.error('Poll active chat error:', err);
      }
    },
    [getChatQueryUrl]
  );

  // Sinkronisasi target saat prop navigasi luar berubah tanpa cascading render
  const [prevNavParams, setPrevNavParams] = useState({
    orderId: initialOrderId,
    storeId: initialStoreId,
    productId: initialProductId,
  });

  if (
    initialOrderId !== prevNavParams.orderId ||
    initialStoreId !== prevNavParams.storeId ||
    initialProductId !== prevNavParams.productId
  ) {
    setPrevNavParams({
      orderId: initialOrderId,
      storeId: initialStoreId,
      productId: initialProductId,
    });
    if (initialOrderId) {
      setActiveTarget({ type: 'order', orderId: initialOrderId });
    } else if (initialStoreId) {
      setActiveTarget({
        type: 'inquiry',
        storeId: initialStoreId,
        productId: initialProductId || null,
        buyerId: null,
      });
    }
  }

  // Inisialisasi awal daftar percakapan
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            const list = data.conversations || [];
            setConversations(list);

            // Jika belum ada activeTarget awal dan terdapat percakapan, pilih percakapan pertama
            setActiveTarget((curr) => {
              if (curr) return curr;
              if (list.length > 0) {
                const first = list[0];
                if (first.order_id) {
                  return { type: 'order', orderId: first.order_id };
                }
                return {
                  type: 'inquiry',
                  storeId: first.store_id,
                  productId: first.product_id || null,
                  buyerId: first.buyer_id || null,
                };
              }
              return null;
            });
          }
        }
      } catch (err) {
        console.error('Init conversations error:', err);
      } finally {
        if (!ignore) {
          setLoadingList(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Muat data ruang chat saat activeTarget berganti
  useEffect(() => {
    const url = getChatQueryUrl(activeTarget);
    if (!url) return;

    let ignore = false;
    const startTimer = setTimeout(() => {
      if (!ignore) setLoadingChat(true);
    }, 0);

    async function loadChat() {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setActiveChat(data);
            setTimeout(() => scrollToBottom('auto'), 150);
          }
        }
      } catch (err) {
        console.error('Load chat error:', err);
      } finally {
        if (!ignore) {
          setLoadingChat(false);
        }
      }
    }

    loadChat();

    return () => {
      ignore = true;
      clearTimeout(startTimer);
    };
  }, [activeTarget, getChatQueryUrl]);

  // Polling chat aktif setiap 3.5 detik untuk pembaruan realtime
  useEffect(() => {
    if (!activeTarget) return;
    const interval = setInterval(() => {
      pollActiveChat(activeTarget);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTarget, pollActiveChat]);

  // Kirim pesan baru
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !activeTarget || sending) return;

    // Cegah seller mengirim pesan tanpa pembeli di inquiry
    if (activeTarget.type === 'inquiry' && !activeChat?.currentUser?.isBuyer && !activeChat?.partner?.id) {
      toast.error('Belum ada pembeli yang menghubungi toko ini untuk dibalas.');
      return;
    }

    setSending(true);
    setMessageText('');

    try {
      const payload = { message: trimmed };
      if (activeTarget.type === 'order') {
        payload.order_id = activeTarget.orderId;
      } else {
        payload.store_id = activeTarget.storeId;
        payload.product_id = activeChat?.product?.id || activeTarget.productId || null;
        if (activeChat?.partner?.id) {
          payload.recipient_id = activeChat.partner.id;
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengirim pesan');
        setMessageText(trimmed); // kembalikan teks jika gagal
        setSending(false);
        return;
      }

      // Tambahkan pesan secara instan ke state obrolan
      if (data.message) {
        setActiveChat((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), data.message],
        }));
        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      // Perbarui daftar percakapan di bilah kiri
      fetchConversations();
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Terjadi gangguan jaringan');
      setMessageText(trimmed);
    } finally {
      setSending(false);
    }
  };

  // Pilih percakapan dari daftar samping
  const handleSelectConversation = (conv) => {
    if (conv.order_id) {
      if (activeTarget?.type !== 'order' || activeTarget?.orderId !== conv.order_id) {
        setLoadingChat(true);
        setActiveTarget({ type: 'order', orderId: conv.order_id });
        router.replace(`/chat?order_id=${conv.order_id}`, { scroll: false });
      }
    } else {
      const isSame =
        activeTarget?.type === 'inquiry' &&
        activeTarget?.storeId === conv.store_id &&
        activeTarget?.buyerId === conv.buyer_id;

      if (!isSame) {
        setLoadingChat(true);
        setActiveTarget({
          type: 'inquiry',
          storeId: conv.store_id,
          productId: conv.product_id || null,
          buyerId: conv.buyer_id || null,
        });

        const isOwnerOfStore = user.store_id && user.store_id === conv.store_id;
        const url = `/chat?store_id=${conv.store_id}${
          conv.product_id ? `&product_id=${conv.product_id}` : ''
        }${conv.buyer_id && isOwnerOfStore ? `&buyer_id=${conv.buyer_id}` : ''}`;
        router.replace(url, { scroll: false });
      }
    }
  };

  // Kirim teks cepat (quick reply)
  const handleSendQuickReply = (text) => {
    setMessageText(text);
  };

  // Bangun daftar percakapan yang ditampilkan (termasuk percakapan baru yang belum tersimpan di DB)
  const displayConversations = [...conversations];
  if (activeTarget?.type === 'inquiry') {
    const alreadyExists = conversations.some(
      (c) =>
        !c.order_id &&
        c.store_id === activeTarget.storeId &&
        (!activeTarget.buyerId || c.buyer_id === activeTarget.buyerId)
    );

    if (!alreadyExists && activeChat?.store) {
      const isOwner = user.store_id && user.store_id === activeChat.store.id;
      displayConversations.unshift({
        order_id: null,
        order_code: null,
        status: 'inquiry',
        delivery_method: 'inquiry',
        store_id: activeChat.store.id,
        buyer_id: isOwner
          ? activeChat.partner?.role === 'buyer'
            ? activeChat.partner.id
            : null
          : user.id,
        store_name: activeChat.store.store_display_name,
        buyer_name: isOwner
          ? activeChat.partner?.role === 'buyer'
            ? activeChat.partner.name
            : 'Belum ada pembeli'
          : user.name,
        campus_short_name: activeChat.store.campus_short_name,
        product_id: activeChat.product?.id || activeTarget.productId || null,
        product_name: activeChat.product?.name || null,
        product_image_url: activeChat.product?.image_url || null,
        last_message:
          activeChat.messages?.length > 0
            ? activeChat.messages[activeChat.messages.length - 1].message
            : 'Mulai obrolan di sini...',
        last_message_time:
          activeChat.messages?.length > 0
            ? activeChat.messages[activeChat.messages.length - 1].created_at
            : null,
        message_count: activeChat.messages?.length || 0,
      });
    }
  }

  // Filter daftar percakapan berdasarkan nama toko, pembeli, produk, atau kode
  const filteredConversations = displayConversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.order_code?.toLowerCase().includes(q) ||
      c.store_name?.toLowerCase().includes(q) ||
      c.buyer_name?.toLowerCase().includes(q) ||
      c.product_name?.toLowerCase().includes(q) ||
      c.campus_short_name?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  });

  // Template Pesan Cepat: adaptif antara Tanya Produk Pra-Order & Koordinasi Pesanan
  const getObjectiveQuickReplies = () => {
    if (!activeChat) return [];

    // Jika seller berada di inquiry tanpa ada pembeli, jangan tampilkan saran pesan cepat
    if (!activeChat.currentUser?.isBuyer && !activeChat.partner?.id) {
      return [];
    }

    // Jika ini adalah Tanya Produk (Pra-Order)
    if (activeChat.type === 'inquiry' || activeChat.product) {
      const isBuyer = activeChat.currentUser?.isBuyer;
      if (isBuyer) {
        return [
          'Halo kak, barang ini masih tersedia?',
          'Bisa nego tipis kak?',
          'Bisa COD di sekitar kampus?',
          'Apakah barang ada minus/cacat?',
        ];
      } else {
        return [
          'Halo kak, barangnya masih ada ya!',
          'Harga sudah pas/nett ya kak',
          'Bisa COD di sekitar kampus ya',
          'Kondisi barang sesuai deskripsi',
        ];
      }
    }

    // Jika ini adalah Percakapan Pesanan yang sudah dibuat
    if (!activeChat.order) return [];
    const isMeetup = activeChat.order.delivery_method === 'meetup';
    const isBuyer = activeChat.currentUser?.isBuyer;
    const campus = activeChat.order.campus_short_name;

    if (isMeetup) {
      if (isBuyer) {
        return [
          'Siap COD hari ini?',
          campus ? `Ketemuan di Perpustakaan (${campus})?` : 'Ketemuan di Perpustakaan Pusat?',
          campus ? `Ketemuan di Gerbang Utama (${campus})?` : 'Ketemuan di Pintu Gerbang Utama?',
          'Saya sudah di titik temu COD',
        ];
      } else {
        return [
          'Barang siap untuk COD hari ini',
          'Bisa ketemuan jam berapa?',
          campus ? `Standby di Perpustakaan (${campus})` : 'Standby di Perpustakaan Pusat',
          'Saya sudah di titik temu COD',
        ];
      }
    } else {
      if (isBuyer) {
        return [
          'Kapan paket dikirim ke kost?',
          'Sudah lunas saat checkout ya kak',
          'Apakah ada info kurir/resi?',
          'Paket sudah tiba, terima kasih',
        ];
      } else {
        return [
          'Pesanan sedang disiapkan',
          'Paket segera dikirim ke kost',
          'Paket sudah diserahkan ke kurir',
          'Mohon konfirmasi jika barang tiba',
        ];
      }
    }
  };

  return (
    <div className="w-full h-[calc(100dvh-80px)] md:h-[calc(100vh-88px)] min-h-[560px] bg-canvas border border-line rounded-2xl shadow-card flex flex-col md:flex-row overflow-hidden">
      {/* Kolom Kiri: Daftar Percakapan (Pesanan + Tanya Produk) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-line bg-surface/40 h-full overflow-hidden ${
          activeTarget ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header List */}
        <div className="p-4 border-b border-line bg-canvas shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span>Pesan & Chat</span>
            </h2>
            <span className="text-[11px] font-semibold bg-primary-50 text-primary px-2 py-0.5 rounded-full">
              {displayConversations.length} Percakapan
            </span>
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Cari toko, barang, atau pembeli..."
            className="w-full text-xs px-3 py-2 bg-surface rounded-xl border border-line focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* List Percakapan */}
        <div className="flex-1 overflow-y-auto divide-y divide-line/40">
          {loadingList ? (
            <div className="p-8 text-center text-xs text-ink-soft">Memuat percakapan...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-soft flex flex-col items-center gap-2">
              <MessageCircle className="w-8 h-8 text-ink-soft/40" />
              <span>Tidak ada percakapan ditemukan</span>
            </div>
          ) : (
            filteredConversations.map((c, idx) => {
              const isOrder = Boolean(c.order_id);
              const isSelected = isOrder
                ? activeTarget?.type === 'order' && activeTarget?.orderId === c.order_id
                : activeTarget?.type === 'inquiry' &&
                  activeTarget?.storeId === c.store_id &&
                  (!activeTarget.buyerId || activeTarget.buyerId === c.buyer_id);

              // Tentukan apakah user bertindak sebagai pembeli dalam obrolan spesifik ini:
              // Jika user memiliki store_id dan c.store_id sama dengan user.store_id, maka user adalah penjual.
              // Jika bukan, atau jika c.buyer_id === user.id, maka user bertindak sebagai pembeli.
              const isUserTheBuyer =
                user.store_id && user.store_id === c.store_id ? false : c.buyer_id === user.id;

              const partnerName = isUserTheBuyer ? c.store_name : (c.buyer_name || 'Pembeli');
              const key = isOrder
                ? `order-${c.order_id}`
                : `inquiry-${c.store_id}-${c.buyer_id || idx}`;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectConversation(c)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected ? 'bg-primary-50/80 border-l-4 border-primary' : 'hover:bg-surface'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-alt border border-line flex items-center justify-center shrink-0 text-primary font-bold">
                    {isUserTheBuyer ? (
                      <Store className="w-5 h-5 text-primary" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-ink truncate">{partnerName}</span>
                      <span className="text-[10px] text-ink-soft shrink-0">
                        {c.last_message_time
                          ? new Date(c.last_message_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isOrder ? (
                        <>
                          <span className="text-[10px] font-mono font-medium text-ink-soft">
                            #{c.order_code}
                          </span>
                          {c.campus_short_name && (
                            <>
                              <span className="text-line text-[10px]">·</span>
                              <span className="text-[9px] font-semibold text-pine bg-pine-50 px-1.5 py-0.2 rounded-sm">
                                {c.campus_short_name}
                              </span>
                            </>
                          )}
                          <span className="text-line text-[10px]">·</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-sm ${
                              c.delivery_method === 'meetup'
                                ? 'bg-primary-50 text-primary'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.delivery_method === 'meetup' ? 'COD' : 'Kirim'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-primary bg-primary-50 px-1.5 py-0.2 rounded-sm">
                            Tanya Produk
                          </span>
                          {c.product_name && (
                            <>
                              <span className="text-line text-[10px]">·</span>
                              <span className="text-[10px] font-medium text-ink-soft truncate max-w-[120px]">
                                {c.product_name}
                              </span>
                            </>
                          )}
                          {c.campus_short_name && (
                            <>
                              <span className="text-line text-[10px]">·</span>
                              <span className="text-[9px] font-semibold text-pine bg-pine-50 px-1.5 py-0.2 rounded-sm">
                                {c.campus_short_name}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-ink-soft truncate mt-1">
                      {c.last_message || (
                        <span className="italic text-ink-soft/70">Mulai obrolan di sini...</span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Kolom Kanan: Area Ruang Chat Aktif */}
      <div
        className={`flex-1 flex flex-col bg-canvas min-w-0 h-full overflow-hidden ${
          !activeTarget ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}
      >
        {!activeTarget ? (
          <div className="p-8 text-center max-w-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">Pilih Percakapan</h3>
            <p className="text-xs text-ink-soft mb-4">
              Pilih salah satu percakapan di daftar kiri untuk mulai berkoordinasi dengan penjual atau pembeli.
            </p>
          </div>
        ) : loadingChat && !activeChat ? (
          <div className="flex-1 flex items-center justify-center text-xs text-ink-soft">
            Memuat ruang obrolan...
          </div>
        ) : activeChat ? (
          <>
            {/* Top Bar Chat */}
            <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 bg-canvas/90 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Tombol Back pada Tampilan Mobile */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTarget(null);
                    router.replace('/chat', { scroll: false });
                  }}
                  className="md:hidden p-1.5 rounded-lg hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
                  aria-label="Kembali ke daftar pesan"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0 font-bold">
                  {activeChat.currentUser?.isBuyer ? (
                    <Store className="w-4 h-4" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-ink truncate">
                      {activeChat.partner?.name}
                    </h3>
                    <Badge variant="secondary" size="xs" className="shrink-0">
                      {activeChat.partner?.role === 'seller' ? 'Penjual' : 'Pembeli'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-ink-soft mt-0.5">
                    {activeChat.type === 'order' ? (
                      <>
                        <span className="font-mono font-medium">#{activeChat.order?.order_code}</span>
                        {activeChat.order?.campus_short_name && (
                          <>
                            <span className="text-line">·</span>
                            <span className="bg-pine-50 text-pine font-bold text-[10px] px-1.5 py-0.2 rounded-sm">
                              {activeChat.order.campus_short_name}
                            </span>
                          </>
                        )}
                        <span className="text-line">·</span>
                        <OrderStatusBadge
                          status={activeChat.order?.status}
                          deliveryMethod={activeChat.order?.delivery_method}
                          className="text-[10px] py-0 px-1.5"
                        />
                      </>
                    ) : (
                      <>
                        <span className="bg-primary-50 text-primary font-bold text-[10px] px-1.5 py-0.2 rounded-sm">
                          Tanya Produk
                        </span>
                        {activeChat.store?.campus_short_name && (
                          <>
                            <span className="text-line">·</span>
                            <span className="bg-pine-50 text-pine font-bold text-[10px] px-1.5 py-0.2 rounded-sm">
                              {activeChat.store.campus_short_name}
                            </span>
                          </>
                        )}
                        {activeChat.store?.store_location && (
                          <>
                            <span className="text-line">·</span>
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {activeChat.store.store_location}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksi Kanan Top Bar */}
              {activeChat.type === 'order' ? (
                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition cursor-pointer shrink-0"
                >
                  <span>{isOrderSummaryOpen ? 'Tutup Detail' : 'Detail Pesanan'}</span>
                  {isOrderSummaryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : activeChat.store?.id ? (
                <Link
                  href={`/stores/${activeChat.store.id}`}
                  className="text-xs font-semibold text-ink-soft hover:text-primary px-3 py-1.5 rounded-lg hover:bg-surface border border-line transition cursor-pointer shrink-0 inline-flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Kunjungi Toko</span>
                </Link>
              ) : null}
            </div>

            {/* Banner Kartu Konteks Produk (Pra-Order / Tanya Produk) */}
            {activeChat.type === 'inquiry' && activeChat.product && (
              <div className="bg-surface/80 border-b border-line px-4 py-3 flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl bg-surface-alt border border-line overflow-hidden shrink-0">
                    {activeChat.product.image_url ? (
                      <Image
                        src={activeChat.product.image_url}
                        alt={activeChat.product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full">
                        Produk yang Ditanyakan
                      </span>
                      {activeChat.product.condition && (
                        <ConditionBadge condition={activeChat.product.condition} />
                      )}
                    </div>
                    <h4 className="text-xs md:text-sm font-bold text-ink truncate mt-0.5">
                      {activeChat.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <PricePill amount={activeChat.product.price} size="sm" />
                      <span className="text-[11px] text-ink-soft">
                        Stok: <strong className="text-ink">{activeChat.product.stock}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/products/${activeChat.product.id}`}
                  className="text-xs font-semibold text-primary hover:text-white px-3 py-1.5 rounded-full border border-primary/30 bg-primary-50/60 hover:bg-primary transition shrink-0 inline-flex items-center gap-1"
                >
                  <span>Lihat Produk</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Dropdown Banner Ringkasan Pesanan & Alert COD (Khusus Pesanan) */}
            {activeChat.type === 'order' && isOrderSummaryOpen && (
              <div className="bg-surface/70 border-b border-line px-4 py-3 text-xs flex flex-col gap-2.5 transition animate-in slide-in-from-top-2 duration-150 shrink-0">
                {activeChat.order?.delivery_method === 'meetup' && (
                  <div className="bg-primary-50/70 border border-primary/20 rounded-xl p-2.5 flex items-start gap-2 text-ink">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 text-[11px] leading-relaxed">
                      <strong className="text-primary font-bold block mb-0.5">
                        📍 Rekomendasi Titik Temu COD Kampus {activeChat.order?.campus_name ? `(${activeChat.order.campus_name})` : ''}:
                      </strong>
                      Sepakati titik temu yang aman dan ramai di lingkungan kampus (seperti Perpustakaan Pusat, Pintu Gerbang Utama, Gedung Rektorat, atau Kantin Fakultas). Periksa kelayakan fisik dan fungsi barang secara langsung sebelum menyelesaikan transaksi.
                    </div>
                  </div>
                )}

                {activeChat.order?.delivery_method === 'delivery' && (
                  <div className="bg-surface border border-line rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px] text-ink">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        Tujuan Kost:{' '}
                        <strong>
                          {activeChat.order?.shipping_address || 'Alamat kost pembeli'}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-pine bg-pine-50 px-2.5 py-0.5 rounded-full">
                      Lunas saat Checkout
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-line/40 text-[11px]">
                  <div className="flex items-center gap-2 overflow-x-auto max-w-[70%]">
                    <span className="text-ink-soft">Barang:</span>
                    {activeChat.items?.map((it, idx) => (
                      <span key={idx} className="font-semibold text-ink whitespace-nowrap">
                        {it.product_name} (x{it.quantity})
                        {idx < activeChat.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="font-bold text-ink">
                    Total: <span className="text-primary">{formatRupiah(activeChat.order?.total_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Area Pesan Obrolan (Bubbles) */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-canvas"
            >
              {activeChat.messages?.length === 0 ? (
                <div className="my-auto text-center p-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-2">
                    {activeChat.type === 'inquiry' ? (
                      <MessageCircle className="w-6 h-6" />
                    ) : (
                      <MessageSquare className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-ink">
                    {!activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                      ? 'Belum Ada Calon Pembeli yang Bertanya'
                      : activeChat.type === 'inquiry'
                      ? 'Mulai Tanya Produk ke Penjual'
                      : 'Mulai Percakapan Pesanan'}
                  </p>
                  <p className="text-[11px] text-ink-soft max-w-xs mt-1">
                    {!activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                      ? 'Ketika ada pembeli yang menghubungi tokomu untuk menanyakan produk, pesan akan muncul di sini.'
                      : activeChat.type === 'inquiry'
                      ? 'Tanyakan ketersediaan barang, detail kondisi, atau kesepakatan COD sebelum membeli.'
                      : 'Silakan sapa dan sepakati waktu serta lokasi ketemuan COD di kampus secara aman.'}
                  </p>
                </div>
              ) : (
                activeChat.messages?.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  const timeFormatted = new Date(msg.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] md:max-w-[70%] ${
                        isMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      {!isMe && (
                        <span className="text-[10px] font-semibold text-ink-soft ml-1 mb-0.5">
                          {msg.sender_name}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-xs break-words whitespace-pre-wrap ${
                          isMe
                            ? 'bg-primary text-white rounded-br-xs'
                            : 'bg-surface-alt text-ink border border-line rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-ink-soft/80 mt-1 px-1">
                        {timeFormatted}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Rekomendasi Pesan Cepat - Chip Bulat Natural Sebaris */}
            {getObjectiveQuickReplies().length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-line bg-canvas shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft mr-1">
                  Pesan Cepat:
                </span>
                {getObjectiveQuickReplies().map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuickReply(chip)}
                    className="w-auto px-3.5 py-1.5 text-xs font-medium rounded-full bg-surface text-ink border border-line hover:bg-primary-50 hover:text-primary hover:border-primary/30 transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Kirim Pesan - Konsisten Tinggi h-11 */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 p-3 bg-canvas border-t border-line shrink-0"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={Boolean(!activeChat.currentUser?.isBuyer && !activeChat.partner?.id)}
                placeholder={
                  !activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                    ? 'Belum ada pembeli untuk dibalas...'
                    : activeChat.type === 'inquiry'
                    ? 'Ketik pertanyaan tentang produk ini... (Enter untuk kirim)'
                    : 'Ketik pesan untuk koordinasi... (Enter untuk kirim)'
                }
                className="flex-1 h-11 px-3.5 bg-surface border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs md:text-sm text-ink transition-colors disabled:opacity-50 disabled:bg-surface-alt"
              />
              <button
                type="submit"
                disabled={
                  !messageText.trim() ||
                  sending ||
                  Boolean(!activeChat.currentUser?.isBuyer && !activeChat.partner?.id)
                }
                className="h-11 px-4 md:px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Kirim</span>
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
