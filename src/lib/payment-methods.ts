export type PaymentMethodType =
  | "send_money"
  | "till"
  | "paybill"
  | "bank"
  | "pochi_la_biashara"
  | "other";

/** Values stored in Supabase (includes legacy `mpesa`). */
export type DbPaymentMethodType =
  | "mpesa"
  | "send_money"
  | "till"
  | "paybill"
  | "bank"
  | "pochi_la_biashara"
  | "other";

/** Map UI type to a DB value. Legacy DBs accept `mpesa` but not `send_money`. */
export function toDbMethodType(type: PaymentMethodType): DbPaymentMethodType {
  if (type === "send_money") return "mpesa";
  return type;
}

/** Map a DB row back to the UI type. */
export function fromDbMethodType(type: string): PaymentMethodType {
  if (type === "mpesa") return "send_money";
  return type as PaymentMethodType;
}

export function paymentMethodTypeLabel(type: string, label?: string | null): string {
  if (type === "other") return label || "Other";
  return (
    {
      mpesa: "M-Pesa",
      send_money: "Send Money",
      till: "Till",
      paybill: "Paybill",
      bank: "Bank",
      pochi_la_biashara: "Pochi La Biashara",
    }[type] ?? type.replace(/_/g, " ")
  );
}

export function buildPaymentMethodInsert(
  profileId: string,
  methods: Array<{
    method_type: PaymentMethodType;
    label: string;
    account_name: string;
    account_number: string;
    paybill_number: string;
    is_primary: boolean;
  }>
) {
  return methods.map((m) => ({
    profile_id: profileId,
    method_type: toDbMethodType(m.method_type),
    label: m.label || null,
    account_name: m.account_name || null,
    account_number: m.account_number || null,
    paybill_number: m.paybill_number || null,
    is_primary: m.is_primary,
  }));
}
