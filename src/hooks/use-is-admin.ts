import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<{ checking: boolean; isAdmin: boolean }>({
    checking: true,
    isAdmin: false,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState({ checking: false, isAdmin: false });
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = (data ?? []).map((r) => r.role as string);
        setState({
          checking: false,
          isAdmin: roles.includes("admin"),
        });
      });
  }, [user, loading]);

  return state;
}
