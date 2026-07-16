import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Copy, Phone, MessageCircle, Sparkles, MapPin,
  Check, ArrowRight, ArrowLeft, Share2, FileText, Flag, ShieldCheck,
  AlertTriangle, Shield, ChevronDown, ChevronUp, Building2, Smartphone, QrCode, X
} from "lucide-react";
import { toast } from "sonner";
import { ReportRiderDialog } from "@/error-handling/dialogs";
import logoImg from "@/assets/logo.png";
import { QRCodeSVG } from "qrcode.react";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  route: string | null;
  city: string | null;
  photo_url: string | null;
  bio: string | null;
  status: string;
  trust_score: number;
};
type PM = {
  id: string;
  method_type: "send_money" | "till" | "paybill" | "bank" | "pochi_la_biashara" | "other" | "mpesa";
  label: string | null;
  account_name: string | null;
  account_number: string | null;
  paybill_number: string | null;
  is_primary: boolean;
};

export const Route = createFileRoute("/r/$slug")({ component: PublicQR });

function getTrustBadge(score: number) {
  if (score >= 3) return { label: "Verified Rider", icon: ShieldCheck, className: "trust-badge-verified", description: "This rider has been verified by Skitech Smart Rider" };
  if (score <= -3) return { label: "Flagged", icon: AlertTriangle, className: "trust-badge-flagged", description: "This rider has been flagged by admin" };
  return { label: "Neutral", icon: Shield, className: "trust-badge-neutral", description: "No special badge" };
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="h-5 w-24 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-6 w-24 bg-muted/60 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* Main profile card skeleton */}
        <div className="rounded-3xl border bg-card shadow-2xl overflow-hidden mb-4">
          {/* Hero banner skeleton */}
          <div className="h-28 bg-gradient-to-r from-muted/20 to-muted/10 relative" />

          <div className="px-6 pb-6">
            {/* Avatar skeleton */}
            <div className="flex flex-col items-center -mt-16 mb-6 relative z-10">
              <div className="h-32 w-32 rounded-full bg-card border-4 border-card shadow-xl overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-muted/40 shimmer-card animate-pulse" />
              </div>
              {/* Name skeleton */}
              <div className="h-7 w-40 bg-muted/50 rounded-lg mt-4 shimmer-card animate-pulse" />
              {/* Vehicle/Plate skeleton */}
              <div className="h-4 w-32 bg-muted/30 rounded-md mt-2 shimmer-card animate-pulse" />
              {/* Trust badge skeleton */}
              <div className="h-5 w-24 bg-muted/30 rounded-full mt-2.5 shimmer-card animate-pulse" />
            </div>

            {/* Route + city skeleton */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 h-12 rounded-xl bg-muted/20 border border-muted/10 shimmer-card animate-pulse" />
              <div className="flex-1 h-12 rounded-xl bg-muted/20 border border-muted/10 shimmer-card animate-pulse" />
            </div>

            {/* Bio skeleton */}
            <div className="h-3.5 w-4/5 mx-auto bg-muted/20 rounded-md mb-2.5 shimmer-card animate-pulse" />
            <div className="h-3.5 w-2/3 mx-auto bg-muted/20 rounded-md mb-6 shimmer-card animate-pulse" />

            {/* Preferred Payment details skeleton */}
            <div className="rounded-2xl border border-muted/20 bg-muted/5 p-4 mb-4 shimmer-card animate-pulse h-28 flex flex-col justify-between">
              <div className="h-4 w-32 bg-muted/40 rounded-md" />
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted/30 rounded-md mb-2" />
                  <div className="h-6 w-36 bg-muted/40 rounded-md" />
                </div>
                <div className="h-10 w-10 bg-muted/30 rounded-xl" />
              </div>
            </div>

            {/* Action buttons skeletons */}
            <div className="flex flex-col gap-2">
              <div className="w-full h-12 bg-muted/30 rounded-xl shimmer-card animate-pulse" />
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-muted/20 rounded-xl shimmer-card animate-pulse" />
                <div className="flex-1 h-12 bg-muted/20 rounded-xl shimmer-card animate-pulse" />
              </div>
              <div className="w-full h-12 bg-muted/20 rounded-xl shimmer-card animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom badge skeleton */}
        <div className="h-12 bg-muted/10 border rounded-xl shimmer-card animate-pulse mb-4" />
      </div>
    </div>
  );
}

