"use client";

import { useEffect, useState, useCallback } from "react";
import liff from "@line/liff";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  image_url: string | null;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function LiffCatalogPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  const loadProducts = useCallback(async (chId: string) => {
    const res = await fetch(`/api/liff/products?channelId=${chId}`);
    const json = await res.json();
    if (json.ok) setProducts(json.products);
  }, []);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError("LIFF ID ยังไม่ได้ตั้งค่า");
      return;
    }

    liff
      .init({ liffId })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        const params = new URLSearchParams(window.location.search);
        const chId = params.get("channelId");

        setLineUserId(profile.userId);
        setChannelId(chId);
        if (chId) await loadProducts(chId);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, [loadProducts]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      next.set(product.id, {
        product,
        quantity: (existing?.quantity ?? 0) + 1,
      });
      return next;
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        next.delete(productId);
      } else {
        next.set(productId, { ...existing, quantity: existing.quantity - 1 });
      }
      return next;
    });
  }

  const cartItems = Array.from(cart.values());
  const totalAmount = cartItems.reduce(
    (sum, { product, quantity }) => sum + product.price_amount * quantity,
    0,
  );
  const totalItems = cartItems.reduce((sum, { quantity }) => sum + quantity, 0);

  async function handleSubmit() {
    if (!lineUserId || !channelId || cartItems.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/liff/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId,
          channelId,
          items: cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setDone(true);
        if (liff.isApiAvailable("sendMessages")) {
          await liff.sendMessages([
            {
              type: "text",
              text: `สั่งซื้อแล้วค่ะ ออเดอร์ #${json.orderNumber} ยอดรวม ฿${totalAmount.toLocaleString("th-TH")}`,
            },
          ]);
        }
        setTimeout(() => liff.closeWindow(), 1500);
      } else {
        setError(json.error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
        </div>
        <p className="text-sm text-stone-500">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-green-500 border-t-transparent" />
        <p className="text-xs text-stone-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-stone-900">สั่งซื้อสำเร็จแล้วค่ะ</p>
          <p className="mt-1 text-sm text-stone-400">กำลังกลับไปที่แชท...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ paddingBottom: totalItems > 0 ? 100 : 24 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-stone-900">เลือกสินค้า</h1>
          {totalItems > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-3 text-5xl">🛍</div>
          <p className="text-sm text-stone-400">ยังไม่มีสินค้าในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-3">
          {products.map((product) => {
            const inCart = cart.get(product.id);
            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {/* Image */}
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-stone-100 text-4xl">
                    🍪
                  </div>
                )}

                {/* Info */}
                <div className="p-3">
                  <p className="text-[13px] font-semibold leading-snug text-stone-900">
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-stone-400">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm font-bold text-green-600">
                    ฿{Number(product.price_amount).toLocaleString("th-TH")}
                  </p>

                  {/* Cart controls */}
                  {inCart ? (
                    <div className="mt-2.5 flex items-center justify-between rounded-xl bg-green-50 px-1.5 py-1">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base font-bold text-stone-500 shadow-sm active:bg-stone-50"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-green-700">{inCart.quantity}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500 text-base font-bold text-white shadow-sm active:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-2.5 w-full rounded-xl bg-green-500 py-2 text-xs font-bold text-white active:bg-green-600"
                    >
                      เพิ่มลงตะกร้า
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-between rounded-2xl bg-green-500 px-5 py-3.5 disabled:opacity-60 active:bg-green-600"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-400 text-xs font-bold text-white">
              {totalItems}
            </span>
            <span className="text-sm font-bold text-white">
              {submitting ? "กำลังส่งออเดอร์..." : "ยืนยันสั่งซื้อ"}
            </span>
            <span className="text-sm font-bold text-green-100">
              ฿{totalAmount.toLocaleString("th-TH")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
