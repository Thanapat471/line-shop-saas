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
        const context = liff.getContext();
        const chId = (context as { channelId?: string })?.channelId ?? null;

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
        // ส่ง message ใน chat แล้วปิดหน้าต่าง
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
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="text-center">
          <div className="mb-3 text-5xl">✓</div>
          <p className="font-semibold text-stone-900">สั่งซื้อสำเร็จแล้วค่ะ</p>
          <p className="mt-1 text-sm text-stone-400">กำลังปิดหน้าต่าง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3">
        <h1 className="font-bold text-stone-900">สินค้าทั้งหมด</h1>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {products.map((product) => {
          const inCart = cart.get(product.id);
          return (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-stone-100 text-4xl">
                  🛍
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-stone-900 leading-snug">{product.name}</p>
                {product.description && (
                  <p className="mt-0.5 text-xs text-stone-400 line-clamp-2">{product.description}</p>
                )}
                <p className="mt-1 font-bold text-green-600">
                  ฿{Number(product.price_amount).toLocaleString("th-TH")}
                </p>

                {inCart ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-green-50 px-2 py-1">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-stone-600 shadow-sm"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-green-700">{inCart.quantity}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white shadow-sm"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-2 w-full rounded-xl bg-green-500 py-1.5 text-sm font-semibold text-white"
                  >
                    เพิ่มลงตะกร้า
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-stone-200 bg-white p-4 shadow-lg">
          <div className="mb-2 flex justify-between text-sm text-stone-500">
            <span>{totalItems} รายการ</span>
            <span className="font-bold text-stone-900">
              ฿{totalAmount.toLocaleString("th-TH")}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-green-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "กำลังส่งออเดอร์..." : "ยืนยันสั่งซื้อ"}
          </button>
        </div>
      )}
    </div>
  );
}
