import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Mail, MessageSquare, ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "Do my customers need to download a special app to scan or pay?",
    a: "No. Customers simply use their phone's standard camera to scan your Smart QR. It opens your digital profile instantly in their mobile web browser. From there, they use their existing, trusted M-Pesa or banking app to complete the payment."
  },
  {
    q: "Is my money handled by Skitech Smart Rider?",
    a: "No. We never touch your money. The platform acts as your permanent digital identity, securely displaying your payment details. Customers one-tap copy your M-Pesa or Till number and pay you directly."
  },
  {
    q: "How does the \"Save Contact\" feature work?",
    a: "When a customer taps \"Save Contact\" on your profile, it instantly downloads a digital contact card (vCard) directly to their phonebook. This means they always have your verified business name and number saved for their next trip or purchase, without you ever needing to shout your number over street noise."
  },
  {
    q: "What happens if I change my payment information or business details?",
    a: "You can update your details instantly from your dashboard. Whether you switch your Till number, change your motorbike plate, or update your shop name, your permanent Smart QR code stays exactly the same. No reprinting needed—customers scanning the code will always see your latest details."
  },
  {
    q: "I run a shop/salon/mama mboga stall. Can I use this instead of a rider?",
    a: "Absolutely! While we launched with riders, Skitech Smart Rider is built for any everyday business. You can customize your profile to display your shop name, service list, location, and multiple Till or Paybill numbers."
  },
  {
    q: "How does this protect me from M-Pesa mistakes or fraud?",
    a: "By using our \"One-Tap Copy\" feature, customers copy your exact M-Pesa or Till number directly to their clipboard. This completely eliminates the risk of them mistyping a digit and sending your money to the wrong person. The final transaction remains entirely protected by Safaricom's bank-grade M-Pesa security."
  },
  {
    q: "What if I lose my phone or change my bike?",
    a: "Your digital profile is safely stored in the cloud. Simply log into your Skitech Smart Rider account from any new device to manage your profile. If you change bikes, just update your vehicle details in the dashboard—your existing QR code will automatically point to the updated information."
  },
  {
    q: "How do I get the physical QR code?",
    a: "Once you activate your profile for KES 100, you can download a high-resolution version of your Smart QR from your dashboard. You can share it as an image on WhatsApp, display it on your screen, or print it out at any local cyber cafe as a sticker for your bike or shop counter."
  }
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Skitech Smart Rider" }] }),
  component: FAQPage
});

function FAQPage() {
  const [search, setSearch] = useState("");

  const filtered = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-3xl w-full px-6 md:px-8 py-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-foreground mb-4">Frequently asked questions</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Find answers to common questions about Skitech Smart Rider setup, security, and usage.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border rounded-xl focus-visible:ring-primary"
          />
        </div>

        {/* FAQs List */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-350"
              >
                <h3 className="font-bold text-base sm:text-lg text-foreground flex gap-2 items-start">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  {item.q}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed pl-7">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-muted/10 border border-dashed rounded-3xl p-8 max-w-lg mx-auto animate-scale-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No matching questions found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              We couldn't find any FAQ matching "{search}". Have a question that isn't listed here? Send us a question or message!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="w-full gap-2 font-bold hover:scale-[1.02] transition-all duration-300">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
              <a href="mailto:info.skitechsolutions@gmail.com?subject=Skitech%20Smart%20Rider%20FAQ%20Inquiry&body=Hello%20Skitech%20Support%2C%0A%0AI%20have%20a%20question%20regarding%3A%20" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2 font-bold hover:scale-[1.02] transition-all duration-300">
                  Ask a Question
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Still Have Questions CTA */}
        <div className="mt-16 rounded-3xl border bg-card p-8 text-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5 -z-10" />
          <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">Still have questions?</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
            If you couldn't find the answers in our FAQ, please get in touch with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact">
              <Button className="w-full sm:w-auto gap-2 font-bold hover:scale-[1.02] transition-all duration-300">
                <Mail className="h-4 w-4" />
                Contact Support Page
              </Button>
            </Link>
            <a href="mailto:info.skitechsolutions@gmail.com?subject=Skitech%20Smart%20Rider%20Support&body=Hello%20Skitech%20Support%2C%0A%0AI%20need%20assistance%20with%3A%20">
              <Button variant="outline" className="w-full sm:w-auto gap-2 font-bold hover:scale-[1.02] transition-all duration-300">
                Email Support Directly
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
