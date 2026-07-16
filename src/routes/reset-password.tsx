import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: Page });

type Status = "verifying" | "ready" | "invalid";

function Page() {
  const nav = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when it detects a valid recovery
    // token in the URL hash (requires detectSessionInUrl: true in client.ts).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    // If no recovery event fires within 5 seconds, the token is missing
    // or already expired — show the invalid state.
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === "verifying" ? "invalid" : prev));
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters.");
    if (password !== confirm)
      return toast.error("Passwords don't match.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return toast.error(error.message);

    toast.success("Password updated — please sign in.");
    // Sign out the recovery session so the user logs in fresh
    await supabase.auth.signOut();
    nav({ to: "/login" });
  }

  // ── Verifying ──────────────────────────────────────────────────────────
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-md px-4 py-24 flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ────────────────────────────────────────────
  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-md px-4 py-24 flex flex-col items-center gap-4 text-center">
          <ShieldX className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Link invalid or expired</h1>
          <p className="text-muted-foreground">
            This reset link has expired or has already been used. Please request
            a new one.
          </p>
          <Button
            onClick={() => nav({ to: "/forgot-password" })}
            className="mt-2"
          >
            Request new link
          </Button>
        </div>
      </div>
    );
  }

  // ── Ready — valid recovery session ────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-md px-4 py-16">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Set a new password</h1>
        </div>
        <p className="text-muted-foreground mt-1 mb-6">
          Choose a strong password — at least 8 characters.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="rp-password">New password</Label>
            <Input
              id="rp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rp-confirm">Confirm new password</Label>
            <Input
              id="rp-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