function PublicQR() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [methods, setMethods] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [copiedMethod, setCopiedMethod] = useState<PM | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    (async () => {
      // Query by qr_slug only — never expose profile UUID in URL
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, phone, vehicle_type, plate_number, route, city, photo_url, bio, status, trust_score")
        .eq("qr_slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (p) {
        setProfile(p as Profile);
        const { data: pms } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("profile_id", p.id)
          .order("is_primary", { ascending: false });
        setMethods((pms as PM[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center">
          <div className="inline-block rounded-full bg-primary/10 p-5 mb-4 animate-scale-in">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-foreground">QR not active</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            This QR code isn't linked to an active rider profile yet.
          </p>
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 w-full">Go to Dashboard <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          ) : (
            <Link to="/">
              <Button size="lg" className="gap-2 w-full">Get your own QR <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, method: PM) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(method.id);
      setCopiedMethod(method);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => toast.error("Copy failed"));
  };

  const createVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.display_name || profile.full_name}\nTEL:${profile.phone || ""}\nNOTE:${profile.vehicle_type} • ${profile.plate_number} • ${profile.route}\nURL:${typeof window !== "undefined" ? window.location.href : ""}\nEND:VCARD`;
    const el = document.createElement("a");
    el.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(vcard)}`);
    el.setAttribute("download", `${profile.display_name || "rider"}.vcf`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    toast.success("Contact saved!");
  };

  const methodTypeLabel = (m: PM) => {
    if (m.method_type === "other") return m.label || "Other";
    return {
      mpesa: "M-Pesa",
      send_money: "Send Money",
      till: "Till",
      paybill: "Paybill",
      bank: "Bank",
      pochi_la_biashara: "Pochi La Biashara"
    }[m.method_type] || m.method_type;
  };

  const riderName = profile.display_name || profile.full_name || "Rider";
  const primaryPayment = methods.find((m) => m.is_primary) || methods[0];
  const trust = getTrustBadge(profile.trust_score ?? 0);
  const TrustIcon = trust.icon;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 transition-colors hover:opacity-80">
            {user?.id === profile.id ? (
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </div>
            ) : (
              <>
                <img
                  src={logoImg}
                  alt="Skitech Smart Rider"
                  className="h-7 w-7 rounded-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <span className="text-xs font-bold text-foreground">RIDER PROFILE</span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-2">
            {/* Trust badge */}
            {profile.trust_score !== 0 && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trust.className}`}>
                <TrustIcon className="h-3 w-3" />
                {trust.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Main profile card */}
        <div className="rounded-3xl border bg-card shadow-2xl overflow-hidden mb-4 animate-scale-in">
          {/* Hero banner */}
          <div className="relative h-28 bg-gradient-to-r from-primary to-secondary overflow-hidden flex-shrink-0">
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 112" preserveAspectRatio="none">
              <path d="M0,56 Q100,20 200,56 T400,56 L400,112 L0,112 Z" fill="white" />
            </svg>
            {/* Report button */}
            <button
              onClick={() => setShowReport(true)}
              className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white text-xs rounded-lg px-2.5 py-1.5 transition-colors"
              aria-label="Report this rider"
            >
              <Flag className="h-3 w-3" />
              Report
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center -mt-16 mb-4 relative z-10">
              <div className="h-32 w-32 rounded-full bg-card border-4 border-primary shadow-xl overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-105">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={riderName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
                    <span className="text-5xl font-black">{riderName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-black text-center text-foreground">{riderName}</h1>
              {profile.vehicle_type && (
                <p className="text-xs text-muted-foreground font-medium mt-1 text-center">
                  {profile.vehicle_type} •{" "}
                  <span className="text-primary font-bold">{profile.plate_number}</span>
                </p>
              )}
              {/* Trust badge display (non-neutral) */}
              {profile.trust_score !== 0 && (
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${trust.className}`}>
                  <TrustIcon className="h-3 w-3" />
                  {trust.label}
                </div>
              )}
            </div>

            {/* Route + city */}
            {(profile.route || profile.city) && (
              <div className="flex gap-2 mb-5 text-center text-xs">
                {profile.route && (
                  <div className="flex-1 rounded-xl bg-primary/8 border border-primary/15 py-2.5 px-3">
                    <div className="text-muted-foreground font-medium mb-0.5">Route</div>
                    <div className="font-bold text-foreground">{profile.route}</div>
                  </div>
                )}
                {profile.city && (
                  <div className="flex-1 rounded-xl bg-accent/10 border border-accent/20 py-2.5 px-3">
                    <div className="text-muted-foreground font-medium mb-0.5">City</div>
                    <div className="font-bold text-foreground">{profile.city}</div>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-center text-xs text-muted-foreground mb-5 leading-relaxed italic">
                "{profile.bio}"
              </p>
            )}

            {/* Preferred Payment Details */}
            {methods.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Preferred Payment Details</div>

                {primaryPayment && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-3">
                    {/* Method type label */}
                    <div className="flex items-center gap-2 mb-3">
                      {primaryPayment.method_type === "bank" ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        Preferred: {methodTypeLabel(primaryPayment)}
                        {primaryPayment.label ? ` · ${primaryPayment.label}` : ""}
                      </span>
                    </div>

                    {/* Send money / mobile money */}
                    {primaryPayment.method_type !== "bank" && (
                      <div className="mb-2">
                        <div className="text-xs text-muted-foreground font-medium mb-0.5">
                          {primaryPayment.method_type === "send_money" ? "Send Money Number" :
                           primaryPayment.method_type === "till" ? "Till Number" :
                           primaryPayment.method_type === "paybill" ? "Paybill Number" :
                           primaryPayment.method_type === "pochi_la_biashara" ? "Pochi La Biashara" : "Number"}
                        </div>
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            {(primaryPayment.account_name || riderName) && (
                              <div className="font-bold text-foreground text-sm truncate">
                                {primaryPayment.account_name || riderName}
                              </div>
                            )}
                            <div className={`font-mono font-black text-foreground tracking-wider truncate ${
                              (primaryPayment.account_number || "").length > 15 ? "text-sm" : "text-lg"
                            }`}>
                              {primaryPayment.method_type === "paybill"
                                ? `${primaryPayment.paybill_number} · Acct: ${primaryPayment.account_number}`
                                : primaryPayment.account_number || "N/A"}
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(
                              primaryPayment.method_type === "paybill"
                                ? `${primaryPayment.paybill_number}`
                                : primaryPayment.account_number || "",
                              primaryPayment
                            )}
                            className="flex-shrink-0 rounded-xl bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform shadow-md"
                            aria-label="Copy number"
                          >
                            {copied === primaryPayment.id
                              ? <Check className="h-5 w-5" />
                              : <Copy className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bank account */}
                    {primaryPayment.method_type === "bank" && (
                      <div className="mb-2">
                        <div className="text-xs text-muted-foreground font-medium mb-0.5">Bank Name · Account No.</div>
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            {primaryPayment.label && (
                              <div className="font-bold text-foreground text-sm truncate">{primaryPayment.label}</div>
                            )}
                            <div className="font-mono text-lg font-black text-foreground tracking-wider truncate">
                              {primaryPayment.account_number || "N/A"}
                            </div>
                            {primaryPayment.account_name && (
                              <div className="text-xs text-muted-foreground truncate">{primaryPayment.account_name}</div>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(primaryPayment.account_number || "", primaryPayment)}
                            className="flex-shrink-0 rounded-xl bg-primary text-primary-foreground p-2.5 active:scale-95 transition-transform shadow-md"
                            aria-label="Copy account number"
                          >
                            {copied === primaryPayment.id
                              ? <Check className="h-5 w-5" />
                              : <Copy className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Other payment methods – collapsible */}
                {methods.length > 1 && (
                  <div className="mb-2">
                    <button
                      onClick={() => setShowOtherMethods((prev) => !prev)}
                      className="w-full rounded-xl border border-border bg-background/70 py-2.5 px-4 text-sm font-bold text-foreground flex items-center justify-between active:bg-primary/5 transition-colors"
                    >
                      <span>See other payment methods</span>
                      {showOtherMethods ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showOtherMethods && (
                      <div className="mt-2 flex flex-col gap-2">
                        {methods.slice(1).map((m) => (
                          <div
                            key={m.id}
                            className="rounded-xl border border-border bg-background/70 p-3"
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {m.method_type === "bank"
                                ? <Building2 className="h-3.5 w-3.5 text-primary" />
                                : <Smartphone className="h-3.5 w-3.5 text-primary" />}
                              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                                {methodTypeLabel(m)}{m.label ? ` · ${m.label}` : ""}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 min-w-0 mt-1">
                              <div className="min-w-0 flex-1">
                                {m.account_name && (
                                  <div className="text-sm font-bold text-foreground truncate">{m.account_name}</div>
                                )}
                                <div className={`font-mono font-black text-foreground truncate ${
                                  (m.account_number || "").length > 15 ? "text-sm" : "text-base"
                                }`}>
                                  {m.method_type === "paybill"
                                    ? `${m.paybill_number} · Acct: ${m.account_number}`
                                    : m.account_number || "N/A"}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(
                                  m.method_type === "paybill" ? `${m.paybill_number}` : m.account_number || "",
                                  m
                                )}
                                className="flex-shrink-0 rounded-lg border border-primary/30 bg-primary/10 text-primary p-2 active:scale-95 transition-transform"
                                aria-label="Copy number"
                              >
                                {copied === m.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={createVCard}
                className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 text-foreground font-bold text-sm active:bg-primary/10 transition-colors flex items-center justify-center gap-2 hover:scale-[1.02] duration-300"
              >
                <FileText className="h-4 w-4 text-primary" />
                Save Contact
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 text-foreground font-bold text-sm active:bg-primary/10 transition-colors flex items-center justify-center gap-2 hover:scale-[1.02] duration-300"
              >
                <QrCode className="h-4 w-4 text-primary" />
                Show Rider QR Code
              </button>

              {profile.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${profile.phone}`} className="flex-1">
                    <button className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 hover:scale-[1.02] duration-300">
                      <Phone className="h-4 w-4 text-primary" /> Call
                    </button>
                  </a>
                  <a href={`https://wa.me/${profile.phone.replace(/^0/, '254').replace(/\D/g, "")}`} className="flex-1" target="_blank" rel="noreferrer">
                    <button className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 hover:scale-[1.02] duration-300">
                      <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp
                    </button>
                  </a>
                </div>
              )}

              {/* Share */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={() => navigator.share({ title: `Pay ${riderName}`, url: window.location.href })}
                  className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm transition-colors flex items-center justify-center gap-1.5 hover:scale-[1.02] duration-300"
                >
                  <Share2 className="h-4 w-4 text-primary" /> Share Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8 animate-scale-in">
          <div className="rounded-xl border bg-card p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium">Verified rider on Skitech Smart Rider</span>
          </div>
        </div>

        {/* CTA for all users */}
        <div className="text-center mb-8 border-t border-border/50 pt-8 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4 font-medium">
            Are you a rider or want to join the wave?
          </p>
          <Link to="/">
            <Button size="default" variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 font-bold h-11">
              Click here to get started
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Support
          </Link>
          {" · "}
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms
          </Link>
        </div>
      </div>

      {/* Report Rider Dialog */}
      <ReportRiderDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        riderName={riderName}
        riderPlate={profile.plate_number || "N/A"}
        riderPhone={profile.phone || "N/A"}
      />

      {/* Copy Confirmation Modal */}
      {copiedMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setCopiedMethod(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl overflow-hidden animate-scale-in-bounce">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-green-500" />
            
            <div className="text-center mt-2 mb-6">
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
              <h2 className="text-xl font-black text-foreground">Copied to Clipboard!</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {methodTypeLabel(copiedMethod)} details are ready to paste.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 border p-4 mb-6 text-center">
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
                {copiedMethod.method_type === "paybill" ? "Paybill & Account" : "Payment Number"}
              </div>
              <div className="font-mono text-2xl font-black text-primary tracking-widest break-all">
                {copiedMethod.method_type === "paybill"
                  ? `${copiedMethod.paybill_number}`
                  : copiedMethod.account_number}
              </div>
              {copiedMethod.method_type === "paybill" && (
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  Account: {copiedMethod.account_number}
                </div>
              )}
              <div className="text-xs text-foreground font-semibold mt-2 truncate">
                {copiedMethod.account_name || riderName}
              </div>
            </div>

            <div className="space-y-3 mb-6 text-left">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Next steps:</h3>
              <div className="flex items-start gap-3 text-xs leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span className="text-muted-foreground">Open your mobile wallet app (M-Pesa, Airtel Money) or dial your USSD code.</span>
              </div>
              <div className="flex items-start gap-3 text-xs leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span className="text-muted-foreground">Paste the copied number into the payment recipient field.</span>
              </div>
              <div className="flex items-start gap-3 text-xs leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span className="text-muted-foreground">Enter the amount, verify the name matches, and enter your PIN to pay.</span>
              </div>
            </div>

            <Button className="w-full h-11 font-bold text-sm" onClick={() => setCopiedMethod(null)}>
              Okay, Got It
            </Button>
          </div>
        </div>
      )}

      {/* Show QR Dialog */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowQrModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl text-center overflow-hidden animate-scale-in-bounce">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <h2 className="text-lg font-black text-foreground mb-1 mt-2">Rider QR Code</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Let customers scan this screen to view your profile and pay.
            </p>

            <div className="mx-auto w-64 aspect-square rounded-2xl bg-white border p-4 shadow-xl flex items-center justify-center mb-6">
              <QRCodeSVG
                value={typeof window !== "undefined" ? window.location.href : ""}
                size={220}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="H"
              />
            </div>

            <div className="text-xs text-primary font-bold bg-primary/5 border border-primary/15 rounded-xl py-2.5 px-3">
              {riderName} • {profile.plate_number || "No Plate"}
            </div>
            </div>
          </div>
        )}
    </div>
  );
}


