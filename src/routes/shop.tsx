import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, ShoppingBag, Package, Plus, ChevronLeft, ChevronRight, X, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/shop")({ component: ShopPage });

type ShopItem = {
  id: string;
  name: string;
  description: string | null;
  price_kes: number;
  cover_image: string | null;
  gallery_images: string[];
  in_stock: boolean;
};

type CartItem = { id: string; shop_item_id: string; quantity: number };

function ShopPage() {
  const { user, loading, isActive } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/shop" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("shop_items").select("*").eq("in_stock", true).order("created_at", { ascending: false }),
      supabase.from("cart_items").select("*").eq("user_id", user.id),
    ]).then(([{ data: shopData }, { data: cartData }]) => {
      setItems((shopData ?? []) as ShopItem[]);
      setCart((cartData ?? []) as CartItem[]);
      setFetching(false);
    });
  }, [user]);

  async function addToCart(itemId: string) {
    if (!user) return;
    if (!isActive) {
      toast.error("Activate your profile to shop");
      return;
    }
    setAdding(itemId);
    const existing = cart.find((c) => c.shop_item_id === itemId);
    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      if (!error) {
        setCart((c) => c.map((ci) => ci.id === existing.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
        toast.success("Quantity updated!");
      }
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, shop_item_id: itemId, quantity: 1 })
        .select()
        .single();
      if (!error && data) {
        setCart((c) => [...c, data as CartItem]);
        toast.success("Added to cart!");
      }
    }
    setAdding(null);
  }

  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);

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

  // Not active profile — show lock
  if (!isActive) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black mb-3">Shop unlocks with an active profile</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Complete your rider profile and pay the KES 100 activation fee to access the shop.
            </p>
            <Link to="/profile/create">
              <Button size="lg" className="gap-2">Create Profile — KES 100</Button>
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground">Skitech Shop</h1>
              <p className="text-muted-foreground text-sm mt-1">Exclusive gear for Smart Rider members</p>
            </div>
          </div>
          <Link to="/cart">
            <Button variant="outline" className="relative gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Items grid */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Shop coming soon</h2>
            <p className="text-muted-foreground text-sm">No items available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const inCart = cart.some((c) => c.shop_item_id === item.id);
              const cartQty = cart.find((c) => c.shop_item_id === item.id)?.quantity ?? 0;

              return (
                <div key={item.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all group">
                  {/* Image */}
                  <div
                    className="h-52 bg-muted overflow-hidden cursor-pointer relative"
                    onClick={() => { setSelectedItem(item); setGalleryIdx(0); }}
                  >
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {item.gallery_images?.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs rounded-full px-2 py-0.5">
                        +{item.gallery_images.length} photos
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-primary">KES {item.price_kes.toLocaleString()}</span>
                      {inCart && (
                        <Badge variant="secondary" className="text-xs">In cart ({cartQty})</Badge>
                      )}
                    </div>
                    <Button
                      className="w-full mt-4 gap-2"
                      onClick={() => addToCart(item.id)}
                      disabled={adding === item.id}
                      variant={inCart ? "outline" : "default"}
                    >
                      {adding === item.id ? (
                        <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {inCart ? "Add more" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter />

      {/* Image gallery modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-card rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-1.5"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Main image */}
            <div className="h-72 bg-muted">
              {(() => {
                const allImages = [selectedItem.cover_image, ...(selectedItem.gallery_images ?? [])].filter(Boolean) as string[];
                return allImages.length > 0 ? (
                  <div className="relative h-full">
                    <img src={allImages[galleryIdx]} alt={selectedItem.name} className="h-full w-full object-cover" />
                    {allImages.length > 1 && (
                      <>
                        <button onClick={() => setGalleryIdx((i) => (i - 1 + allImages.length) % allImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={() => setGalleryIdx((i) => (i + 1) % allImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImages.map((_, i) => (
                            <div key={i} onClick={() => setGalleryIdx(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === galleryIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center"><Package className="h-16 w-16 text-muted-foreground" /></div>
                );
              })()}
            </div>

            <div className="p-6">
              <h2 className="text-xl font-black mb-1">{selectedItem.name}</h2>
              {selectedItem.description && <p className="text-muted-foreground text-sm mb-4">{selectedItem.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-primary">KES {selectedItem.price_kes.toLocaleString()}</span>
                <Button onClick={() => { addToCart(selectedItem.id); setSelectedItem(null); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
