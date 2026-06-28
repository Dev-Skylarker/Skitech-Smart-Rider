import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const faqs = [
  ["Is my money handled by ScanTap?", "No. We never touch your money. Customers pay you directly on M-Pesa, Till, Paybill, or bank."],
  ["What if I change my number?", "Update it in your dashboard — the QR stays the same and customers always see your latest details."],
  ["Does the sticker last?", "Yes — it's weatherproof and designed to survive Kenyan roads."],
  ["Can I have more than one payment method?", "Yes. Add as many as you want and choose one as primary."],
  ["When will in-app payment launch?", "We're integrating Lipana soon. For now, customers copy and pay externally."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — ScanTap" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 md:px-8 py-16">
        <h1 className="text-4xl font-bold">Frequently asked questions</h1>
        <div className="mt-8 space-y-6">
          {faqs.map(([q, a], i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="font-semibold">{q}</div>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
