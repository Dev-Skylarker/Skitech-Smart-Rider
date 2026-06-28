import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, ShoppingCart, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import logoImg from "@/assets/logo.png";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-5xl flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to={user ? "/dashboard" : "/"}
            className="nav-logo"
            aria-label="Skitech Smart Rider Home"
          >
            <img
              src={logoImg}
              alt="Skitech Smart Rider Logo"
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-black text-foreground text-base sm:text-lg leading-none">
              Skitech <span className="text-primary">Smart Rider</span>
            </span>
          </Link>

          {/* Desktop nav (public only) */}
          {!user && (
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium ml-2">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How it works</Link>
              <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            </nav>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/signup"><Button size="sm" className="font-semibold">Get Started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-card">
                <SheetHeader className="text-left border-b pb-4 mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <img src={logoImg} alt="Logo" className="h-7 w-7 rounded-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                    <span className="font-black text-sm">
                      Skitech <span className="text-primary">Smart Rider</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1">
                  {user ? (
                    <>
                      <MobileLink to="/dashboard" onClick={() => setOpen(false)} icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</MobileLink>
                      {isAdmin && <MobileLink to="/admin" onClick={() => setOpen(false)} icon={<Shield className="h-4 w-4" />} className="text-primary">Admin Panel</MobileLink>}
                      <MobileLink to="/shop" onClick={() => setOpen(false)} icon={<ShoppingCart className="h-4 w-4" />}>Shop</MobileLink>
                      <div className="border-t pt-2 mt-2">
                        <button
                          onClick={() => { setOpen(false); signOut(); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <MobileLink to="/about" onClick={() => setOpen(false)}>About</MobileLink>
                      <MobileLink to="/how-it-works" onClick={() => setOpen(false)}>How it works</MobileLink>
                      <MobileLink to="/faq" onClick={() => setOpen(false)}>FAQ</MobileLink>
                      <MobileLink to="/contact" onClick={() => setOpen(false)}>Contact</MobileLink>
                      <div className="border-t pt-2 mt-2 space-y-2">
                        <Link to="/login" onClick={() => setOpen(false)}>
                          <Button variant="outline" className="w-full">Login</Button>
                        </Link>
                        <Link to="/signup" onClick={() => setOpen(false)}>
                          <Button className="w-full font-semibold">Get Started</Button>
                        </Link>
                      </div>
                    </>
                  )}
                  {/* Dark mode in mobile menu */}
                  <div className="border-t pt-2 mt-2">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {isDark ? "Light mode" : "Dark mode"}
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileLink({
  to,
  children,
  onClick,
  icon,
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 transition-colors ${className}`}
    >
      {icon}
      {children}
    </Link>
  );
}
