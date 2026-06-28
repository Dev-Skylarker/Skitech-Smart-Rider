import { supabase } from "@/integrations/supabase/client";
import { buildPaymentMethodInsert, type PaymentMethodType } from "@/lib/payment-methods";

type ProfileFields = {
  full_name: string;
  display_name: string | null;
  phone: string;
  vehicle_type: string;
  plate_number: string;
  route: string;
  city: string;
  bio: string | null;
  photo_url: string | null;
  status?: "draft" | "pending_payment" | "active" | "suspended";
};

type PaymentMethodInput = {
  method_type: PaymentMethodType;
  label: string;
  account_name: string;
  account_number: string;
  paybill_number: string;
  is_primary: boolean;
};

export async function upsertOwnProfile(userId: string, fields: ProfileFields) {
  return supabase.from("profiles").upsert({ id: userId, ...fields }, { onConflict: "id" });
}

export async function replacePaymentMethods(userId: string, methods: PaymentMethodInput[]) {
  const { error: deleteError } = await supabase.from("payment_methods").delete().eq("profile_id", userId);
  if (deleteError) return { error: deleteError };

  if (methods.length === 0) return { error: null };

  return supabase.from("payment_methods").insert(buildPaymentMethodInsert(userId, methods));
}
