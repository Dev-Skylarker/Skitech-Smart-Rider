import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Copy, Phone, MessageCircle, Sparkles, MapPin,
  Check, ArrowRight, Share2, FileText, Flag, ShieldCheck,
  AlertTriangle, Shield, ChevronDown, ChevronUp, Building2, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { ReportRiderDialog } from "@/error-handling/dialogs";
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

function PublicQR() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [methods, setMethods] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(false);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block rounded-full bg-primary/10 p-5 mb-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">Loading rider profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center">
          <div className="inline-block rounded-full bg-primary/10 p-5 mb-4">
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success("Copied!");
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
  const getPaymentDisplay = (m: PM) => {
    if (m.method_type === "paybill") return `${m.paybill_number} · Acct: ${m.account_number}`;
    return m.account_number || m.account_name || "N/A";
  };

  const riderName = profile.display_name || profile.full_name || "Rider";
  const primaryPayment = methods.find((m) => m.is_primary) || methods[0];
  const trust = getTrustBadge(profile.trust_score ?? 0);
  const TrustIcon = trust.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Skitech Smart Rider"
              className="h-7 w-7 rounded-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            <span className="text-xs font-bold text-foreground hidden sm:block">Skitech Smart Rider</span>
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
        <div className="rounded-3xl border bg-card shadow-2xl overflow-hidden mb-4">
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
            <div className="flex flex-col items-center -mt-14 mb-4 relative z-10">
              <div className="h-24 w-24 rounded-full bg-card border-4 border-primary shadow-xl overflow-hidden flex-shrink-0">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={riderName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
                    <span className="text-4xl font-black">{riderName.charAt(0).toUpperCase()}</span>
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
              <div className="flex gap-2 mb-4 text-center text-xs">
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
              <p className="text-center text-xs text-muted-foreground mb-4 leading-relaxed italic">
                "{profile.bio}"
              </p>
            )}

            {/* Preferred Payment Details */}
            {methods.length > 0 && (
              <div className="mb-4">
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
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            {(primaryPayment.account_name || riderName) && (
                              <div className="font-bold text-foreground text-sm">
                                {primaryPayment.account_name || riderName}
                              </div>
                            )}
                            <div className="font-mono text-lg font-black text-foreground tracking-wider">
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
                              primaryPayment.id
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
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            {primaryPayment.label && (
                              <div className="font-bold text-foreground text-sm">{primaryPayment.label}</div>
                            )}
                            <div className="font-mono text-lg font-black text-foreground tracking-wider">
                              {primaryPayment.account_number || "N/A"}
                            </div>
                            {primaryPayment.account_name && (
                              <div className="text-xs text-muted-foreground">{primaryPayment.account_name}</div>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(primaryPayment.account_number || "", primaryPayment.id)}
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
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                {m.account_name && (
                                  <div className="text-sm font-bold text-foreground">{m.account_name}</div>
                                )}
                                <div className="font-mono text-base font-black text-foreground">
                                  {m.method_type === "paybill"
                                    ? `${m.paybill_number} · Acct: ${m.account_number}`
                                    : m.account_number || "N/A"}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(
                                  m.method_type === "paybill" ? `${m.paybill_number}` : m.account_number || "",
                                  m.id
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
                className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 text-foreground font-bold text-sm active:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Save Contact
              </button>

              {profile.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${profile.phone}`} className="flex-1">
                    <button className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                      <Phone className="h-4 w-4" /> Call
                    </button>
                  </a>
                  <a href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`} className="flex-1" target="_blank" rel="noreferrer">
                    <button className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>
                  </a>
                </div>
              )}

              {/* Share */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={() => navigator.share({ title: `Pay ${riderName}`, url: window.location.href })}
                  className="w-full rounded-xl border border-border bg-background/70 py-3 text-foreground font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="h-4 w-4" /> Share Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="rounded-xl border bg-card p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium">Verified rider on Skitech Smart Rider</span>
          </div>
        </div>

        {/* CTA for non-users */}
        {!user && (
          <div className="text-center mb-6">
            <p className="text-xs text-muted-foreground mb-3">Are you a rider too?</p>
            <Link to="/signup">
              <Button size="sm" className="w-full">Get your own QR profile</Button>
            </Link>
          </div>
        )}

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
    </div>
  );
}
