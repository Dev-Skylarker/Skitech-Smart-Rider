import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Loader2, ArrowLeft, UserX, UserMinus, Pencil, Ban, KeyRound } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/admin/riders")({
  component: AdminUsers,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || "all",
    };
  },
});

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  route: string | null;
  city: string | null;
  bio: string | null;
  status: string;
  qr_slug: string;
  trust_score: number;
  created_at: string;
};

const PAGE = 25;

function statusBadge(s: string) {
  const v = s === "active" ? "default" : s === "pending_payment" ? "secondary" : s === "suspended" ? "destructive" : s === "banned" ? "destructive" : "outline";
  return <Badge variant={v as any}>{s.replace("_", " ")}</Badge>;
}

function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const search = Route.useSearch();
  const [status, setStatus] = useState<string>(search.status);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [popupMode, setPopupMode] = useState<"menu" | "edit">("menu");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("profiles")
        .select("id,email,full_name,display_name,phone,vehicle_type,plate_number,route,city,bio,trust_score,status,qr_slug,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (status !== "all") query = query.eq("status", status as any);
      if (q.trim()) {
        const t = `%${q.trim()}%`;
        query = query.or(`full_name.ilike.${t},email.ilike.${t},phone.ilike.${t},plate_number.ilike.${t}`);
      }
      const { data, count } = await query;
      if (cancelled) return;
      setRows((data ?? []) as Row[]);
      setCount(count ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [q, status, page]);

  // Load specific user when clicked
  useEffect(() => {
    if (!editId) {
      setEditData(null);
      setPopupMode("menu");
      return;
    }
    const row = rows.find(r => r.id === editId);
    if (row) {
      setEditData({ ...row });
      setPopupMode("menu");
    }
  }, [editId, rows]);

  async function saveUser() {
    if (!editData) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editData.full_name,
      display_name: editData.display_name,
      phone: editData.phone,
      vehicle_type: editData.vehicle_type,
      plate_number: editData.plate_number,
      route: editData.route,
      city: editData.city,
      bio: editData.bio,
      trust_score: editData.trust_score,
      status: editData.status,
    }).eq("id", editData.id);
    
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User updated successfully");
    setEditId(null);
    setRows(rows.map(r => r.id === editData.id ? { ...editData } : r));
  }

  async function handleStatusChange(newStatus: string) {
    if (!editData) return;
    const confirmMsg = newStatus === "banned" ? "Are you sure you want to BAN this user?" : "Are you sure you want to suspend this user?";
    if (!window.confirm(confirmMsg)) return;

    setSaving(true);
    const { error } = await supabase.from("profiles").update({ status: newStatus as any }).eq("id", editData.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`User status changed to ${newStatus}`);
    setRows(rows.map(r => r.id === editData.id ? { ...r, status: newStatus } : r));
    setEditId(null);
  }

  async function handleDeleteUser() {
    if (!editData) return;
    const confirmed = window.confirm("CRITICAL: Are you absolutely sure you want to permanently DELETE this user? This cannot be undone.");
    if (!confirmed) return;

    setSaving(true);
    // Call the security definer function to delete from auth.users (which cascades to profiles)
    const { error } = await supabase.rpc("admin_delete_user", { target_user_id: editData.id });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User deleted successfully.");
    setRows(rows.filter(r => r.id !== editData.id));
    setCount(c => c - 1);
    setEditId(null);
  }

  async function saveTrustScore(newScore: number) {
    if (!editData) return;
    const { error } = await supabase.from("profiles").update({ trust_score: newScore }).eq("id", editData.id);
    if (error) {
      toast.error("Failed to save trust score");
      return;
    }
    setRows(rows.map(r => r.id === editData.id ? { ...r, trust_score: newScore } : r));
    toast.success("Trust score updated");
  }

  async function handleResetPassword() {
    if (!editData?.email) {
      toast.error("User does not have an email address attached.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(editData.email.trim(), {
      redirectTo: `${window.location.origin}/dashboard`
    });
    setSaving(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Password reset email sent to ${editData.email}`);
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE)), [count]);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground">{count} total accounts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_payment">Pending payment</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setEditId(r.id)}>
                <TableCell>
                  <div className="font-medium">{r.full_name || r.display_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{r.email || "No email"}</div>
                </TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>{r.plate_number || "—"}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-right">
                  {r.status === "active" && (
                    <Link to="/r/$slug" params={{ slug: r.qr_slug }} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary"><ExternalLink className="h-4 w-4" /></Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      </div>

      {/* User Actions Modal */}
      <AppDialog
        open={!!editId}
        onClose={() => setEditId(null)}
        title={popupMode === "menu" ? "User Actions" : "Edit User Profile"}
        showClose
        actions={
          popupMode === "edit" ? (
            <div className="flex w-full gap-2 justify-end">
              <Button variant="outline" onClick={() => setPopupMode("menu")}>Back</Button>
              <Button onClick={saveUser} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {editData ? (
          popupMode === "menu" ? (
            <div className="space-y-6 py-2">
              <div className="text-center">
                <h3 className="font-bold text-lg">{editData.full_name || editData.display_name || "Unknown User"}</h3>
                <p className="text-sm text-muted-foreground">{editData.email}</p>
                <div className="mt-2">{statusBadge(editData.status)}</div>
              </div>

              {/* Trust Score Slider */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Trust Score</Label>
                  <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">{editData.trust_score}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  value={editData.trust_score}
                  onChange={(e) => setEditData({ ...editData, trust_score: parseInt(e.target.value) })}
                  onMouseUp={(e) => saveTrustScore(parseInt((e.target as HTMLInputElement).value))}
                  onTouchEnd={(e) => saveTrustScore(parseInt((e.target as HTMLInputElement).value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground text-center">Drag to adjust score (-5 to 5). Saves automatically.</p>
              </div>

              {editData.id === user?.id ? (
                <div className="bg-primary/5 text-primary p-4 rounded-xl border border-primary/20 text-center">
                  <p className="text-sm font-medium">To manage your own account, please use the Account Settings tab.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => setPopupMode("edit")}>
                    <Pencil className="h-5 w-5 text-muted-foreground" />
                    Edit User Information
                  </Button>

                  <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={handleResetPassword} disabled={saving || !editData.email}>
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    Send Password Reset Email
                  </Button>
                  
                  {editData.status !== "suspended" && (
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleStatusChange("suspended")} disabled={saving}>
                      <UserMinus className="h-5 w-5" />
                      Suspend User
                    </Button>
                  )}

                  {editData.status !== "banned" && (
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleStatusChange("banned")} disabled={saving}>
                      <Ban className="h-5 w-5" />
                      Ban User
                    </Button>
                  )}

                  {(editData.status === "suspended" || editData.status === "banned") && (
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 text-primary" onClick={() => handleStatusChange("active")} disabled={saving}>
                      <Badge variant="outline" className="bg-primary/10 border-transparent text-primary">Restore</Badge>
                      Restore User to Active
                    </Button>
                  )}

                  <Button variant="outline" className="w-full justify-start gap-3 h-12 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground mt-4" onClick={handleDeleteUser} disabled={saving}>
                    <UserX className="h-5 w-5" />
                    Delete Account Permanently
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editData.full_name ?? ""} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Display Name</Label>
                  <Input value={editData.display_name ?? ""} onChange={(e) => setEditData({ ...editData, display_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input value={editData.phone ?? ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>City / Town</Label>
                  <Input value={editData.city ?? ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Vehicle Type</Label>
                  <Select value={editData.vehicle_type ?? "Boda"} onValueChange={(v) => setEditData({ ...editData, vehicle_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boda">Boda</SelectItem>
                      <SelectItem value="Tuktuk">Tuktuk</SelectItem>
                      <SelectItem value="Taxi">Taxi</SelectItem>
                      <SelectItem value="Matatu">Matatu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Plate Number</Label>
                  <Input value={editData.plate_number ?? ""} onChange={(e) => setEditData({ ...editData, plate_number: e.target.value.toUpperCase() })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Operating Route</Label>
                  <Input value={editData.route ?? ""} onChange={(e) => setEditData({ ...editData, route: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Bio / Note</Label>
                  <Textarea value={editData.bio ?? ""} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="py-10 flex justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </AppDialog>
    </div>
  );
}
