import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — Skitech Smart Rider" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 md:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">How it works</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A simple, secure, and hassle-free way to share your payment information with customers.
          </p>
        </div>

        <ol className="space-y-6">
          {[
            {
              title: "Create your free account",
              desc: "Sign up securely in seconds. The platform is optimized for speed and easy access, even on low-bandwidth mobile connections.",
            },
            {
              title: "Set up your digital identity",
              desc: "Add your name, photo, business or route details, and your receiving payment numbers (M-Pesa, Till, Pochi, or Bank).",
            },
            {
              title: "Activate your profile",
              desc: "Pay a single, one-time KES 100 registration fee to instantly unlock your dashboard and generate your permanent Smart QR code.",
            },
            {
              title: "Share your Smart QR",
              desc: "Download the QR to your phone, share your custom profile link online, or print it to display clearly on your bike or storefront.",
            },
            {
              title: "Connect & transact faster",
              desc: "Customers scan your QR to instantly save your contact (vCard) and one-tap copy your payment details. They pay you directly from their own app. Zero platform fees, no typing errors.",
            },
          ].map((item, i) => (
            <li
              key={i}
              className="flex gap-5 border bg-card p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 cursor-default"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-black text-lg">
                {i + 1}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link to="/signup">
            <Button size="lg" className="h-12 px-8 font-bold hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              Start now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
