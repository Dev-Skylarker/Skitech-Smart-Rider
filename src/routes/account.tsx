import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppDialog } from "@/components/ui/AppDialog";
import { ArrowRight, Lock, Mail, ShieldAlert, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  // Forms state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/account" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileStatus(data.status);
        }
        setFetching(false);
      });
  }, [user]);

  if (loading || fetching || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

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

  async function handleDeleteAccount() {
    setDeleting(true);
    const { error } = await (supabase.rpc as any)("delete_own_account");
    setDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your account has been completely deleted.");
    setShowDeleteConfirm(false);
    signOut();
  }

  const getStatusDisplay = () => {
    if (!profileStatus) {
      return (
        <div className="bg-muted/50 border rounded-xl p-6 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold">No Profile Yet</h3>
            <p className="text-sm text-muted-foreground">You haven't set up your rider profile.</p>
          </div>
          <Link to="/profile/create">
            <Button className="mt-2 gap-2 rounded-full">
              Create Profile Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      );
    }

    let badgeColor = "default";
    let desc = "Your profile is active and visible.";
    if (profileStatus === "suspended") {
      badgeColor = "destructive";
      desc = "Your profile is suspended. Please contact support.";
    } else if (profileStatus === "pending_payment") {
      badgeColor = "secondary";
      desc = "Waiting for payment verification.";
    } else if (profileStatus === "draft") {
      badgeColor = "outline";
      desc = "Your profile is incomplete. Finish setup to go live.";
    }

    return (
      <div className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-bold flex flex-col sm:flex-row items-center gap-2">
            Profile Status
            <Badge variant={badgeColor as any} className="capitalize">{profileStatus.replace("_", " ")}</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
        </div>
        {profileStatus === "draft" && (
          <Link to="/profile/create">
            <Button size="sm" className="rounded-full gap-2">Continue Setup <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 py-8 md:py-12">
        <h1 className="text-3xl font-black tracking-tight mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your authentication credentials and account details.</p>

        <div className="space-y-8">
          
          {/* Profile Status Section */}
          <section>
            {getStatusDisplay()}
          </section>

          {/* Update Email Section */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-bold text-lg">Email Address</h2>
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
              <h2 className="font-bold text-lg">Change Password</h2>
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

          {/* Danger Zone */}
          <section className="border border-destructive/20 bg-destructive/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-destructive">
              <Trash2 className="h-5 w-5" />
              <h2 className="font-bold text-lg">Danger Zone</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg">
              Once you delete your account, there is no going back. All your data, profile, and active subscriptions will be permanently wiped.
            </p>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Delete Account
            </Button>
          </section>

        </div>
      </main>
      <SiteFooter />

      {/* Delete Confirmation Dialog */}
      <AppDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Account Permanently"
        showClose
        actions={
          <div className="flex w-full gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete My Account"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-muted-foreground py-2">
          <p>Are you absolutely sure you want to proceed?</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Your login credentials will be removed.</li>
            <li>Your public rider profile will be deleted.</li>
            <li>Any pending orders may be cancelled.</li>
            <li>This action cannot be undone.</li>
          </ul>
        </div>
      </AppDialog>
    </div>
  );
}
