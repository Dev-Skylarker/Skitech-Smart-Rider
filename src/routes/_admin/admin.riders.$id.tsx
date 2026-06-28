import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, RefreshCw, Trash2, ShieldCheck, AlertTriangle, Shield } from "lucide-react";
import { ConfirmChangesDialog } from "@/error-handling/dialogs";

export const Route = createFileRoute("/_admin/admin/riders/$id")({ component: RiderDetail });

type Profile = {
  id: string; full_name: string | null; display_name: string | null; phone: string | null;
  vehicle_type: string | null; plate_number: string | null; route: string | null;
  city: string | null; bio: string | null; status: string; qr_slug: string; trust_score: number;
};
type PM = {
  id: string; method_type: string; label: string | null; account_name: string | null;
  account_number: string | null; paybill_number: string | null; is_primary: boolean;
};
type Order = { id: string; status: string; amount_kes: number; created_at: string; paid_at: string | null };

function getTrustLabel(score: number) {
  if (score >= 3) return { label: "Verified / Trustworthy", color: "text-green-600", icon: ShieldCheck };
  if (score <= -3) return { label: "Flagged / Worst", color: "text-red-600", icon: AlertTriangle };
  return { label: "Neutral", color: "text-muted-foreground", icon: Shield };
}

function RiderDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [methods, setMethods] = useState<PM[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [trustScore, setTrustScore] = useState(0);

  async function load() {
    const [{ data: p }, { data: pm }, { data: o }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("payment_methods").select("*").eq("profile_id", id),
      supabase.from("merch_orders").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
    ]);
    setProfile(p as Profile | null);
    setTrustScore((p as any)?.trust_score ?? 0);
    setMethods((pm ?? []) as PM[]);
    setOrders((o ?? []) as Order[]);
  }

  useEffect(() => { load(); }, [id]);

  if (!profile) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
      Loading rider…
    </div>
  );

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, display_name: profile.display_name,
      phone: profile.phone, vehicle_type: profile.vehicle_type,
      plate_number: profile.plate_number, route: profile.route,
      city: profile.city, bio: profile.bio, trust_score: trustScore,
    }).eq("id", profile.id);
    setSaving(false);
    setShowConfirm(false);
    if (error) return toast.error(error.message);
    toast.success("Rider profile saved.");
    load();
  }

  async function setStatus(status: string) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", profile!.id);
    if (error) return toast.error(error.message);
    toast.success(`Status set to ${status}`);
    load();
  }

  async function regenerateSlug() {
    if (!confirm("Generate new QR slug? The current sticker will stop working.")) return;
    const newSlug = crypto.randomUUID();
    const { error } = await supabase.from("profiles").update({ qr_slug: newSlug }).eq("id", profile!.id);
    if (error) return toast.error(error.message);
    toast.success("New QR slug generated");
    load();
  }

  async function deleteRider() {
    if (!confirm("Permanently delete this rider profile? This cannot be undone.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", profile!.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    nav({ to: "/admin/riders" });
  }

  const trustInfo = getTrustLabel(trustScore);
  const TrustIcon = trustInfo.icon;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/riders">
            <Button size="icon" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || "Unnamed rider"}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">{profile.status.replace("_", " ")}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{profile.id}</span>
            </div>
          </div>
        </div>
        {profile.status === "active" && (
          <a href={`/r/${profile.qr_slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-2" />Public page</Button>
          </a>
        )}
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="trust">Trust Score</TabsTrigger>
          <TabsTrigger value="payments">Payment methods ({methods.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
              <div><Label>Display name</Label><Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
              <div><Label>City</Label><Input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
              <div>
                <Label>Vehicle type</Label>
                <Select value={profile.vehicle_type ?? "Boda"} onValueChange={(v) => setProfile({ ...profile, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boda">Boda</SelectItem>
                    <SelectItem value="Tuktuk">Tuktuk</SelectItem>
                    <SelectItem value="Taxi">Taxi</SelectItem>
                    <SelectItem value="Matatu">Matatu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Plate</Label><Input value={profile.plate_number ?? ""} onChange={(e) => setProfile({ ...profile, plate_number: e.target.value.toUpperCase() })} /></div>
              <div className="sm:col-span-2"><Label>Route</Label><Input value={profile.route ?? ""} onChange={(e) => setProfile({ ...profile, route: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Bio</Label><Textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button onClick={() => setShowConfirm(true)} disabled={saving}>Confirm Changes</Button>
              <div className="flex-1" />
              <Select value={profile.status} onValueChange={setStatus}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_payment">Pending payment</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Trust Score Tab */}
        <TabsContent value="trust" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-1">Rider Trust Score</h3>
              <p className="text-sm text-muted-foreground">
                Set the trust level for this rider. This is displayed as a badge on their public profile.
              </p>
            </div>

            {/* Current badge preview */}
            <div className="rounded-xl border bg-muted/30 p-4 flex items-center gap-3">
              <TrustIcon className={`h-8 w-8 ${trustInfo.color}`} />
              <div>
                <div className={`font-bold ${trustInfo.color}`}>{trustInfo.label}</div>
                <div className="text-xs text-muted-foreground">Current score: {trustScore > 0 ? `+${trustScore}` : trustScore}</div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-red-500 font-bold">−5 Worst / Flagged</span>
                <span className="font-bold">0 Neutral</span>
                <span className="text-green-600 font-bold">+5 Verified</span>
              </div>
              <Slider
                min={-5}
                max={5}
                step={1}
                value={[trustScore]}
                onValueChange={([v]) => setTrustScore(v)}
                className="w-full"
              />
              <div className="flex gap-3 justify-center">
                {[-5, -3, 0, 3, 5].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={trustScore === v ? "default" : "outline"}
                    onClick={() => setTrustScore(v)}
                    className="text-xs min-w-[40px]"
                  >
                    {v > 0 ? `+${v}` : v}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowConfirm(true)} disabled={saving} className="w-full gap-2">
              <ShieldCheck className="h-4 w-4" />
              Save Trust Score
            </Button>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="mt-4 space-y-3">
          {methods.length === 0 && <div className="rounded-xl border bg-card p-6 text-muted-foreground text-sm">No payment methods.</div>}
          {methods.map((m) => (
            <div key={m.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium capitalize">{m.method_type} {m.is_primary && <Badge className="ml-2">Primary</Badge>}</div>
                  <div className="text-sm text-muted-foreground">
                    {m.method_type === "paybill" ? `${m.paybill_number} · ${m.account_number}` : m.account_number}
                    {m.label ? ` · ${m.label}` : ""}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
                  if (!confirm("Delete this payment method?")) return;
                  const { error } = await supabase.from("payment_methods").delete().eq("id", m.id);
                  if (error) return toast.error(error.message);
                  load();
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-3">
          {orders.length === 0 && <div className="rounded-xl border bg-card p-6 text-muted-foreground text-sm">No orders.</div>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">KES {o.amount_kes} · <Badge variant="outline">{o.status}</Badge></div>
                <div className="text-xs text-muted-foreground">Created {new Date(o.created_at).toLocaleString()}</div>
              </div>
              <Link to="/admin/orders" className="text-sm text-primary underline">Manage →</Link>
            </div>
          ))}
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-4">
          <div className="rounded-2xl border border-destructive/40 bg-card p-6 space-y-5">
            <div>
              <h3 className="font-semibold">Regenerate QR slug</h3>
              <p className="text-sm text-muted-foreground">Old printed stickers will stop resolving.</p>
              <Button variant="outline" className="mt-3" onClick={regenerateSlug}>
                <RefreshCw className="h-4 w-4 mr-2" />Regenerate
              </Button>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-destructive">Delete profile</h3>
              <p className="text-sm text-muted-foreground">Removes the profile and all linked payment methods and orders.</p>
              <Button variant="destructive" className="mt-3" onClick={deleteRider}>
                <Trash2 className="h-4 w-4 mr-2" />Delete rider
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm changes dialog */}
      <ConfirmChangesDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={save}
        loading={saving}
        title="Confirm Changes"
        message="Save all changes made to this rider's profile?"
        confirmLabel="Save Changes"
      />
    </div>
  );
}
