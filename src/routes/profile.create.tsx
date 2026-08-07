import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, ArrowLeft, CheckCircle2, Pencil, Star, Check, Smartphone, Landmark, Wallet, Coins, AlertCircle, Sparkles } from "lucide-react";
import { PaymentConfirmDialog, ConfirmChangesDialog } from "@/error-handling/dialogs";
import { AppDialog } from "@/components/ui/AppDialog";
import { fromDbMethodType, type PaymentMethodType } from "@/lib/payment-methods";
import { replacePaymentMethods, upsertOwnProfile } from "@/lib/profiles";
import Cropper from "react-easy-crop";

export const Route = createFileRoute("/profile/create")({ component: CreateProfile });

type PM = {
  id?: string;
  method_type: PaymentMethodType;
  label: string;
  account_name: string;
  account_number: string;
  paybill_number: string;
  is_primary: boolean;
};

const emptyPM = (): PM => ({
  method_type: "send_money", label: "", account_name: "", account_number: "", paybill_number: "", is_primary: false,
});

// ── Plate number format rules per vehicle category ──────────────────────────
const PLATE_FORMATS = {
  Boda:   { regex: /^K[A-Z]{3} \d{3}[A-Z]$/, placeholder: "KMGB 001K", hint: "KXXX 000X", maxLen: 9 },
  Tuktuk: { regex: /^K[A-Z]{3} \d{3}[A-Z]$/, placeholder: "KTWB 001K", hint: "KXXX 000X", maxLen: 9 },
  Taxi:   { regex: /^K[A-Z]{2} \d{3}[A-Z]$/, placeholder: "KDY 001K",  hint: "KXX 000X",  maxLen: 8 },
  Matatu: { regex: /^K[A-Z]{2} \d{3}[A-Z]$/, placeholder: "KDY 001K",  hint: "KXX 000X",  maxLen: 8 },
} as const;

// Auto-insert the space between the letter prefix and the numeric+suffix block
function formatPlate(raw: string, vehicleType: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const letterCount = vehicleType === "Boda" || vehicleType === "Tuktuk" ? 4 : 3;
  const trimmed = clean.slice(0, letterCount + 4); // letters + 3 digits + 1 suffix letter
  if (trimmed.length <= letterCount) return trimmed;
  return `${trimmed.slice(0, letterCount)} ${trimmed.slice(letterCount)}`;
}

