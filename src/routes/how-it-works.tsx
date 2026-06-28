import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — ScanTap" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 md:px-8 py-16">
        <h1 className="text-4xl font-bold">How it works</h1>
        <ol className="mt-8 space-y-6">
          {[
            ["Sign up free", "Create your rider account with email and password."],
            ["Build your profile", "Add your photo, name, plate, route, and your M-Pesa / Till / Paybill."],
            ["Order your QR sticker", "Pay a one-time fee to receive a printed, weatherproof sticker."],
            ["We activate your QR", "Once payment is confirmed, your QR goes live and your public profile is online."],
            ["Get paid", "Customers scan the sticker, copy your number in one tap, pay you directly."],
          ].map(([t, b], i) => (
            <li key={i} className="flex gap-4">
              <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-black">{i + 1}</div>
              <div>
                <div className="font-semibold">{t}</div>
                <p className="text-muted-foreground text-sm mt-1">{b}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10"><Link to="/signup"><Button size="lg">Start now</Button></Link></div>
      </div>
      <SiteFooter />
    </div>
  ),
});
