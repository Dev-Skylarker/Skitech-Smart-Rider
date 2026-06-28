import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Truck,
  FileQuestion,
  ShoppingBag,
  QrCode,
  ArrowRight,
  Clock,
  Pencil,
  Star,
  Download,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import logoImg from "@/assets/logo.png";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  route: string | null;
  city: string | null;
  status: "draft" | "pending_payment" | "active" | "suspended";
  qr_slug: string;
  photo_url: string | null;
  trust_score: number;
};

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/dashboard" } });
  }, [loading, user, nav]);

  const { isAdmin, checking } = useIsAdmin();

  useEffect(() => {
    if (!checking && isAdmin) nav({ to: "/admin" });
  }, [checking, isAdmin, nav]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        setFetching(false);
      });
  }, [user]);

  if (loading || fetching || checking || isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine display mode
  const hasProfileData = !!(profile?.full_name);
  const isActive = profile?.status === "active";
  const isDraft = hasProfileData && profile?.status === "draft";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto px-4 md:px-8 py-10 max-w-4xl">
        {isActive ? (
          <ActiveView profile={profile!} />
        ) : isDraft ? (
          <DraftView profile={profile!} />
        ) : (
          <NoProfileView userName={user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Rider"} />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

// ─── No Profile: Marketing/Upsell View ────────────────────────────────────────

function NoProfileView({ userName }: { userName: string }) {
  return (
    <div className="animate-fade-in">
      {/* Hero CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground p-8 md:p-12 overflow-hidden relative mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome, {userName}!
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
            Your digital rider profile awaits
          </h1>
          <p className="opacity-90 max-w-xl text-sm md:text-base leading-relaxed mb-6">
            Create your profile and get a permanent QR code that customers scan to pay you instantly.
            No commission, no hassle — just your money, directly to your wallet.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/profile/create">
              <Button size="lg" variant="secondary" className="font-bold gap-2">
                Create My Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
            <span className="text-2xl font-black">KES 100</span>
            <span className="text-sm opacity-80">one-time profile activation fee</span>
          </div>
        </div>
      </div>

      {/* Why create a profile */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: QrCode,
            title: "Permanent QR Code",
            body: "One QR, linked to your profile forever. Update your payment details anytime without reprinting.",
          },
          {
            icon: Truck,
            title: "Physical QR Sticker",
            body: "Order a weatherproof QR sticker for your boda or vehicle. Delivered anywhere in Kenya.",
          },
          {
            icon: Star,
            title: "Build Trust",
            body: "A verified profile with your photo, plate and route helps customers feel safe paying you.",
          },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="font-bold mb-2">{c.title}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold mb-4">How it works</h2>
        <ol className="space-y-3">
          {[
            ["Account created ✓", true],
            ["Create your rider profile", false],
            ["Pay KES 100 activation fee", false],
            ["Get your QR code & go live", false],
          ].map(([t, done], i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={done ? "font-medium text-accent" : "text-muted-foreground"}>
                {t as string}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Draft Profile View ────────────────────────────────────────────────────────

function DraftView({ profile }: { profile: Profile }) {
  return (
    <div className="animate-fade-in">
      {/* Draft banner */}
      <div className="rounded-3xl border-2 border-dashed border-amber-400/60 bg-amber-50 dark:bg-amber-950/20 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 border border-amber-300/50">
            <Clock className="h-3 w-3" />
            DRAFT — Not yet active
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <FileQuestion className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground mb-2">
              Complete your profile to go live
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
              You have a draft profile saved for <strong className="text-foreground">{profile.full_name}</strong>.
              Complete the process and pay the <strong className="text-foreground">KES 100</strong> activation fee
              to get your QR code and public profile.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link to="/profile/create">
                <Button className="gap-2 font-bold">
                  <Pencil className="h-4 w-4" />
                  Complete Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What's missing */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold mb-4 text-lg">Profile status</h2>
        <div className="space-y-2">
          {[
            { label: "Basic information", done: !!profile.full_name },
            { label: "Vehicle & route", done: !!profile.plate_number },
            { label: "Payment methods", done: false },
            { label: "Profile activated (KES 100)", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-sm ${item.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
              {item.done && (
                <span className="ml-auto text-xs text-accent font-bold">Done</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Active Profile View ───────────────────────────────────────────────────────

function ActiveView({ profile }: { profile: Profile }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${profile.qr_slug}`
      : `/r/${profile.qr_slug}`;

  const riderName = profile.display_name || profile.full_name || "Rider";

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Profile card */}
        <div className="flex-1 w-full rounded-2xl border bg-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent text-xs font-bold px-3 py-1.5 h-fit">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Profile Active
            </div>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={riderName} className="h-16 w-16 rounded-full border-2 border-muted object-cover shadow-sm bg-muted" />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-muted bg-muted/50 flex items-center justify-center text-xl font-black text-muted-foreground">
                {riderName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">{riderName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {[profile.vehicle_type, profile.plate_number, profile.route].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link to="/profile/create">
              <Button variant="outline" className="w-full gap-2">
                <Pencil className="h-4 w-4" />
                Edit Details
              </Button>
            </Link>
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                View Public Page
              </Button>
            </a>
          </div>

          {/* Shop access */}
          <div className="mt-4">
            <Link to="/shop">
              <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <ShoppingBag className="h-4 w-4" />
                Browse Shop
              </Button>
            </Link>
          </div>

          {/* Public link */}
          <div className="mt-5 rounded-xl border p-4 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Your public QR link</div>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all flex-1 font-mono text-foreground">{url}</code>
              <Button
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Download Button moved here */}
          <Button
            className="mt-6 gap-2 font-bold w-full shadow-md h-12 text-base"
            variant="default"
            onClick={async () => {
              const el = document.getElementById("qr-sticker-container");
              if (!el) return;
              try {
                const dataUrl = await toPng(el, {
                  cacheBust: true,
                  pixelRatio: 3,
                });
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = `smart-rider-qr-${profile.display_name || "sticker"}.png`;
                a.click();
                toast.success("QR sticker downloaded!");
              } catch (err) {
                console.error("Export error", err);
                toast.error("Failed to download QR code");
              }
            }}
          >
            <Download className="h-4 w-4" />
            Download QR Sticker
          </Button>
        </div>

        {/* QR Code Section */}
        <div className="w-full lg:w-auto flex-shrink-0 flex flex-col items-center lg:items-start justify-center lg:mt-0">
          <div className="relative">
            {/* Sticker container to be exported */}
            <div 
              id="qr-sticker-container"
              className="relative w-[320px] rounded-3xl bg-gradient-to-br from-primary to-primary/90 p-6 pb-7 overflow-hidden flex flex-col"
            >
              {/* Decorative waves */}
              <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 380 475" preserveAspectRatio="none">
                <path d="M0,350 C120,275 240,400 380,312 L380,475 L0,475 Z" fill="var(--secondary)" />
                <path d="M0,387 C130,325 260,412 380,362 L380,475 L0,475 Z" fill="var(--secondary)" opacity="0.7" />
              </svg>

              {/* Header */}
              <div className="relative flex items-center justify-center text-primary-foreground mb-6">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-full object-cover shadow-sm bg-white" />
                  <div className="leading-none">
                    <div className="font-black tracking-tight text-xl text-black">Skitech</div>
                    <div className="font-medium text-sm text-white opacity-90 tracking-wide">Smart Rider</div>
                  </div>
                </div>
              </div>

              {/* QR Area */}
              <div className="relative rounded-3xl bg-white p-5 shadow-xl mb-auto">
                <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-muted/30 to-muted grid place-items-center p-1">
                  <QRCodeSVG
                    value={url}
                    size={230}
                    bgColor="transparent"
                    fgColor="#1a1a1a"
                    level="H"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="relative text-center text-primary-foreground mt-6 px-2">
                <div className="text-sm font-black uppercase tracking-wide mb-1">Scan for Rider Info</div>
                <div className="text-[11px] font-medium opacity-90 leading-snug">Save contact instantly, copy payment number, and pay faster!</div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-card rounded-full p-3 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card rounded-full p-3 shadow-lg">
              <Zap className="h-6 w-6 text-secondary-foreground bg-secondary rounded-full p-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
