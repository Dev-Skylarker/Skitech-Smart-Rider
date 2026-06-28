import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/account")({ component: AdminAccountPage });

function AdminAccountPage() {
  const { user } = useAuth();
  
  // Forms state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
    }
  }, [user]);

  if (!user) return null;

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || email === user?.email) return;
    
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verification links sent to both your old and new email addresses.");
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated successfully.");
    setPassword("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Account Settings</h1>
        <p className="text-muted-foreground">Manage your secure admin credentials.</p>
      </div>

      <div className="space-y-6">
        {/* Update Email Section */}
        <section className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-lg">Admin Email Address</h2>
          </div>
          <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={savingEmail || email === user.email}>
              {savingEmail ? "Sending Verification..." : "Update Email"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Note: Updating your email requires verifying a link sent to both your old and new addresses.
            </p>
          </form>
        </section>

        {/* Update Password Section */}
        <section className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-lg">Change Admin Password</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={savingPassword || password.length < 6}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
