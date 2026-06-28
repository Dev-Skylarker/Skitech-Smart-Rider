import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShoppingCart, Package, Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

type CartItemWithDetails = {
  id: string;
  quantity: number;
  shop_item_id: string;
  shop_items: {
    id: string;
    name: string;
    price_kes: number;
    cover_image: string | null;
    in_stock: boolean;
  } | null;
};

function CartPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/cart" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, shop_item_id, shop_items(id, name, price_kes, cover_image, in_stock)")
      .eq("user_id", user!.id);

    if (error) toast.error("Failed to load cart");
    setItems((data ?? []) as CartItemWithDetails[]);
    setFetching(false);
  }

  async function updateQty(cartId: string, newQty: number) {
    if (newQty < 1) {
      removeItem(cartId);
      return;
    }
    setUpdating(cartId);
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", cartId);
    setItems((prev) => prev.map((i) => i.id === cartId ? { ...i, quantity: newQty } : i));
    setUpdating(null);
  }

  async function removeItem(cartId: string) {
    await supabase.from("cart_items").delete().eq("id", cartId);
    setItems((prev) => prev.filter((i) => i.id !== cartId));
    toast.success("Item removed");
  }

  async function clearCart() {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
    toast.success("Cart cleared");
  }

  const subtotal = items.reduce((acc, item) => {
    return acc + (item.shop_items?.price_kes ?? 0) * item.quantity;
  }, 0);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/shop">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">Your Cart</h1>
            <p className="text-muted-foreground text-sm">
              {items.length === 0 ? "Empty" : `${items.reduce((a, i) => a + i.quantity, 0)} item${items.reduce((a, i) => a + i.quantity, 0) !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground text-sm mb-6">Browse the shop and add items to get started</p>
            <Link to="/shop">
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Browse Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart items */}
            <div className="flex-1 space-y-3">
              {items.map((item) => {
                const shopItem = item.shop_items;
                if (!shopItem) return null;
                return (
                  <div key={item.id} className="rounded-2xl border bg-card p-4 flex items-center gap-4">
                    {/* Image */}
                    <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {shopItem.cover_image ? (
                        <img src={shopItem.cover_image} alt={shopItem.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate">{shopItem.name}</div>
                      <div className="text-primary font-black">KES {shopItem.price_kes.toLocaleString()}</div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        disabled={updating === item.id}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5" onClick={clearCart}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear cart
                </Button>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:w-72 space-y-4">
              <div className="rounded-2xl border bg-card p-6">
                <h2 className="font-bold text-lg mb-4 text-foreground">Order Summary</h2>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="truncate flex-1 mr-2">{item.shop_items?.name} × {item.quantity}</span>
                      <span className="font-medium text-foreground flex-shrink-0">
                        KES {((item.shop_items?.price_kes ?? 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-black text-primary">KES {subtotal.toLocaleString()}</span>
                </div>

                <Button
                  className="w-full mt-5 gap-2 font-bold"
                  size="lg"
                  onClick={() => toast.info("Checkout coming soon! We'll contact you to arrange payment and delivery.")}
                >
                  Proceed to Checkout
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Payment and delivery will be arranged by our team
                </p>
              </div>

              <Link to="/shop">
                <Button variant="outline" className="w-full gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
