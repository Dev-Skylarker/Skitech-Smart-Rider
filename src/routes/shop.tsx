import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, ShoppingBag, Package, Plus, ChevronLeft, ChevronRight, X, Lock, ArrowLeft, ShieldCheck } from "lucide-react";

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
  const [addedItem, setAddedItem] = useState<ShopItem | null>(null);

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
    const item = items.find((i) => i.id === itemId);
    const existing = cart.find((c) => c.shop_item_id === itemId);
    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      if (!error) {
        setCart((c) => c.map((ci) => ci.id === existing.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
        if (item) setAddedItem(item);
      }
    } else {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, shop_item_id: itemId, quantity: 1 })
        .select()
        .single();
      if (!error && data) {
        setCart((c) => [...c, data as CartItem]);
        if (item) setAddedItem(item);
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
          <div className="text-center py-20 bg-muted/5 border border-dashed rounded-3xl p-8 max-w-lg mx-auto animate-scale-in">
            <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              {/* Background glowing circles */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-75 animate-pulse" />
              <div className="absolute top-2 right-6 w-3 h-3 bg-accent/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              
              {/* SVG package */}
              <svg className="w-24 h-24 text-primary relative z-10" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Styled package box */}
                <path d="M50 20L80 32L50 44L20 32L50 20Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 32V68L50 80V44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M80 32V68L50 80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {/* Accent band on package */}
                <path d="M50 44L35 38M50 44V62M50 80V62M35 38V56" stroke="var(--color-accent)" strokeWidth="3" opacity="0.85" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-foreground">Shop Coming Soon</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              No items are available yet. We are stocking smart rider gear and stickers soon. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const inCart = cart.some((c) => c.shop_item_id === item.id);
              const cartQty = cart.find((c) => c.shop_item_id === item.id)?.quantity ?? 0;

              return (
                <div key={item.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/40 group">
                  {/* Image */}
                  <div
                    className="h-52 bg-muted overflow-hidden cursor-pointer relative"
                    onClick={() => { setSelectedItem(item); setGalleryIdx(0); }}
                  >
                    {/* Verified sticker badge */}
                    <Badge className="absolute top-3 left-3 z-10 bg-accent text-accent-foreground flex items-center gap-1 font-bold text-[10px] shadow-md border-accent/20">
                      <ShieldCheck className="h-3 w-3" />
                      Smart Gear
                    </Badge>
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


      {/* Added to Cart Confirmation Modal */}
      {addedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setAddedItem(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl overflow-hidden animate-scale-in-bounce">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-green-500" />

            <div className="text-center mt-2 mb-6">
              {/* Animated Check Circle */}
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    className="animate-draw-check"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-black text-foreground">Added to Cart!</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your item has been added successfully.
              </p>
            </div>

            {/* Item Card Preview */}
            <div className="flex items-center gap-4 rounded-2xl bg-muted/50 border p-4 mb-6">
              <div className="h-16 w-16 bg-card border rounded-xl overflow-hidden shrink-0">
                {addedItem.cover_image ? (
                  <img src={addedItem.cover_image} alt={addedItem.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="font-bold text-sm text-foreground truncate">{addedItem.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{addedItem.description || "No description"}</div>
                <div className="text-sm font-black text-primary mt-1.5">KES {addedItem.price_kes.toLocaleString()}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 font-bold text-xs" onClick={() => setAddedItem(null)}>
                Keep Shopping
              </Button>
              <Link to="/cart">
                <Button className="w-full h-11 font-bold text-xs">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

