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
import { ExternalLink, Pencil } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/riders")({ component: AdminRiders });

type Row = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  plate_number: string | null;
  route: string | null;
  city: string | null;
  status: string;
  qr_slug: string;
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
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("profiles")
        .select("id,full_name,display_name,phone,plate_number,route,city,status,qr_slug,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (status !== "all") query = query.eq("status", status);
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
        <Input
          placeholder="Search name, phone, plate…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          className="max-w-sm"
        />
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No riders found</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.full_name || r.display_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>{r.plate_number || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.route || "—"}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/admin/riders/$id" params={{ id: r.id }}>
                      <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    {r.status === "active" && (
                      <a href={`/r/${r.qr_slug}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                      </a>
                    )}
                  </div>
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
    </div>
  );
}
