import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Hourglass, Package, CircleDollarSign, FileEdit, Sparkles, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

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
  chartData: Array<{ date: string; Signups: number; Revenue: number }>;
};

// Beautiful smooth ease-out count-up animation component
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / Math.max(end, 1)), 15);

    const timer = setInterval(() => {
      start += Math.ceil((end - start) / 8);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
}

function AdminOverview() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    (async () => {
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

      const [
        rTotal,
        rActive,
        rPending,
        rDraft,
        oPending,
        oPaid,
        oShipped,
        paidRows,
        s7,
        s30,
        recentProfiles,
        recentOrders,
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
        supabase.from("profiles").select("created_at").gte("created_at", since7),
        supabase.from("merch_orders").select("created_at, amount_kes, status").gte("created_at", since7),
      ]);

      const revenue = (paidRows.data ?? []).reduce((a, r) => a + (r.amount_kes ?? 0), 0);

      // Generate daily timeline coordinates for the past 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      }).reverse();

      const profileCounts: Record<string, number> = {};
      days.forEach((day) => {
        profileCounts[day] = 0;
      });
      recentProfiles.data?.forEach((p) => {
        const day = p.created_at.split("T")[0];
        if (profileCounts[day] !== undefined) {
          profileCounts[day]++;
        }
      });

      const orderRevenue: Record<string, number> = {};
      days.forEach((day) => {
        orderRevenue[day] = 0;
      });
      recentOrders.data?.forEach((o) => {
        if (o.status === "paid" || o.status === "shipped") {
          const day = o.created_at.split("T")[0];
          if (orderRevenue[day] !== undefined) {
            orderRevenue[day] += o.amount_kes ?? 0;
          }
        }
      });

      const chartData = days.map((day) => ({
        date: new Date(day).toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        Signups: profileCounts[day],
        Revenue: orderRevenue[day],
      }));

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
        chartData,
      });
    })();
  }, []);

  if (!m) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm font-medium">Loading metrics…</span>
      </div>
    );
  }

  const tiles = [
    { icon: Users, label: "Total riders", value: m.ridersTotal, to: "/admin/riders", search: { status: "all" }, tooltip: "Total profiles registered in system" },
    { icon: UserCheck, label: "Active", value: m.active, to: "/admin/riders", search: { status: "active" }, tooltip: "Riders with an active profile" },
    { icon: Hourglass, label: "Pending payment", value: m.pendingPayment, to: "/admin/riders", search: { status: "pending_payment" }, tooltip: "Riders awaiting admin fee confirmation" },
    { icon: FileEdit, label: "Drafts", value: m.draft, to: "/admin/riders", search: { status: "draft" }, tooltip: "Incomplete/draft registration profiles" },
    { icon: Package, label: "Orders pending", value: m.ordersPending, to: "/admin/orders", search: { status: "pending" }, tooltip: "Orders waiting for payments" },
    { icon: Package, label: "Orders paid", value: m.ordersPaid, to: "/admin/orders", search: { status: "paid" }, tooltip: "Orders paid and ready to ship" },
    { icon: Package, label: "Shipped", value: m.ordersShipped, to: "/admin/orders", search: { status: "shipped" }, tooltip: "Orders fulfilled and shipped" },
    { icon: CircleDollarSign, label: "Revenue (KES)", value: m.revenueKes, to: "/admin/orders", search: { status: "paid" }, tooltip: "Total earned revenue from completed sales" },
  ];

  const pieData = [
    { name: "Active", value: m.active, color: "var(--primary)" },
    { name: "Pending Payment", value: m.pendingPayment, color: "#f97316" },
    { name: "Drafts", value: m.draft, color: "#94a3b8" },
  ];

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Header Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 border-border/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Snapshot of riders, orders, and revenue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/riders" search={{ status: "all" }}>
            <Button size="sm" variant="outline" className="font-semibold text-xs rounded-xl shadow-sm hover:bg-primary/5 transition-colors">
              <Users className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Manage Riders
            </Button>
          </Link>
          <Link to="/admin/orders" search={{ status: "pending" }}>
            <Button size="sm" variant="outline" className="font-semibold text-xs rounded-xl shadow-sm hover:bg-primary/5 transition-colors">
              <Package className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Manage Orders
            </Button>
          </Link>
          <Link to="/admin/shop">
            <Button size="sm" variant="outline" className="font-semibold text-xs rounded-xl shadow-sm hover:bg-primary/5 transition-colors">
              <CircleDollarSign className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Configure Shop
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid for Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {tiles.map((t, i) => (
          <Link
            key={t.label}
            to={t.to as any}
            search={t.search as any}
            title={t.tooltip}
            style={{ animationDelay: `${i * 60}ms` }}
            className="rounded-2xl border bg-card p-5 block transition-all hover:border-primary/50 hover:shadow-md hover:scale-[1.02] cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-4 duration-500 fill-mode-both"
          >
            <div className="flex items-start justify-between">
              <t.icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
              {t.label}
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">
              {t.label.includes("Revenue") ? "KES " : ""}
              <AnimatedCounter value={t.value} />
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Signups & Revenue Area Chart */}
        <div className="md:col-span-2 rounded-2xl border bg-card p-6 space-y-4 shadow-sm flex flex-col min-h-[350px]">
          <div>
            <h2 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Signups & Revenue Trend
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Performance over the past 7 days</p>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area yAxisId="left" name="Revenue (KES)" type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="right" name="Signups" type="monotone" dataKey="Signups" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSignups)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rider Status Breakdown Doughnut Chart */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm flex flex-col min-h-[350px]">
          <div>
            <h2 className="font-bold text-base text-foreground">Rider Statuses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of registered riders</p>
          </div>
          <div className="flex-1 w-full min-h-[200px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Absolute Centered Rider Count */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-foreground">
                <AnimatedCounter value={m.ridersTotal} />
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Riders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy/Detailed Signup Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 hover:border-primary/30 transition-all shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">New signups · last 7 days</div>
          <div className="text-3xl font-bold mt-1 text-foreground">
            <AnimatedCounter value={m.signups7d} />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 hover:border-primary/30 transition-all shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">New signups · last 30 days</div>
          <div className="text-3xl font-bold mt-1 text-foreground">
            <AnimatedCounter value={m.signups30d} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Link to="/admin/riders" search={{ status: "all" }} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Manage riders →
        </Link>
        <Link to="/admin/orders" search={{ status: "pending" }} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          Manage orders →
        </Link>
      </div>
    </div>
  );
}

