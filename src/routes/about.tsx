import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Skitech Smart Rider" },
      {
        name: "description",
        content: "Skitech Smart Rider is built in Kenya for Kenyan riders. Our mission: digital identity tools that help service workers connect directly with clients.",
      },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 md:px-8 py-16">
        <h1 className="text-4xl font-bold text-foreground">About Skitech Smart Rider</h1>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          Skitech Smart Rider is built in Kenya, for Kenyan riders. Every day boda riders move millions of people across Nairobi, Mombasa, Kisumu and beyond — but getting paid still means shouting numbers, mistyped digits, and lost trips.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We make a small, durable QR sticker that lives on your bike. It points to a profile that you control. Customers scan, copy your number in one tap, and pay you on whichever wallet you already use.
        </p>
        
        <h2 className="mt-10 text-2xl font-bold text-foreground">Our vision</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed mb-8">
          Tomorrow, Skitech Smart Rider will accept payments inside the app — receipts, history, and (eventually) loans built around your real earnings. We'll also expand to mama-mboga, mechanics, salons, and any service worker who needs a simple, direct way to connect with customers and share payment details.
        </p>

        <div className="border-t pt-6 mt-8">
          <p className="text-sm text-muted-foreground">
            Skitech Smart Rider is a product of{" "}
            <a
              href="https://skitechsolutions.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Skitech Solutions
            </a>.
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
