import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Printer, Truck } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/orders")({ component: AdminOrders });

type Order = {
  id: string;
  status: string;
  amount_kes: number;
  created_at: string;
  paid_at: string | null;
  printed_at: string | null;
  shipped_at: string | null;
  tracking_note: string | null;
  profile_id: string;
  profile?: { full_name: string | null; phone: string | null; plate_number: string | null; status: string } | null;
};

function statusBadge(s: string) {
  const v = s === "paid" ? "default" : s === "shipped" ? "secondary" : s === "pending" ? "outline" : "outline";
  return <Badge variant={v as any}>{s}</Badge>;
}

function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Order | null>(null);
  const [trackingNote, setTrackingNote] = useState("");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("merch_orders")
      .select("*, profile:profiles(full_name,phone,plate_number,status)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status !== "all") q = q.eq("status", status);
    const { data } = await q;
    setOrders((data ?? []) as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function confirmPayment(o: Order) {
    if (!user) return;
    const now = new Date().toISOString();
    const { error: e1 } = await supabase.from("merch_orders").update({
      status: "paid", paid_at: now, confirmed_by: user.id,
    }).eq("id", o.id);
    if (e1) return toast.error(e1.message);
    if (o.profile?.status === "pending_payment" || o.profile?.status === "draft") {
      await supabase.from("profiles").update({ status: "active" }).eq("id", o.profile_id);
    }
    toast.success("Payment confirmed — rider activated");
    load();
  }

  async function markPrinted(o: Order) {
    const { error } = await supabase.from("merch_orders").update({ printed_at: new Date().toISOString() }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Marked printed"); load();
  }

  async function markShipped(o: Order, note: string) {
    const { error } = await supabase.from("merch_orders").update({
      status: "shipped", shipped_at: new Date().toISOString(), tracking_note: note || null,
    }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Marked shipped"); setOpen(null); setTrackingNote(""); load();
  }

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Merch orders</h1>
        <p className="text-sm text-muted-foreground">Confirm payment, print, ship.</p>
      </div>

      <div className="flex gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rider</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders</TableCell></TableRow>
            ) : orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link to="/admin/riders/$id" params={{ id: o.profile_id }} className="font-medium hover:underline">
                    {o.profile?.full_name || "—"}
                  </Link>
                </TableCell>
                <TableCell>{o.profile?.phone || "—"}</TableCell>
                <TableCell>{o.profile?.plate_number || "—"}</TableCell>
                <TableCell>KES {o.amount_kes}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {statusBadge(o.status)}
                    {o.printed_at && <Badge variant="outline">printed</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {o.status === "pending" && (
                      <Button size="sm" onClick={() => confirmPayment(o)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Confirm
                      </Button>
                    )}
                    {o.status === "paid" && !o.printed_at && (
                      <Button size="sm" variant="outline" onClick={() => markPrinted(o)}>
                        <Printer className="h-4 w-4 mr-1" />Printed
                      </Button>
                    )}
                    {o.status === "paid" && (
                      <Dialog open={open?.id === o.id} onOpenChange={(v) => { if (!v) { setOpen(null); setTrackingNote(""); } }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setOpen(o)}>
                            <Truck className="h-4 w-4 mr-1" />Ship
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Mark as shipped</DialogTitle></DialogHeader>
                          <div className="space-y-2">
                            <Label>Tracking note (optional)</Label>
                            <Input value={trackingNote} onChange={(e) => setTrackingNote(e.target.value)} placeholder="Courier, tracking #, ETA…" />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setOpen(null); setTrackingNote(""); }}>Cancel</Button>
                            <Button onClick={() => markShipped(o, trackingNote)}>Confirm shipped</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
