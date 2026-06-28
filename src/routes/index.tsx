import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, Wallet, ShieldCheck, Users, Zap, TrendingUp, Clock, CircleCheck as CheckCircle2, ArrowRight, MapPin, Phone, CreditCard, Truck, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav({ to: "/dashboard", replace: true });
    }
  }, [user, loading, nav]);

  if (loading || user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ transform: 'translate(-30%, 30%)', animationDelay: '1s' }} />
        </div>

        <div className="mx-auto max-w-5xl px-6 md:px-8 pt-20 pb-20 md:pt-0 md:pb-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium mb-6 animate-[fadeIn_0.5s_ease-out]">
                <Zap className="h-4 w-4 text-primary" />
                <span>Built for Kenyan riders</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6">
                One scan.
                <br />
                <span className="text-primary">Instant payment.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                Your permanent QR sticker links customers directly to your payment profile. They scan, copy your M-Pesa or Till number, and pay. Zero commissions. No card readers. Your money goes straight to your wallet.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to="/signup">
                  <Button size="lg" className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-shadow">
                    Get your QR sticker
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="text-base h-12 px-8">
                    See how it works
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Riders</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">0%</div>
                  <div className="text-sm text-muted-foreground">Commission</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </div>

            {/* Right Content - Sticker Visual */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl scale-110 animate-pulse" />

                {/* Main sticker card */}
                <div className="relative w-[320px] sm:w-[380px] aspect-square rounded-3xl bg-gradient-to-br from-primary to-primary/90 p-6 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  {/* Decorative waves */}
                  <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 380 380" preserveAspectRatio="none">
                    <path d="M0,280 C120,220 240,320 380,250 L380,380 L0,380 Z" fill="var(--secondary)" />
                    <path d="M0,310 C130,260 260,330 380,290 L380,380 L0,380 Z" fill="var(--secondary)" opacity="0.7" />
                  </svg>

                  {/* Header */}
                  <div className="relative flex items-center justify-between text-primary-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-full object-cover shadow-sm bg-white" />
                      <div className="leading-none">
                        <div className="font-black tracking-tight text-xl text-black">Skitech</div>
                        <div className="font-medium text-sm text-white opacity-90 tracking-wide">Smart Rider</div>
                      </div>
                    </div>
                  </div>

                  {/* QR Area */}
                  <div className="relative rounded-2xl bg-white p-4 shadow-lg mb-4">
                    <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-muted/50 to-muted grid place-items-center">
                      <QrCode className="h-28 w-28 sm:h-32 sm:w-32 text-foreground/80" />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="relative text-center text-primary-foreground mt-4 px-2">
                    <div className="text-sm font-black uppercase tracking-wide mb-1">Scan for Rider Info</div>
                    <div className="text-[11px] font-medium opacity-90 leading-snug">Save contact instantly, copy payment number, and pay faster!</div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-card rounded-full p-3 shadow-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-card rounded-full p-3 shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>
                  <Zap className="h-6 w-6 text-secondary-foreground bg-secondary rounded-full p-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-t border-b bg-muted/30 py-12">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div className="font-semibold">Bank-grade security</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              <div className="font-semibold">Setup in 2 minutes</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <div className="font-semibold">M-Pesa ready</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div className="font-semibold">No monthly fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 md:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Simple 3-step process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Getting started is easy
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From sign-up to your first payment in under 5 minutes. No complicated setups.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mx-auto">
          {[
            {
              step: "01",
              icon: Users,
              title: "Create your profile",
              description: "Sign up and add your name, phone, plate number, and route. Takes just 2 minutes.",
            },
            {
              step: "02",
              icon: QrCode,
              title: "Get your QR sticker",
              description: "Order your weatherproof QR sticker. One-time payment of KES 500. We deliver anywhere in Kenya.",
            },
            {
              step: "03",
              icon: Wallet,
              title: "Start getting paid",
              description: "Stick it on your bike. Customers scan, copy your number, and pay you directly. Zero commission.",
            },
          ].map((item, i) => (
            <div key={i} className="relative group">
              <div className="rounded-2xl border bg-card p-8 h-full transition-all hover:shadow-xl hover:border-primary/50">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-lg">
                  {item.step}
                </div>
                <div className="flex flex-col items-center text-center">
                  <item.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/20 py-20">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to get paid
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up for boda riders, by people who understand your daily hustle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto">
            {[
              {
                icon: QrCode,
                title: "Permanent QR Code",
                description: "Your QR stays the same forever. Update your details anytime — no reprinting needed.",
                color: "bg-primary/10",
              },
              {
                icon: Smartphone,
                title: "One-Tap Copy",
                description: "Customers scan and copy your M-Pesa number in a single tap. No typing, no errors.",
                color: "bg-secondary/10",
              },
              {
                icon: Wallet,
                title: "Zero Commission",
                description: "We never touch your money. Every shilling goes directly to your M-Pesa or bank account.",
                color: "bg-primary/10",
              },
              {
                icon: MapPin,
                title: "Route Display",
                description: "Show your regular routes so customers know you're the right rider for their journey.",
                color: "bg-secondary/10",
              },
              {
                icon: ShieldCheck,
                title: "Verified Profiles",
                description: "Photo, plate number, and route help customers trust it's really you.",
                color: "bg-primary/10",
              },
              {
                icon: Truck,
                title: "Weatherproof Sticker",
                description: "Built to survive Kenyan roads, rain, and sun. Durable quality that lasts.",
                color: "bg-secondary/10",
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/Social Proof */}
      <section className="mx-auto max-w-5xl px-6 md:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span>Loved by riders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Join hundreds of riders who've simplified getting paid
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              No more shouting numbers or dealing with mistyped digits. Just a simple scan and your customer has your payment details instantly.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Works with M-Pesa, Till, Paybill, and bank accounts",
                "Instant setup — be ready in under 5 minutes",
                "Weatherproof sticker delivered to your location",
                "Update your details anytime from your dashboard",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/signup">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                Get started for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border bg-card p-8 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center text-xl font-bold">
                  JM
                </div>
                <div>
                  <div className="font-bold text-lg">John Mwangi</div>
                </div>
              </div>
              <p className="text-lg leading-relaxed mb-6">
                "Before ScanTap, I'd waste so much time repeating my number to customers. Now they just scan and pay. My earnings have gone up because I'm not losing customers to typing errors. Best KES 500 I ever spent."
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/20 py-20">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One-time payment. No hidden fees. No commissions on your earnings.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-3xl border bg-card p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-black px-4 py-2 rounded-bl-2xl tracking-wide">
                100 SK
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Smart Rider Sticker</h3>
                <div className="text-5xl font-black text-primary mb-2">KES 500</div>
                <p className="text-muted-foreground">One-time payment · No monthly fees</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Weatherproof QR sticker delivered to you",
                  "Permanent public profile page",
                  "Update your details anytime — no reprinting",
                  "Delivery anywhere in Kenya",
                  "M-Pesa / Send Money / Till / Paybill / Bank",
                  "Multiple payment methods supported",
                  "Zero commission forever",
                  "Save contact (vCard) button for customers",
                  "QR code on your dashboard to share",
                  "Edit payment info anytime from dashboard",
                  "Verified rider badge",
                  "Route & city display for customer trust",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button className="w-full" size="lg">
                  Get your QR sticker now
                </Button>
              </Link>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Create your free account, then order when ready
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-5xl px-6 md:px-8 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-10 md:p-16 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Ready to simplify getting paid?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join hundreds of riders who've already made the switch. Create your free account in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-base px-8">
                Create free account
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="outline" className="text-base px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
