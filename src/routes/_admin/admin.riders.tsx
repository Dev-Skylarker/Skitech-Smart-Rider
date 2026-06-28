import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Loader2 } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/admin/riders")({
  component: AdminRiders,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || "all",
    };
  },
});

type Row = {
  id: string;
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
  const v = s === "active" ? "default" : s === "pending_payment" ? "secondary" : s === "suspended" ? "destructive" : "outline";
  return <Badge variant={v as any}>{s.replace("_", " ")}</Badge>;
}

function AdminRiders() {
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("profiles")
        .select("id,full_name,display_name,phone,vehicle_type,plate_number,route,city,bio,trust_score,status,qr_slug,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (status !== "all") query = query.eq("status", status as any);
      if (q.trim()) {
        const t = `%${q.trim()}%`;
        query = query.or(`full_name.ilike.${t},display_name.ilike.${t},phone.ilike.${t},plate_number.ilike.${t}`);
      }
      const { data, count } = await query;
      if (cancelled) return;
      setRows((data ?? []) as Row[]);
      setCount(count ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [q, status, page]);

  // Load specific rider when clicked
  useEffect(() => {
    if (!editId) {
      setEditData(null);
      return;
    }
    const row = rows.find(r => r.id === editId);
    if (row) setEditData({ ...row });
  }, [editId, rows]);

  async function saveRider() {
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
    toast.success("Rider updated successfully");
    setEditId(null);
    // Refresh local rows
    setRows(rows.map(r => r.id === editData.id ? { ...editData } : r));
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE)), [count]);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riders</h1>
          <p className="text-sm text-muted-foreground">{count} total</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, plate…"
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
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No riders found</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setEditId(r.id)}>
                <TableCell>
                  <div className="font-medium">{r.full_name || r.display_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>{r.plate_number || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.route || "—"}</TableCell>
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

      {/* Edit Modal */}
      <AppDialog
        open={!!editId}
        onClose={() => setEditId(null)}
        title="Edit Rider Profile"
        showClose
        actions={
          <Button onClick={saveRider} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        }
      >
        {editData ? (
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
              <div className="space-y-1">
                <Label>Trust Score (-5 to 5)</Label>
                <Input type="number" min="-5" max="5" value={editData.trust_score ?? 0} onChange={(e) => setEditData({ ...editData, trust_score: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label>Account Status</Label>
                <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_payment">Pending payment</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 flex justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </AppDialog>
    </div>
  );
}
