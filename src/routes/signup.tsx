import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DuplicateEmailDialog } from "@/error-handling/dialogs";
import { AppDialog } from "@/components/ui/AppDialog";
import { Eye, EyeOff, ArrowRight, UserPlus, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: Signup });

const schema = z
  .object({
    firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(40),
    surname: z.string().trim().min(2, "Surname must be at least 2 characters").max(40),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to continue" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateEmailDialog, setDuplicateEmailDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const fullName = `${form.firstName.trim()} ${form.surname.trim()}`;

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          first_name: form.firstName.trim(),
          surname: form.surname.trim(),
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      if (
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already exists") ||
        error.message?.toLowerCase().includes("user already")
      ) {
        setDuplicateEmailDialog(true);
      } else {
        toast.error(error.message || "Signup failed. Please try again.");
      }
      return;
    }

    if (data?.user) {
      if (data.session) {
        toast.success("Account created! Welcome to Skitech Smart Rider.");
        nav({ to: "/dashboard" });
      } else {
        setSuccessDialog(true);
      }
    }
  }

  function handleEnterNewEmail() {
    setDuplicateEmailDialog(false);
    setForm((f) => ({ ...f, email: "" }));
    setTimeout(() => {
      document.getElementById("signup-email")?.focus();
    }, 100);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          {/* Card */}
          <div className="rounded-3xl border bg-card shadow-xl overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-foreground">Create your account</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Join Skitech Smart Rider today
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="signup-firstName">First name *</Label>
                    <Input
                      id="signup-firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="John"
                      required
                      maxLength={40}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-surname">Surname *</Label>
                    <Input
                      id="signup-surname"
                      name="lastName"
                      value={form.surname}
                      onChange={(e) => set("surname", e.target.value)}
                      placeholder="Mwangi"
                      required
                      maxLength={40}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email address *</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm-password">Confirm password *</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      placeholder="Repeat your password"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-destructive mt-1 font-medium animate-fade-in">Passwords do not match.</p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      id="signup-terms"
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={(e) => set("termsAccepted", e.target.checked)}
                      className="sr-only peer"
                      required
                    />
                    <div
                      onClick={() => set("termsAccepted", !form.termsAccepted)}
                      className={`w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center transition-colors ${
                        form.termsAccepted
                          ? "bg-primary border-primary"
                          : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {form.termsAccepted && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <label htmlFor="signup-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I have read and accept the{" "}
                    <Link
                      to="/terms"
                      className="text-primary font-medium hover:underline"
                      target="_blank"
                    >
                      Terms & Conditions
                    </Link>
                    {" "}and{" "}
                    <Link to="/terms" className="text-primary font-medium hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold gap-2 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>


      <AppDialog
        open={successDialog}
        onClose={() => setSuccessDialog(false)}
        variant="success"
        title="Account Created!"
      >
        <p className="text-sm text-muted-foreground leading-relaxed mt-1 mb-4">
          The account has been created, and an activation link has been sent to the registered email (<strong>{form.email}</strong>).
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={() => window.open("https://mail.google.com/mail/u/0/#inbox", "_blank")}
            className="w-full gap-2"
          >
            Open Gmail
          </Button>
          <Button onClick={() => nav({ to: "/login" })} variant="outline" className="w-full">
            Go to Login
          </Button>
        </div>
      </AppDialog>

      <SiteFooter />

      {/* Duplicate email dialog */}
      <DuplicateEmailDialog
        open={duplicateEmailDialog}
        onClose={() => setDuplicateEmailDialog(false)}
        onEnterNewEmail={handleEnterNewEmail}
        email={form.email}
      />
    </div>
  );
}
