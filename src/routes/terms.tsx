import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Shield, CreditCard, AlertTriangle, FileText, Scale, Lock } from "lucide-react";

export const Route = createFileRoute("/terms")({ component: TermsPage });

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: [
      "By creating an account or using Skitech Smart Rider (\"the Platform\"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use the Platform.",
      "These terms apply to all users including riders, administrators, and members of the public accessing rider profile pages.",
      "We reserve the right to update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    icon: Lock,
    title: "2. Data Usage & Privacy",
    content: [
      "We collect the following personal data: full name, email address, phone number, vehicle plate number, route information, and payment method details. This data is used solely to operate and improve the Platform.",
      "Your profile data (name, vehicle, route, payment methods) is made publicly accessible via your unique QR scan link when your profile is active. This is the core service functionality you consent to when creating a profile.",
      "We do not sell, rent, or share your personal data with third parties for marketing purposes.",
      "We use Supabase (a third-party database provider) to store your data securely. All data is protected by Row Level Security (RLS) policies ensuring only authorised parties can access your records.",
      "You have the right to request deletion of your account and all associated data by contacting our support team.",
      "Rider reports submitted by the public are handled by our moderation team and processed through EmailJS. The identity of reporters is kept anonymous.",
    ],
  },
  {
    icon: CreditCard,
    title: "3. Payment Handling",
    content: [
      "Profile Activation Fee: A one-time fee of KES 100 is charged to activate your public rider profile. This fee is non-refundable once your profile has been activated.",
      "QR Sticker Orders: Physical QR sticker purchases are a separate transaction and pricing will be displayed at checkout. All sticker orders are subject to production and delivery timelines.",
      "Skitech Smart Rider does NOT process payments on behalf of riders. The Platform only facilitates the display of your M-Pesa, Till, Paybill, or bank account details. All payment transactions happen directly between the rider and their customers.",
      "We take no commission on any payments made to riders by their customers.",
      "Payment processing for profile activation fees is handled by approved third-party payment processors. Payment data is not stored on our servers.",
      "In the event of a failed payment, your profile will remain in 'pending' status until payment is confirmed by an administrator.",
    ],
  },
  {
    icon: Shield,
    title: "4. Account & Profile Responsibilities",
    content: [
      "You are responsible for maintaining the security of your account credentials. Do not share your password with anyone.",
      "You must provide accurate and truthful information when creating your profile. Providing false vehicle registration details or impersonating another rider is strictly prohibited.",
      "Your account is for personal use only. You may not create profiles on behalf of other riders without their explicit consent.",
      "Profiles found to contain false, misleading, or fraudulent information will be suspended without notice and may be reported to relevant authorities.",
      "You are responsible for keeping your payment method details up to date. Skitech Smart Rider is not liable for missed payments due to outdated information.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. Warnings & Prohibited Conduct",
    content: [
      "You must not use the Platform to engage in fraud, harassment, or any illegal activity.",
      "Attempting to access another user's account, manipulate QR codes, or bypass security measures is a criminal offence and will be prosecuted.",
      "Posting inappropriate, defamatory, or harmful content in your profile bio or any user-submitted field is prohibited.",
      "Public rider reports must be submitted in good faith. Submitting false reports or using the reporting system to harass riders may result in legal action.",
      "We reserve the right to flag, suspend, or permanently ban any account found in violation of these terms without prior notice.",
      "Scraping, automated data extraction, or reverse-engineering of the Platform is strictly prohibited.",
    ],
  },
  {
    icon: Scale,
    title: "6. Liabilities & Disclaimers",
    content: [
      "Skitech Smart Rider provides the Platform \"as is\" without warranties of any kind, express or implied. We do not guarantee uninterrupted access or error-free operation.",
      "We are not responsible for payment disputes, losses, or damages arising from transactions conducted between riders and their customers through information displayed on the Platform.",
      "We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including lost profits or business interruption.",
      "Skitech Smart Rider's total liability to you for any claim arising from use of the Platform shall not exceed the total amount you have paid to us in the 12 months preceding the claim.",
      "We are not responsible for the accuracy of rider information as entered by users. We provide a verification/trust scoring system to help users make informed decisions, but this does not constitute a guarantee.",
      "The trust score displayed on rider profiles reflects administrative assessment only and does not constitute a legal endorsement or certification of any rider.",
    ],
  },
  {
    icon: FileText,
    title: "7. Intellectual Property",
    content: [
      "All content, trademarks, logos, and branding on the Platform are the property of Skitech Smart Rider. You may not copy, reproduce, or distribute any materials without written permission.",
      "By uploading a profile photo, you grant us a non-exclusive, worldwide, royalty-free license to display that image within the Platform.",
    ],
  },
  {
    icon: Scale,
    title: "8. Governing Law",
    content: [
      "These Terms & Conditions are governed by the laws of the Republic of Kenya. Any disputes arising from your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Kenya.",
      "For any questions or concerns regarding these terms, please contact us through our official support channels.",
    ],
  },
];

function TermsPage() {
  const lastUpdated = "June 28, 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-16 border-b">
          <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Please read these terms carefully before using Skitech Smart Rider. By creating an account or
              using our platform, you agree to the following terms.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Last updated: {lastUpdated}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-4xl px-4 md:px-8 py-12 space-y-8">
          {sections.map((section, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-card shadow-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3 p-6 border-b bg-muted/20">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              </div>
              <div className="p-6 space-y-3">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Questions about these terms?</h3>
            <p className="opacity-90 text-sm mb-4">
              Contact our support team and we'll be happy to clarify anything.
            </p>
            <a
              href="mailto:support@skitech.co.ke"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              support@skitech.co.ke
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
