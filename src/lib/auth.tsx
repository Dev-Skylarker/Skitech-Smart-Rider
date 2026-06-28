import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "user" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: UserRole;
  hasProfile: boolean;
  isActive: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  role: null,
  hasProfile: false,
  isActive: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isActive, setIsActive] = useState(false);

  async function fetchRoleAndProfile(userId: string) {
    try {
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("status, full_name").eq("id", userId).maybeSingle(),
      ]);

      setRole((roleData?.role as UserRole) ?? "user");
      // Has profile means they have filled some data (not just an empty auto-created row)
      const profileFilled = !!(profileData?.full_name);
      setHasProfile(profileFilled);
      setIsActive(profileData?.status === "active");
    } catch {
      setRole("user");
      setHasProfile(false);
      setIsActive(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchRoleAndProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        fetchRoleAndProfile(s.user.id);
      } else {
        setRole(null);
        setHasProfile(false);
        setIsActive(false);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        role,
        hasProfile,
        isActive,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
