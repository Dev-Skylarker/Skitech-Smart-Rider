import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, User, Search, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { checking, isAdmin } = useIsAdmin();
  const nav = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ riders: any[]; orders: any[] }>({ riders: [], orders: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!checking && user && !isAdmin) nav({ to: "/dashboard" });
  }, [checking, user, isAdmin, nav]);

  // Keyboard shortcut listener (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search query fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ riders: [], orders: [] });
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const text = `%${searchQuery.trim()}%`;
        const [ridersRes, ordersRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, display_name, phone, plate_number")
            .or(`full_name.ilike.${text},phone.ilike.${text},plate_number.ilike.${text}`)
            .limit(5),
          supabase
            .from("merch_orders")
            .select("id, amount_kes, status")
            .or(`status.ilike.${text}`)
            .limit(5),
        ]);

        let orders = ordersRes.data ?? [];
        if (searchQuery.trim().length > 10) {
          const { data: orderById } = await supabase
            .from("merch_orders")
            .select("id, amount_kes, status")
            .eq("id", searchQuery.trim())
            .maybeSingle();
          if (orderById) {
            orders = [orderById, ...orders.filter((o) => o.id !== orderById.id)];
          }
        }

        setSearchResults({
          riders: ridersRes.data ?? [],
          orders,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-3">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 md:px-6 bg-background/95 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="flex-shrink-0" />
              {/* Logo — clicks stay in admin panel */}
              <Link to="/admin" className="flex items-center gap-2 flex-shrink-0 md:hidden">
                <img
                  src={logoImg}
                  alt="Skitech Smart Rider"
                  className="h-7 w-7 rounded-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <span className="font-black text-sm text-foreground hidden sm:block">
                  Skitech <span className="text-primary">Admin</span>
                </span>
              </Link>
            </div>

            {/* Global Search Bar Trigger (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center justify-between text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 border rounded-xl px-3 py-1.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
                  <span>Search riders, plate number, orders...</span>
                </div>
                <span className="bg-background px-1.5 py-0.5 rounded font-mono text-[9px] border shadow-sm">Ctrl K</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Global Search Bar Trigger (Mobile) */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Link to="/admin/account">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Account
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Global Command Palette Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col max-h-[70vh]">
            <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/30">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search riders by name, phone, plate... or orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none py-1"
              />
              <span className="text-[10px] bg-muted px-2 py-1 rounded font-mono border text-muted-foreground">ESC</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searching ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Searching…
                </div>
              ) : !searchQuery ? (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Quick Actions / Pages</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Overview", to: "/admin" },
                      { label: "Manage Riders", to: "/admin/riders" },
                      { label: "Manage Orders", to: "/admin/orders" },
                      { label: "Manage Shop", to: "/admin/shop" },
                      { label: "Roles & Access", to: "/admin/roles" },
                      { label: "Account Settings", to: "/admin/account" },
                    ].map((link) => (
                      <Link
                        key={link.label}
                        to={link.to as any}
                        onClick={() => setSearchOpen(false)}
                        className="p-2.5 rounded-xl border bg-muted/10 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-semibold block text-center"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : searchResults.riders.length === 0 && searchResults.orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No matching riders or orders found.
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.riders.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Riders ({searchResults.riders.length})</div>
                      <div className="divide-y rounded-xl border overflow-hidden bg-background">
                        {searchResults.riders.map((r) => (
                          <Link
                            key={r.id}
                            to="/admin/riders"
                            search={{ status: "all" }}
                            onClick={() => setSearchOpen(false)}
                            className="p-3 hover:bg-muted/40 transition-colors flex justify-between items-center text-xs block text-left"
                          >
                            <div>
                              <div className="font-bold text-foreground">{r.full_name || r.display_name || "Unnamed"}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{r.phone} · Plate: {r.plate_number || "—"}</div>
                            </div>
                            <span className="text-[10px] text-primary font-medium hover:underline">Manage →</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.orders.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Orders ({searchResults.orders.length})</div>
                      <div className="divide-y rounded-xl border overflow-hidden bg-background">
                        {searchResults.orders.map((o) => (
                          <Link
                            key={o.id}
                            to="/admin/orders"
                            search={{ status: o.status }}
                            onClick={() => setSearchOpen(false)}
                            className="p-3 hover:bg-muted/40 transition-colors flex justify-between items-center text-xs block text-left"
                          >
                            <div>
                              <div className="font-bold text-foreground">Order: {o.id.substring(0, 8)}…</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Amount: KES {o.amount_kes} · Status: <span className="capitalize">{o.status}</span></div>
                            </div>
                            <span className="text-[10px] text-primary font-medium hover:underline">View →</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

