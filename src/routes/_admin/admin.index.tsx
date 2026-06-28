import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Hourglass, Package, CircleDollarSign, FileEdit } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/")({ component: AdminOverview });

type Metrics = {
  ridersTotal: number;
  active: number;
  pendingPayment: number;
  draft: number;
  ordersPending: number;
  ordersPaid: number;
  ordersShipped: number;
  revenueKes: number;
  signups7d: number;
  signups30d: number;
};

function AdminOverview() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    (async () => {
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const [
        rTotal, rActive, rPending, rDraft, oPending, oPaid, oShipped, paidRows, s7, s30,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("merch_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("merch_orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
        supabase.from("merch_orders").select("id", { count: "exact", head: true }).eq("status", "shipped"),
        supabase.from("merch_orders").select("amount_kes").in("status", ["paid", "shipped"]),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since30),
      ]);
      const revenue = (paidRows.data ?? []).reduce((a, r) => a + (r.amount_kes ?? 0), 0);
      setM({
        ridersTotal: rTotal.count ?? 0,
        active: rActive.count ?? 0,
        pendingPayment: rPending.count ?? 0,
        draft: rDraft.count ?? 0,
        ordersPending: oPending.count ?? 0,
        ordersPaid: oPaid.count ?? 0,
        ordersShipped: oShipped.count ?? 0,
        revenueKes: revenue,
        signups7d: s7.count ?? 0,
        signups30d: s30.count ?? 0,
      });
    })();
  }, []);

  if (!m) return <div className="text-muted-foreground">Loading metrics…</div>;

  const tiles = [
    { icon: Users, label: "Total riders", value: m.ridersTotal, to: "/admin/riders", search: { status: "all" } },
    { icon: UserCheck, label: "Active", value: m.active, to: "/admin/riders", search: { status: "active" } },
    { icon: Hourglass, label: "Pending payment", value: m.pendingPayment, to: "/admin/riders", search: { status: "pending_payment" } },
    { icon: FileEdit, label: "Drafts", value: m.draft, to: "/admin/riders", search: { status: "draft" } },
    { icon: Package, label: "Orders pending", value: m.ordersPending, to: "/admin/orders", search: { status: "pending" } },
    { icon: Package, label: "Orders paid", value: m.ordersPaid, to: "/admin/orders", search: { status: "paid" } },
    { icon: Package, label: "Shipped", value: m.ordersShipped, to: "/admin/orders", search: { status: "shipped" } },
    { icon: CircleDollarSign, label: "Revenue (KES)", value: m.revenueKes.toLocaleString(), to: "/admin/orders", search: { status: "paid" } },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm">Snapshot of riders, orders, and revenue.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to as any}
            search={t.search as any}
            className="rounded-2xl border bg-card p-5 block transition-all hover:border-primary/50 hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <t.icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">{t.label}</div>
            <div className="text-2xl font-bold">{t.value}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">New signups · last 7 days</div>
          <div className="text-3xl font-bold">{m.signups7d}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">New signups · last 30 days</div>
          <div className="text-3xl font-bold">{m.signups30d}</div>
        </div>
      </div>
      <div className="flex gap-3">
        <Link to="/admin/riders" search={{ status: "all" }} className="text-sm text-primary underline">Manage riders →</Link>
        <Link to="/admin/orders" search={{ status: "pending" }} className="text-sm text-primary underline">Manage orders →</Link>
      </div>
    </div>
  );
}
