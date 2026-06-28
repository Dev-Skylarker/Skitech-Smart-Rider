import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";

export function SiteFooter() {
  const { user } = useAuth();
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Brand */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-foreground">
                Skitech <span className="text-primary">Smart Rider</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Empowering Kenyan riders with permanent digital payment profiles.
              Scan to pay — zero commission, no card readers, direct to your wallet.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="font-semibold text-sm text-foreground mb-3">Platform</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How it works</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground mb-3">Account</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {!user ? (
                  <>
                    <li><Link to="/signup" className="hover:text-primary transition-colors">Sign up</Link></li>
                    <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                    <li><Link to="/shop" className="hover:text-primary transition-colors">Shop</Link></li>
                    <li><Link to="/cart" className="hover:text-primary transition-colors">Cart</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground mb-3">Legal</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact & Support</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Skitech Smart Rider. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground">
            Built for Kenyan riders 🇰🇪 · Zero commission forever
          </div>
        </div>
      </div>
    </footer>
  );
}
