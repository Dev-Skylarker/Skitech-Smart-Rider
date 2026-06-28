import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useIsStaff } from "@/hooks/use-is-admin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { checking, isStaff } = useIsStaff();
  const nav = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!checking && user && !isStaff) nav({ to: "/dashboard" });
  }, [checking, user, isStaff, nav]);

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
  if (!user || !isStaff) return null;

  return (
    <SidebarProvider className="dark">
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 md:px-6 bg-background/95 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="flex-shrink-0" />
              {/* Logo — clicks stay in admin panel */}
              <Link to="/admin" className="flex items-center gap-2 flex-shrink-0">
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-1.5"
              >
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
    </SidebarProvider>
  );
}
