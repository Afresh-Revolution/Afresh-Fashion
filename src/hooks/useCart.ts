"use client";

import { useCallback, useEffect, useState } from "react";
import gsap from "gsap";
import type { CartResponse, CheckoutForm, OrderSummary } from "@/types/cart";

async function cartJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

const emptyCart: CartResponse = {
  id: "",
  item_count: 0,
  subtotal_amount: 0,
  currency_code: "NGN",
  items: [],
};

export function useCart(showToast: (msg: string) => void) {
  const [cart, setCart] = useState<CartResponse>(emptyCart);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await cartJson<CartResponse>("/api/cart");
      setCart(data.id ? data : emptyCart);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string, productName: string) => {
      try {
        const data = await cartJson<CartResponse>("/api/cart/items", {
          method: "POST",
          body: JSON.stringify({ product_id: productId, quantity: 1 }),
        });
        setCart(data);
        document.querySelectorAll("#cartBtn span, #cartBtnMobile span").forEach((badge) => {
          badge.textContent = String(data.item_count);
        });
        document.querySelectorAll("#cartBtn span, #cartBtnMobile span").forEach((badge) => {
          gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        });
        showToast(`${productName} added to bag`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not add to bag");
      }
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const data = await cartJson<CartResponse>(`/api/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    },
    []
  );

  const removeItem = useCallback(async (productId: string) => {
    const data = await cartJson<CartResponse>(`/api/cart/items/${productId}`, {
      method: "DELETE",
    });
    setCart(data ?? emptyCart);
  }, []);

  const openCheckout = useCallback(() => {
    if (cart.item_count === 0) {
      showToast("Your bag is empty");
      return;
    }
    setCheckoutOpen(true);
  }, [cart.item_count, showToast]);

  const createOrder = useCallback(async (form: CheckoutForm) => {
    return cartJson<{ order: OrderSummary }>("/api/orders/create", {
      method: "POST",
      body: JSON.stringify(form),
    });
  }, []);

  return {
    cart,
    cartCount: cart.item_count,
    loading,
    checkoutOpen,
    setCheckoutOpen,
    searchOpen,
    setSearchOpen,
    refresh,
    addToCart,
    updateQuantity,
    removeItem,
    openCheckout,
    createOrder,
  };
}
