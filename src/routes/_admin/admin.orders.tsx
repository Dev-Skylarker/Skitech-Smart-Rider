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
import { CheckCircle2, Printer, Truck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/orders")({
  component: AdminOrders,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || "pending",
    };
  },
});

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
  if (s === "paid") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/25 flex items-center gap-1.5 w-fit font-semibold shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
        paid
      </Badge>
    );
  }
  if (s === "shipped") {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/25 flex items-center gap-1.5 w-fit font-semibold shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        shipped
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/25 flex items-center gap-1.5 w-fit font-semibold shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-status-pulse" />
      {s}
    </Badge>
  );
}

function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const search = Route.useSearch();
  const [status, setStatus] = useState(search.status);
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
      <div className="flex items-center gap-2">
        <Link to="/admin">
          <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Merch orders</h1>
          <p className="text-sm text-muted-foreground">Confirm payment, print, ship.</p>
        </div>
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
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-muted/5 border border-dashed rounded-2xl animate-scale-in">
                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-75 animate-pulse" />
                      <svg className="w-16 h-16 text-primary relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-foreground">No orders found</h3>
                    <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                      There are no merchandise or sticker orders matching this status yet. All rider orders will show up here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link to="/admin/riders" search={{ status: "all" }} className="font-medium hover:underline">
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
