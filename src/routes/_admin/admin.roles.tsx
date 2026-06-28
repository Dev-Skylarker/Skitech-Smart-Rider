import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, ShieldPlus, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/roles")({ component: AdminRoles });

type Row = { user_id: string; email: string; isAdmin: boolean; adminRoleId: string | null; created_at: string };

function AdminRoles() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin">("admin");
  const [busy, setBusy] = useState(false);

  async function list() {
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, email");
    
    const uniqueUserIds = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    
    return uniqueUserIds.map((uid: any) => {
      const userRoles = (roles ?? []).filter((r: any) => r.user_id === uid);
      const p = (profiles ?? []).find((prof: any) => prof.id === uid);
      const adminRole = userRoles.find((r: any) => r.role === "admin");
      
      return {
        user_id: uid,
        email: p?.email ?? "rider@smartrider.co.ke",
        isAdmin: !!adminRole,
        adminRoleId: adminRole?.id ?? null,
        created_at: userRoles[0].created_at
      };
    });
  }

  async function grant(emailStr: string, roleVal: "admin") {
    const { data: profiles } = await supabase.from("profiles").select("id, email");
    const found = (profiles ?? []).find((p: any) => p.email?.toLowerCase() === emailStr.toLowerCase());
    if (!found) throw new Error(`No user found for ${emailStr}`);
    const { error } = await supabase.from("user_roles").insert({
      user_id: found.id,
      role: roleVal
    });
    if (error) throw new Error(error.message);
  }

  async function revoke(id: string) {
    const { data: roles } = await supabase.from("user_roles").select("*");
    const target = (roles ?? []).find((r: any) => r.id === id);
    if (!target) throw new Error("Role not found");
    if (target.role === "admin") {
      const adminCount = (roles ?? []).filter((r: any) => r.role === "admin").length;
      if (adminCount <= 1) throw new Error("Cannot remove the last admin");
    }
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await list();
      setRows(data as Row[]);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onGrant() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await grant(email.trim(), role);
      toast.success(`Granted ${role} to ${email}`);
      setEmail("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setBusy(false);
  }

  async function onRevoke(id: string) {
    if (!confirm("Revoke this role?")) return;
    try {
      await revoke(id);
      toast.success("Revoked");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link to="/admin">
          <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground">Grant admin access by email.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold flex items-center gap-2"><ShieldPlus className="h-4 w-4" />Grant role</h2>
        <div className="mt-4 grid sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div>
            <Label>User email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onGrant} disabled={busy || !email.trim()}>{busy ? "…" : "Grant"}</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">The user must already have an account.</p>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No roles assigned</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.user_id}>
                <TableCell>{r.email ?? <span className="text-muted-foreground">{r.user_id}</span>}</TableCell>
                <TableCell><Badge variant={r.isAdmin ? "default" : "secondary"}>{r.isAdmin ? "admin" : "user"}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {r.isAdmin ? (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onRevoke(r.adminRoleId!)}>Revoke</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={async () => {
                      setBusy(true);
                      try {
                        await grant(r.email, "admin");
                        toast.success("Promoted to Admin");
                        load();
                      } catch (e: any) {
                        toast.error(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}>Promote</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
