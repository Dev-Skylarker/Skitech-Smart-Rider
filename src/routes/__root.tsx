import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { themeInitScript } from "@/lib/theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="max-w-md w-full rounded-3xl border bg-card p-8 text-center shadow-xl relative animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 text-primary animate-bounce">
          <span className="text-4xl font-black">404</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Lost on the road?</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable. Let's get you back on track!
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary h-11 px-5 text-sm font-bold text-primary-foreground hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
          >
            Go to Home
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/faq"
              className="inline-flex items-center justify-center rounded-xl border bg-background hover:bg-muted h-10 text-xs font-semibold text-foreground transition-colors"
            >
              Browse FAQs
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border bg-background hover:bg-muted h-10 text-xs font-semibold text-foreground transition-colors"
            >
              Get Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-destructive/5 via-background to-secondary/5" />
      
      <div className="max-w-md w-full rounded-3xl border bg-card p-8 text-center shadow-xl relative animate-scale-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-6 text-destructive">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-black text-foreground mb-3">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. Our team has been notified.
        </p>
        <div className="bg-muted/40 border p-4 rounded-xl text-left mb-8 text-xs font-mono text-destructive overflow-auto max-h-32">
          {error.message || "Unknown error"}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary h-11 px-5 text-sm font-bold text-primary-foreground hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border bg-background hover:bg-muted h-11 px-5 text-sm font-bold text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Skitech Smart Rider — QR Payment Profiles for Riders" },
      {
        name: "description",
        content:
          "Skitech Smart Rider gives boda riders a permanent QR code that links to their public payment profile. Sign up, create your profile for KES 100, get paid.",
      },
      { name: "theme-color", content: "#F37021" },
      // iOS / Safari PWA support
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Smart Rider" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
      // PWA manifest and apple-touch-icon
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Inline script to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register SW after page loads to prevent blocking critical initial fetches
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.error("PWA Service Worker registration failed:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
