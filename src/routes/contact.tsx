import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ScanTap" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 md:px-8 py-16">
        <h1 className="text-4xl font-bold">Contact &amp; support</h1>
        <p className="mt-3 text-muted-foreground">We reply within 24 hours.</p>
        <div className="mt-8 space-y-3">
          <a href="mailto:support@scantap.co.ke" className="block rounded-xl border bg-card p-5 hover:border-primary">
            <div className="font-semibold">Email</div>
            <div className="text-sm text-muted-foreground">support@scantap.co.ke</div>
          </a>
          <a href="https://wa.me/254700000000" className="block rounded-xl border bg-card p-5 hover:border-primary">
            <div className="font-semibold">WhatsApp</div>
            <div className="text-sm text-muted-foreground">+254 700 000 000</div>
          </a>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