const profileSchema = z
  .object({
    first_name: z.string().trim().min(2, "First name too short").max(40),
    surname: z.string().trim().min(2, "Surname too short").max(40),
    display_name: z.string().trim().max(60).optional().or(z.literal("")),
    phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be 10 digits"),
    vehicle_type: z.string().min(2).max(40),
    plate_number: z.string().trim().min(1, "Enter a plate number"),
    route: z.string().trim().min(2, "Enter your route").max(100),
    city: z.string().trim().min(2).max(60),
    bio: z.string().max(280).optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    const fmt = PLATE_FORMATS[d.vehicle_type as keyof typeof PLATE_FORMATS];
    if (fmt && !fmt.regex.test(d.plate_number.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid plate format for ${d.vehicle_type}. Expected: ${fmt.hint} (e.g. ${fmt.placeholder})`,
        path: ["plate_number"],
      });
    }
  });

function CreateProfile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState({
    first_name: "", surname: "", display_name: "", phone: "", vehicle_type: "Boda",
    plate_number: "", route: "", city: "Nairobi", bio: "", photo_url: "",
  });
  const [methods, setMethods] = useState<PM[]>([]);
  const [newMethod, setNewMethod] = useState<PM>(emptyPM());
  const [step, setStep] = useState<"form" | "review">("form");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Crop states
  const [photoFileToUpload, setPhotoFileToUpload] = useState<Blob | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Dialog states
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [primaryIndexToConfirm, setPrimaryIndexToConfirm] = useState<number | null>(null);
  const [showPrimaryConfirm, setShowPrimaryConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/profile/create" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        if (p.status !== "draft") {
          setIsEditMode(true);
        }
        const dbFullName = p.full_name || user.user_metadata?.full_name || "";
        const parts = dbFullName.split(" ");
        const defaultFirst = user.user_metadata?.first_name || parts[0] || "";
        const defaultSur = user.user_metadata?.surname || parts.slice(1).join(" ") || "";
        const autoDisplayName = p.display_name || defaultFirst || "";
        
        setData({
          first_name: defaultFirst,
          surname: defaultSur,
          display_name: autoDisplayName,
          phone: p.phone ?? "",
          vehicle_type: p.vehicle_type ?? "Boda",
          plate_number: p.plate_number ?? "",
          route: p.route ?? "",
          city: p.city ?? "Nairobi",
          bio: p.bio ?? "",
          photo_url: p.photo_url ?? "",
        });
      }
      const { data: pms } = await supabase.from("payment_methods").select("*").eq("profile_id", user.id);
      if (pms?.length) {
        setMethods(pms.map((m) => ({
          id: m.id,
          method_type: fromDbMethodType(m.method_type),
          label: m.label ?? "", account_name: m.account_name ?? "",
          account_number: m.account_number ?? "", paybill_number: m.paybill_number ?? "",
          is_primary: m.is_primary,
        })));
      }
    })();
  }, [user]);

  function setPM(i: number, patch: Partial<PM>) {
    setMethods((arr) =>
      arr.map((m, idx) => (idx === i ? { ...m, ...patch } : patch.is_primary ? { ...m, is_primary: false } : m))
    );
  }

  const handleDeleteMethod = (index: number) => {
    const methodToDelete = methods[index];
    const remaining = methods.filter((_, idx) => idx !== index);
    if (methodToDelete.is_primary && remaining.length > 0) {
      remaining[0].is_primary = true;
      toast.info(`Primary method deleted. "${remaining[0].method_type.replace(/_/g, " ")}" has been auto-promoted to Primary.`);
    }
    setMethods(remaining);
  };

  const handleSetPrimaryRequest = (index: number) => {
    if (methods[index].is_primary) return;
    setPrimaryIndexToConfirm(index);
    setShowPrimaryConfirm(true);
  };

  const confirmPrimaryMethod = () => {
    if (primaryIndexToConfirm === null) return;
    setMethods(methods.map((method, idx) => ({
      ...method,
      is_primary: idx === primaryIndexToConfirm
    })));
    const methodName = methods[primaryIndexToConfirm].method_type.replace(/_/g, " ");
    toast.success(`"${methodName}" is now your primary payment method.`);
    setShowPrimaryConfirm(false);
    setPrimaryIndexToConfirm(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImage(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const confirmCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      setPhotoFileToUpload(croppedBlob);
      setData({ ...data, photo_url: URL.createObjectURL(croppedBlob) });
      setCropImage(null);
    } catch (e) {
      toast.error("Failed to crop image.");
    }
  };

  async function uploadPendingPhoto(): Promise<string | null> {
    if (!photoFileToUpload || !user) return data.photo_url;
    const fileExt = "jpg";
    const filePath = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, photoFileToUpload);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return publicUrl;
  }

  function validateAndReview() {
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (methods.length === 0) return toast.error("Add at least one payment method");
    if (!methods.some((m) => m.is_primary)) return toast.error("Mark one payment method as primary");
    for (const m of methods) {
      if (!m.account_number && m.method_type !== "paybill") return toast.error("Each payment method needs an account/till number");
      if (m.method_type === "paybill" && !m.paybill_number) return toast.error("Paybill needs a paybill number");
    }
    setStep("review");
  }

  // For "Edit Details" flow — save and confirm
  async function saveEditsConfirmed() {
    if (!user) return;
    setSaving(true);
    
    let finalPhotoUrl = data.photo_url;
    try {
      const url = await uploadPendingPhoto();
      if (url) finalPhotoUrl = url;
    } catch (err: any) {
      setSaving(false);
      return toast.error("Error uploading photo: " + err.message);
    }

    const dbFullName = `${data.first_name.trim()} ${data.surname.trim()}`;
    const { error } = await upsertOwnProfile(user.id, {
      full_name: dbFullName, display_name: data.display_name || null,
      phone: data.phone, vehicle_type: data.vehicle_type, plate_number: data.plate_number,
      route: data.route, city: data.city, bio: data.bio || null, photo_url: finalPhotoUrl || null,
    });

    if (!error) {
      const { error: pmErr } = await replacePaymentMethods(user.id, methods);
      if (pmErr) {
        setSaving(false);
        setShowEditConfirm(false);
        return toast.error(pmErr.message);
      }
    }

    setSaving(false);
    setShowEditConfirm(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated successfully.");
    nav({ to: "/dashboard" });
  }

  // For new profile flow — save as active
  async function saveNewProfile() {
    if (!user) return;
    setSaving(true);
    
    let finalPhotoUrl = data.photo_url;
    try {
      const url = await uploadPendingPhoto();
      if (url) finalPhotoUrl = url;
    } catch (err: any) {
      setSaving(false);
      return toast.error("Error uploading photo: " + err.message);
    }

    const dbFullName = `${data.first_name.trim()} ${data.surname.trim()}`;
    const { error: pErr } = await upsertOwnProfile(user.id, {
      full_name: dbFullName, display_name: data.display_name || null,
      phone: data.phone, vehicle_type: data.vehicle_type, plate_number: data.plate_number,
      route: data.route, city: data.city, bio: data.bio || null, photo_url: finalPhotoUrl || null,
      status: "active",
    });
    if (pErr) { setSaving(false); return toast.error(pErr.message); }

    const { error: pmErr } = await replacePaymentMethods(user.id, methods);
    if (pmErr) {
      setSaving(false);
      return toast.error(pmErr.message);
    }
    setSaving(false);
    
    toast.success("Profile created successfully! You are now live.");
    nav({ to: "/dashboard" });
  }

  const pageTitle = isEditMode ? "Edit Profile" : "Create Your Profile";
  const pageDesc = isEditMode
    ? "Update your rider details below."
    : "Fill in your details to create your public rider profile.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step === "review" ? (
            <Button size="icon" variant="ghost" onClick={() => setStep("form")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => nav({ to: "/dashboard" })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {step === "form" ? pageTitle : "Review Your Details"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {step === "form" ? pageDesc : "Check everything is correct before proceeding."}
            </p>
          </div>
        </div>

        {step === "form" ? (
          <div className="space-y-6">
            {/* About you */}
            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <h2 className="font-bold text-foreground">About you</h2>
              
              <div className="flex flex-col items-center gap-3 py-2 border-b border-dashed pb-6 mb-2">
                <div className="h-24 w-24 rounded-full border-4 border-muted overflow-hidden bg-muted/30 flex items-center justify-center relative shadow-inner">
                  {data.photo_url ? (
                    <img src={data.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-xs font-medium">No photo</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <Label htmlFor="photo-upload" className="cursor-pointer text-sm font-bold text-primary hover:underline block">
                    {data.photo_url ? "Change Photo" : "Upload Profile Photo"}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Appears on your public page</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>First name *</Label>
                  <Input value={data.first_name} onChange={(e) => setData({ ...data, first_name: e.target.value })} maxLength={40} placeholder="John" autoComplete="given-name" />
                </div>
                <div className="space-y-1">
                  <Label>Surname *</Label>
                  <Input value={data.surname} onChange={(e) => setData({ ...data, surname: e.target.value })} maxLength={40} placeholder="Mwangi" autoComplete="family-name" />
                </div>
                <div className="space-y-1">
                  <Label>Display name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input value={data.display_name} onChange={(e) => setData({ ...data, display_name: e.target.value })} maxLength={60} placeholder="Mwangi" />
                </div>
                <div className="space-y-1">
                  <Label>Phone *</Label>
                  <Input 
                    value={data.phone} 
                    onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                    placeholder="0XXXXXXXXX" 
                    maxLength={10}
                  />
                </div>
                <div className="space-y-1">
                  <Label>City *</Label>
                  <Input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} maxLength={60} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Short bio <span className="text-muted-foreground text-xs">(optional, max 280 chars)</span></Label>
                <Textarea
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  maxLength={280}
                  rows={3}
                  placeholder="Friendly, on time, knows every shortcut in town."
                />
                <div className="text-xs text-muted-foreground text-right">{data.bio.length}/280</div>
              </div>
            </section>

            {/* Bike details */}
            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <h2 className="font-bold text-foreground">Bike details</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Vehicle type *</Label>
                  <Select
                    value={data.vehicle_type}
                    onValueChange={(v) => setData({ ...data, vehicle_type: v, plate_number: "" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boda">Boda (motorbike)</SelectItem>
                      <SelectItem value="Tuktuk">Tuktuk</SelectItem>
                      <SelectItem value="Taxi">Taxi</SelectItem>
                      <SelectItem value="Matatu">Matatu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Plate number *</Label>
                  <Input
                    value={data.plate_number}
                    onChange={(e) =>
                      setData({ ...data, plate_number: formatPlate(e.target.value, data.vehicle_type) })
                    }
                    maxLength={PLATE_FORMATS[data.vehicle_type as keyof typeof PLATE_FORMATS]?.maxLen ?? 9}
                    placeholder={PLATE_FORMATS[data.vehicle_type as keyof typeof PLATE_FORMATS]?.placeholder ?? "KXX 000X"}
                    className="font-mono tracking-widest uppercase"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Format:{" "}
                    <span className="font-mono font-semibold">
                      {PLATE_FORMATS[data.vehicle_type as keyof typeof PLATE_FORMATS]?.hint ?? "KXX 000X"}
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Route *</Label>
                  <Input value={data.route} onChange={(e) => setData({ ...data, route: e.target.value })} maxLength={100} placeholder="CBD ↔ Westlands" />
                </div>
              </div>
            </section>

            {/* Add New Payment Method Form */}
            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <h2 className="font-bold text-foreground">Add Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Type</Label>
                  <Select value={newMethod.method_type} onValueChange={(v) => setNewMethod({ ...emptyPM(), method_type: v as PM["method_type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_money">Send Money (M-Pesa/Airtel)</SelectItem>
                      <SelectItem value="till">Till Number</SelectItem>
                      <SelectItem value="paybill">Paybill</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="pochi_la_biashara">Pochi La Biashara</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newMethod.method_type === "send_money" && (
                  <>
                    <div className="space-y-1">
                      <Label>Recipient Name *</Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Phone Number *</Label>
                        {data.phone && (
                          <button type="button" className="text-[10px] text-primary font-bold hover:underline" onClick={() => setNewMethod({ ...newMethod, account_number: data.phone })}>
                            Use profile phone
                          </button>
                        )}
                      </div>
                      <Input 
                        value={newMethod.account_number} 
                        onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                        placeholder="0XXXXXXXXX"
                        maxLength={10} 
                      />
                    </div>
                  </>
                )}

                {newMethod.method_type === "till" && (
                  <>
                    <div className="space-y-1">
                      <Label>Name *</Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                    <div className="space-y-1">
                      <Label>Till Number *</Label>
                      <Input value={newMethod.account_number} onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value })} maxLength={40} />
                    </div>
                  </>
                )}

                {newMethod.method_type === "paybill" && (
                  <>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Paybill Name *</Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                    <div className="space-y-1">
                      <Label>Business / Paybill No. *</Label>
                      <Input value={newMethod.paybill_number} onChange={(e) => setNewMethod({ ...newMethod, paybill_number: e.target.value })} maxLength={20} />
                    </div>
                    <div className="space-y-1">
                      <Label>Account No. *</Label>
                      <Input value={newMethod.account_number} onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value })} maxLength={40} />
                    </div>
                  </>
                )}

                {newMethod.method_type === "bank" && (
                  <>
                    <div className="space-y-1">
                      <Label>Bank Name *</Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                    <div className="space-y-1">
                      <Label>Account No. *</Label>
                      <Input value={newMethod.account_number} onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value })} maxLength={40} />
                    </div>
                  </>
                )}

                {newMethod.method_type === "pochi_la_biashara" && (
                  <>
                    <div className="space-y-1">
                      <Label>Name *</Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                    <div className="space-y-1">
                      <Label>Number *</Label>
                      <Input 
                        value={newMethod.account_number} 
                        onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                        placeholder="0XXXXXXXXX"
                        maxLength={10} 
                      />
                    </div>
                  </>
                )}

                {newMethod.method_type === "other" && (
                  <>
                    <div className="space-y-1">
                      <Label>Method Name *</Label>
                      <Input value={newMethod.label} onChange={(e) => setNewMethod({ ...newMethod, label: e.target.value })} maxLength={40} placeholder="e.g. PayPal" />
                    </div>
                    <div className="space-y-1">
                      <Label>Number / ID *</Label>
                      <Input value={newMethod.account_number} onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value })} maxLength={40} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Recipient Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input value={newMethod.account_name} onChange={(e) => setNewMethod({ ...newMethod, account_name: e.target.value })} maxLength={80} />
                    </div>
                  </>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full mt-4 font-bold"
                onClick={() => {
                  if (newMethod.method_type !== "other" && !newMethod.account_name) return toast.error("Name is required");
                  if (newMethod.method_type === "other" && !newMethod.label) return toast.error("Method Name is required");
                  if (!newMethod.account_number && newMethod.method_type !== "paybill") return toast.error("Number/Account is required");
                  if (newMethod.method_type === "paybill" && (!newMethod.paybill_number || !newMethod.account_number)) return toast.error("Paybill number and Account number are required");
                  
                  const isFirst = methods.length === 0;
                  setMethods([...methods, { ...newMethod, is_primary: isFirst }]);
                  setNewMethod(emptyPM());
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </section>

            {/* Added Payment Methods */}
            <section className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 border-border/60">
                <div>
                  <h2 className="font-bold text-foreground text-lg">
                    Select your preferred payment method
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    The method marked as Primary will be prioritized on your public profile page.
                  </p>
                </div>
                {methods.length > 0 && !methods.some((m) => m.is_primary) && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-bounce">
                    <AlertCircle className="h-3 w-3" />
                    No Primary Set
                  </div>
                )}
              </div>

              {methods.length === 0 ? (
                <div className="text-sm text-muted-foreground py-10 text-center border rounded-xl border-dashed bg-muted/10 border-border/80 flex flex-col items-center justify-center gap-2">
                  <Coins className="h-8 w-8 text-muted-foreground/50" />
                  <span>No payment methods added yet. Add one above.</span>
                </div>
              ) : (
                <div className="grid gap-3">
                  {methods.map((m, i) => {
                    let MethodIcon = Coins;
                    let displayType = m.method_type.replace(/_/g, " ");
                    if (m.method_type === "send_money") {
                      MethodIcon = Smartphone;
                      displayType = "M-Pesa Send Money";
                    } else if (m.method_type === "till") {
                      MethodIcon = Wallet;
                      displayType = "M-Pesa Till Number";
                    } else if (m.method_type === "paybill") {
                      MethodIcon = Landmark;
                      displayType = "M-Pesa Paybill";
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => handleSetPrimaryRequest(i)}
                        className={`group relative flex items-center justify-between rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                          m.is_primary
                            ? "border-primary bg-primary/3 shadow-sm shadow-primary/5"
                            : "border-border/80 hover:border-primary/40 hover:bg-muted/30 hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Checked Indicator */}
                          <div
                            className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${
                              m.is_primary
                                ? "border-primary bg-primary text-primary-foreground scale-110 shadow-sm"
                                : "border-muted-foreground/30 group-hover:border-primary/60 group-hover:scale-105"
                            }`}
                          >
                            {m.is_primary && <Check className="h-3 w-3 stroke-3" />}
                          </div>

                          {/* Method Details */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-lg transition-colors ${
                                m.is_primary
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
                              }`}
                            >
                              <MethodIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground capitalize">
                                  {displayType}
                                </span>
                                {m.label && m.method_type === "other" && (
                                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                    {m.label}
                                  </span>
                                )}
                                {m.is_primary && (
                                  <span className="text-[9px] font-black tracking-wider uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full leading-none scale-90">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                <span className="font-mono tracking-tight font-medium text-foreground/80">
                                  {m.method_type === "paybill"
                                    ? `Paybill: ${m.paybill_number} · Acct: ${m.account_number}`
                                    : `${m.account_number}`}
                                </span>
                                {m.account_name && (
                                  <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span className="italic">{m.account_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!m.is_primary && (
                            <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-1 hidden sm:inline-block">
                              Click to make primary
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleDeleteMethod(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Action buttons */}
            {isEditMode ? (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => nav({ to: "/dashboard" })}>
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2 font-bold"
                  onClick={() => {
                    const parsed = profileSchema.safeParse(data);
                    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
                    setShowEditConfirm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Confirm Changes
                </Button>
              </div>
            ) : (
              <Button size="lg" className="w-full font-bold gap-2" onClick={validateAndReview}>
                Review & Continue
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          /* Review step */
          <div className="space-y-4">
            {/* Profile summary */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-4 mb-4">
                {data.photo_url ? (
                  <img src={data.photo_url} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground border-2 border-transparent">
                    <span className="text-xs">No photo</span>
                  </div>
                )}
                <h2 className="font-bold text-foreground">Profile Details</h2>
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <Field k="Full name" v={`${data.first_name} ${data.surname}`} />
                <Field k="Display name" v={data.display_name || "—"} />
                <Field k="Phone" v={data.phone} />
                <Field k="City" v={data.city} />
                <Field k="Vehicle" v={`${data.vehicle_type} · ${data.plate_number}`} />
                <Field k="Route" v={data.route} />
                {data.bio && <div className="sm:col-span-2"><Field k="Bio" v={data.bio} /></div>}
              </dl>
            </div>

            {/* Payment methods summary */}
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-bold mb-4 text-foreground">Payment Methods</h2>
              <ul className="space-y-2">
                {methods.map((m, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                    <div>
                      <div className="font-semibold capitalize flex items-center gap-2">
                        {m.method_type}
                        {m.is_primary && (
                          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-bold">Primary</span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {m.method_type === "paybill" ? `${m.paybill_number} · ${m.account_number}` : m.account_number}
                        {m.label ? ` · ${m.label}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")} disabled={saving}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Edit Details
              </Button>
              <Button
                className="flex-1 font-bold"
                onClick={saveNewProfile}
                disabled={saving}
              >
                Confirm & Create Profile
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Changes Dialog (edit mode) */}
      <ConfirmChangesDialog
        open={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={saveEditsConfirmed}
        loading={saving}
        title="Confirm Changes"
        message="Are you sure you want to save these profile updates?"
        confirmLabel="Save Changes"
      />

      {/* Set Primary Payment Method Confirmation Dialog */}
      <AppDialog
        open={showPrimaryConfirm}
        onClose={() => {
          setShowPrimaryConfirm(false);
          setPrimaryIndexToConfirm(null);
        }}
        variant="confirm"
        title="Set as Primary Payment Method"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to set this payment method as your primary option?
          </p>
          {primaryIndexToConfirm !== null && methods[primaryIndexToConfirm] && (
            <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
              <div className="font-bold text-sm capitalize text-foreground flex items-center gap-2">
                {methods[primaryIndexToConfirm].method_type === "send_money" && <Smartphone className="h-4 w-4 text-primary" />}
                {methods[primaryIndexToConfirm].method_type === "till" && <Wallet className="h-4 w-4 text-primary" />}
                {methods[primaryIndexToConfirm].method_type === "paybill" && <Landmark className="h-4 w-4 text-primary" />}
                {methods[primaryIndexToConfirm].method_type === "other" && <Coins className="h-4 w-4 text-primary" />}
                {methods[primaryIndexToConfirm].method_type.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {methods[primaryIndexToConfirm].method_type === "paybill"
                  ? `Paybill: ${methods[primaryIndexToConfirm].paybill_number} · Acct: ${methods[primaryIndexToConfirm].account_number}`
                  : methods[primaryIndexToConfirm].account_number}
                {methods[primaryIndexToConfirm].account_name && ` (${methods[primaryIndexToConfirm].account_name})`}
              </div>
            </div>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 font-medium flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>This method will be featured at the top of your public profile page for client reference and payments.</span>
          </p>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowPrimaryConfirm(false);
              setPrimaryIndexToConfirm(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={confirmPrimaryMethod} className="gap-2">
            <Check className="h-4 w-4" />
            Yes, Set as Primary
          </Button>
        </div>
      </AppDialog>

      {/* Payment Confirmation Dialog (new profile) */}
      {cropImage && (
        <div className="fixed inset-0 z-100 flex flex-col bg-background/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in zoom-in-95">
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-4 shadow-2xl">
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
            />
          </div>
          <div className="flex gap-4 items-center justify-center">
            <Button variant="outline" size="lg" className="w-full max-w-50" onClick={() => setCropImage(null)}>
              Cancel
            </Button>
            <Button size="lg" className="w-full max-w-50" onClick={confirmCrop}>
              Confirm Crop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium">{k}</dt>
      <dd className="font-semibold text-foreground mt-0.5">{v || "—"}</dd>
    </div>
  );
}

// Utility to extract cropped image blob using Canvas
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Canvas is empty"));
      else resolve(blob);
    }, "image/jpeg", 0.9);
  });
}
