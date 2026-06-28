import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — ScanTap" }, { name: "description", content: "ScanTap is built in Kenya for Kenyan riders. Our mission: fair tools that help service workers earn directly." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 md:px-8 py-16">
        <h1 className="text-4xl font-bold">About ScanTap</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          ScanTap is built in Kenya, for Kenyan riders. Every day boda riders move millions of people across Nairobi, Mombasa, Kisumu and beyond — but getting paid still means shouting numbers, mistyped digits, and lost trips.
        </p>
        <p className="mt-4 text-muted-foreground">
          We make a small, durable QR sticker that lives on your bike. It points to a profile that you control. Customers scan, copy your number in one tap, and pay you on whichever wallet you already use.
        </p>
        <h2 className="mt-10 text-2xl font-bold">Our vision</h2>
        <p className="mt-3 text-muted-foreground">
          Tomorrow, ScanTap will accept payments inside the app — receipts, history, and (eventually) loans built around your real earnings. We'll also expand to mama-mboga, mechanics, salons, and any service worker who needs a fair, no-commission way to get paid.
        </p>
      </div>
      <SiteFooter />
    </div>
  ),
});
