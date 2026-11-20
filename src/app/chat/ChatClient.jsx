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

  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [productImgError, setProductImgError] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

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

  useEffect(() => {
    if (!activeTarget) return;
    const interval = setInterval(() => {
      pollActiveChat(activeTarget);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTarget, pollActiveChat]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !activeTarget || sending) return;

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
        setMessageText(trimmed);
        setSending(false);
        return;
      }

      if (data.message) {
        setActiveChat((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), data.message],
        }));
        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      fetchConversations();
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Terjadi gangguan jaringan');
      setMessageText(trimmed);
    } finally {
      setSending(false);
    }
  };

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

  const handleSendQuickReply = (text) => {
    setMessageText(text);
  };

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

  const getObjectiveQuickReplies = () => {
    if (!activeChat) return [];

    if (!activeChat.currentUser?.isBuyer && !activeChat.partner?.id) {
      return [];
    }

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
          'Halo kak, barangnya masih ada ya.',
          'Harga sudah pas/nett ya kak.',
          'Bisa COD di sekitar kampus ya.',
          'Kondisi barang sesuai deskripsi.',
        ];
      }
    }

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
          'Saya sudah di titik temu COD.',
        ];
      } else {
        return [
          'Barang siap untuk COD hari ini.',
          'Bisa ketemuan jam berapa?',
          campus ? `Standby di Perpustakaan (${campus}).` : 'Standby di Perpustakaan Pusat.',
          'Saya sudah di titik temu COD.',
        ];
      }
    } else {
      if (isBuyer) {
        return [
          'Kapan paket dikirim ke kost?',
          'Sudah dibayar saat checkout ya kak.',
          'Apakah ada info pengiriman?',
          'Paket sudah tiba, terima kasih.',
        ];
      } else {
        return [
          'Pesanan sedang disiapkan.',
          'Paket segera dikirim ke kost.',
          'Paket sudah dalam perjalanan.',
          'Mohon konfirmasi jika barang tiba.',
        ];
      }
    }
  };

  return (
    <div className="w-full h-full min-h-0 surface-3d sm:rounded-2xl flex flex-col md:flex-row overflow-hidden">
      {/* Kolom Kiri: Daftar Percakapan */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border-subtle bg-canvas h-full overflow-hidden ${
          activeTarget ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h1 className="text-base font-bold text-ink flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-blue" aria-hidden="true" />
              <span>Pesan dan Koordinasi</span>
            </h1>
            <span className="text-xs font-semibold bg-brand-blue-soft text-brand-blue px-2 py-0.5 rounded-md tabular-nums">
              {displayConversations.length}
            </span>
          </div>
          <label htmlFor="chat-search-input" className="sr-only">
            Cari percakapan
          </label>
          <input
            id="chat-search-input"
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Cari toko, barang, atau pembeli..."
            className="w-full h-10 text-base md:text-sm px-3.5 bg-surface-muted text-ink placeholder:text-ink-subtle rounded-lg border border-transparent focus:bg-surface focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-soft outline-none transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
          {loadingList ? (
            <div className="p-8 text-center text-xs text-ink-muted">Memuat percakapan...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted flex flex-col items-center gap-2">
              <MessageCircle className="w-8 h-8 text-ink-muted" aria-hidden="true" />
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
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-brand-blue-soft border-l-4 border-brand-blue' : 'hover:bg-surface'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-brand-blue font-bold">
                    {isUserTheBuyer ? (
                      <Store className="w-5 h-5 text-brand-blue" aria-hidden="true" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-navy-900" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-ink truncate">{partnerName}</span>
                      <span className="text-[11px] text-ink-muted tabular-nums shrink-0">
                        {c.last_message_time
                          ? new Date(c.last_message_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      {isOrder ? (
                        <>
                          <span className="text-[11px] tabular-nums font-semibold text-ink-secondary">
                            #{c.order_code}
                          </span>
                          {c.campus_short_name && (
                            <span className="text-[11px] font-semibold text-brand-blue bg-brand-blue-soft px-1.5 py-0.5 rounded-md">
                              {c.campus_short_name}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                              c.delivery_method === 'meetup'
                                ? 'bg-info-bg text-navy-900'
                                : 'bg-warning-bg text-warning-text'
                            }`}
                          >
                            {c.delivery_method === 'meetup' ? 'COD' : 'Kirim'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] font-semibold text-brand-blue bg-brand-blue-soft px-1.5 py-0.5 rounded-md">
                            Tanya Produk
                          </span>
                          {c.product_name && (
                            <span className="text-[11px] font-medium text-ink-muted truncate max-w-[120px]">
                              {c.product_name}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted truncate mt-1">
                      {c.last_message || 'Mulai obrolan di sini...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Kolom Kanan: Ruang Chat Aktif */}
      <div
        className={`flex-1 flex flex-col bg-surface min-w-0 h-full overflow-hidden ${
          !activeTarget ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}
      >
        {!activeTarget ? (
          <div className="p-8 text-center max-w-sm flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-brand-blue-soft text-brand-blue border border-brand-blue-border flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-ink mb-1">Pilih Percakapan</h2>
            <p className="text-xs text-ink-muted">
              Pilih salah satu percakapan di daftar kiri untuk koordinasi pesanan atau tanya produk.
            </p>
          </div>
        ) : loadingChat && !activeChat ? (
          <div className="flex-1 flex items-center justify-center text-xs text-ink-muted">
            Memuat ruang obrolan...
          </div>
        ) : activeChat ? (
          <>
            {/* Top Bar Chat */}
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTarget(null);
                    router.replace('/chat', { scroll: false });
                  }}
                  className="md:hidden w-11 h-11 -ml-1.5 rounded-lg hover:bg-surface-muted text-ink-secondary hover:text-ink flex items-center justify-center shrink-0"
                  aria-label="Kembali ke daftar pesan"
                >
                  <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                </button>

                <div className="w-9 h-9 rounded-lg bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0 font-bold">
                  {activeChat.currentUser?.isBuyer ? (
                    <Store className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <UserIcon className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-ink truncate">
                      {activeChat.partner?.name}
                    </h2>
                    <Badge variant="secondary" size="xs" className="shrink-0">
                      {activeChat.partner?.role === 'seller' ? 'Penjual' : 'Pembeli'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                    {activeChat.type === 'order' ? (
                      <>
                        <span className="tabular-nums font-semibold text-ink-secondary">
                          #{activeChat.order?.order_code}
                        </span>
                        {activeChat.order?.campus_short_name && (
                          <span className="bg-brand-blue-soft text-brand-blue font-semibold text-[11px] px-1.5 py-0.5 rounded-md">
                            {activeChat.order.campus_short_name}
                          </span>
                        )}
                        <OrderStatusBadge
                          status={activeChat.order?.status}
                          deliveryMethod={activeChat.order?.delivery_method}
                          className="text-[11px] py-0 px-2"
                        />
                      </>
                    ) : (
                      <>
                        <span className="bg-brand-blue-soft text-brand-blue font-semibold text-[11px] px-1.5 py-0.5 rounded-md">
                          Tanya Produk
                        </span>
                        {activeChat.store?.campus_short_name && (
                          <span className="bg-surface-muted text-ink-secondary font-semibold text-[11px] px-1.5 py-0.5 rounded-md">
                            {activeChat.store.campus_short_name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {activeChat.type === 'order' ? (
                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                  className="flex items-center gap-1 min-h-[38px] text-xs font-semibold text-brand-blue hover:bg-brand-blue-soft px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <span>{isOrderSummaryOpen ? 'Tutup Detail' : 'Detail Pesanan'}</span>
                  {isOrderSummaryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              ) : activeChat.store?.id ? (
                <Link
                  href={`/stores/${activeChat.store.id}`}
                  className="text-xs font-semibold text-ink-secondary hover:text-brand-blue px-3 py-2 min-h-[38px] rounded-lg hover:bg-canvas border border-border-subtle transition-colors shrink-0 inline-flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Kunjungi Toko</span>
                </Link>
              ) : null}
            </div>

            {/* Banner Konteks Produk (Pra-Order) */}
            {activeChat.type === 'inquiry' && activeChat.product && (
              <div className="bg-canvas border-b border-border-subtle px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg bg-surface-muted border border-border-subtle overflow-hidden shrink-0">
                    {!productImgError && activeChat.product.image_url ? (
                      <Image
                        src={activeChat.product.image_url}
                        alt={activeChat.product.name}
                        fill
                        unoptimized
                        onError={() => setProductImgError(true)}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <Package className="w-5 h-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-brand-blue bg-brand-blue-soft px-2 py-0.5 rounded-md">
                        Produk Ditanyakan
                      </span>
                      {activeChat.product.condition && (
                        <ConditionBadge condition={activeChat.product.condition} />
                      )}
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-ink truncate mt-1">
                      {activeChat.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <PricePill amount={activeChat.product.price} size="sm" />
                      <span className="text-xs text-ink-muted tabular-nums">
                        Stok: <strong className="text-ink">{activeChat.product.stock}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/products/${activeChat.product.id}`}
                  className="text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white px-3 py-2 min-h-[38px] rounded-lg border border-brand-blue-border bg-brand-blue-soft transition-colors shrink-0 inline-flex items-center justify-center gap-1 self-start sm:self-auto"
                >
                  <span>Lihat Produk</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Banner Ringkasan Pesanan */}
            {activeChat.type === 'order' && isOrderSummaryOpen && (
              <div className="bg-canvas border-b border-border-subtle px-4 py-3 text-xs flex flex-col gap-2.5 shrink-0">
                {activeChat.order?.delivery_method === 'meetup' && (
                  <div className="bg-info-bg border border-brand-blue-border rounded-lg p-3 flex items-start gap-2 text-ink">
                    <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 text-xs leading-relaxed">
                      <strong className="text-navy-900 font-bold block mb-0.5">
                        Titik Temu COD Kampus {activeChat.order?.campus_name ? `(${activeChat.order.campus_name})` : ''}
                      </strong>
                      Sepakati titik temu yang aman dan ramai di area kampus (Perpustakaan, Pintu Gerbang Utama, atau Kantin Fakultas) dan cek kondisi barang sebelum menyelesaikan pesanan.
                    </div>
                  </div>
                )}

                {activeChat.order?.delivery_method === 'delivery' && (
                  <div className="bg-surface border border-border-subtle rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-ink">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                      <span>
                        Tujuan Kost:{' '}
                        <strong>
                          {activeChat.order?.shipping_address || 'Alamat kost pembeli'}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-success-text bg-success-bg px-2.5 py-0.5 rounded-md">
                      Lunas saat Checkout
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 border-t border-border-subtle text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    <span className="text-ink-muted">Barang:</span>
                    {activeChat.items?.map((it, idx) => (
                      <span key={idx} className="font-semibold text-ink whitespace-nowrap">
                        {it.product_name} (x{it.quantity})
                        {idx < activeChat.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="font-bold text-ink tabular-nums">
                    Total:{' '}
                    <span className="text-brand-blue font-bold">
                      {formatRupiah(activeChat.order?.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Area Pesan Obrolan */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-canvas"
            >
              {activeChat.messages?.length === 0 ? (
                <div className="my-auto text-center p-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue-soft text-brand-blue border border-brand-blue-border flex items-center justify-center mb-3">
                    {activeChat.type === 'inquiry' ? (
                      <MessageCircle className="w-6 h-6" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="w-6 h-6" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink">
                    {!activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                      ? 'Belum Ada Calon Pembeli yang Bertanya'
                      : activeChat.type === 'inquiry'
                      ? 'Mulai Tanya Produk ke Penjual'
                      : 'Mulai Percakapan Pesanan'}
                  </p>
                  <p className="text-xs text-ink-muted max-w-xs mt-1">
                    {!activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                      ? 'Ketika ada pembeli menghubungi tokomu, pesan akan tampil di sini.'
                      : activeChat.type === 'inquiry'
                      ? 'Tanyakan ketersediaan barang, detail kondisi, atau titik temu COD.'
                      : 'Sepakati waktu dan titik ketemuan COD di kampus secara aman.'}
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
                      className={`flex flex-col max-w-[82%] md:max-w-[70%] ${
                        isMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      {!isMe && (
                        <span className="text-[11px] font-semibold text-ink-muted ml-1 mb-0.5">
                          {msg.sender_name}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                          isMe
                            ? 'bg-navy-900 text-white rounded-br-none'
                            : 'bg-surface text-ink border border-border-subtle rounded-bl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[11px] text-ink-muted tabular-nums mt-1 px-1">
                        {timeFormatted}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pesan Cepat */}
            {getObjectiveQuickReplies().length > 0 && (
              <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 px-3 sm:px-4 py-2 border-t border-border-subtle bg-surface shrink-0 overflow-x-auto no-scrollbar">
                <span className="text-xs font-semibold text-ink-muted shrink-0">
                  Pesan Cepat:
                </span>
                {getObjectiveQuickReplies().map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuickReply(chip)}
                    className="min-h-[34px] px-3 py-1 text-xs font-medium rounded-lg bg-canvas text-ink-secondary border border-border-subtle hover:bg-brand-blue-soft hover:text-brand-blue hover:border-brand-blue-border transition-colors shrink-0 whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Form Kirim Pesan */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 bg-surface border-t border-border-subtle shrink-0"
            >
              <label htmlFor="chat-message-input" className="sr-only">
                Ketik pesan
              </label>
              <input
                id="chat-message-input"
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={Boolean(!activeChat.currentUser?.isBuyer && !activeChat.partner?.id)}
                placeholder={
                  !activeChat.currentUser?.isBuyer && !activeChat.partner?.id
                    ? 'Belum ada pembeli untuk dibalas...'
                    : activeChat.type === 'inquiry'
                    ? 'Ketik pertanyaan tentang produk ini...'
                    : 'Ketik pesan untuk koordinasi...'
                }
                className="flex-1 min-w-0 h-11 px-3.5 bg-canvas border border-border-subtle rounded-lg focus:outline-none focus:ring-3 focus:ring-brand-blue-soft focus:border-brand-blue text-base md:text-sm text-ink transition-colors disabled:opacity-60 disabled:bg-surface-muted"
              />
              <button
                type="submit"
                disabled={
                  !messageText.trim() ||
                  sending ||
                  Boolean(!activeChat.currentUser?.isBuyer && !activeChat.partner?.id)
                }
                className="h-11 px-4 md:px-5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white text-xs md:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Kirim</span>
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
