import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { usePWA } from "@/hooks/use-pwa";
import { Download, Share, PlusSquare, X } from "lucide-react";

export function SiteFooter() {
  const { user } = useAuth();
  const { isInstallable, isInstalled, installApp, showIOSPrompt, setShowIOSPrompt } = usePWA();
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

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            >
              <Download className="h-3.5 w-3.5" />
              Install Smart Rider App
            </button>
          )}

          <div className="text-xs text-muted-foreground">
            Built for Kenyan riders 🇰🇪 · Zero commission forever
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200 text-center">
            {/* Close button */}
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon/Logo */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <img src={logoImg} alt="Smart Rider Logo" className="h-10 w-10 object-contain" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground mb-1">
              Install Skitech Smart Rider
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Install the app on your iPhone or iPad for instant access and offline capability.
            </p>

            {/* Instructions list */}
            <div className="text-left space-y-4 text-sm text-foreground bg-muted/40 p-4 rounded-xl border mb-6">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                <p className="leading-tight">
                  Tap the <span className="font-semibold inline-flex items-center gap-1">Share <Share className="h-4 w-4 inline text-primary" /></span> button in the Safari toolbar.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                <p className="leading-tight">
                  Scroll down the share menu and select <span className="font-semibold inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="h-4 w-4 inline text-primary" /></span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                <p className="leading-tight">
                  Tap <span className="font-semibold text-primary">Add</span> in the top right corner.
                </p>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
