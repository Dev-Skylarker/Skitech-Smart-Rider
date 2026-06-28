import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ImagePlus, Package, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";

export const Route = createFileRoute("/_admin/admin/shop")({ component: AdminShop });

type ShopItem = {
  id: string;
  name: string;
  description: string | null;
  price_kes: number;
  cover_image: string | null;
  gallery_images: string[];
  in_stock: boolean;
  created_at: string;
};

const MAX_IMAGE_SIZE_MB = 2;

const emptyItem = () => ({
  name: "",
  description: "",
  price_kes: 0,
  cover_image: "",
  gallery_images: [] as string[],
  in_stock: true,
});

function AdminShop() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ShopItem | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [galleryInput, setGalleryInput] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("shop_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as ShopItem[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditItem(null);
    setForm(emptyItem());
    setGalleryInput("");
    setShowForm(true);
  }

  function openEdit(item: ShopItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price_kes: item.price_kes,
      cover_image: item.cover_image ?? "",
      gallery_images: item.gallery_images ?? [],
      in_stock: item.in_stock,
    });
    setGalleryInput("");
    setShowForm(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: "cover" | "gallery") {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      toast.error(`Image too large (max ${MAX_IMAGE_SIZE_MB}MB). Please compress it first.`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `shop/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("shop_images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      // If storage bucket doesn't exist, use object URL as fallback
      const objectUrl = URL.createObjectURL(file);
      if (target === "cover") {
        setForm((f) => ({ ...f, cover_image: objectUrl }));
      } else {
        setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, objectUrl] }));
      }
      toast.warning("Storage bucket not configured — using local preview. Add a 'shop_images' bucket in Supabase Storage for production use.");
    } else {
      const { data: urlData } = supabase.storage.from("shop_images").getPublicUrl(path);
      const url = urlData.publicUrl;
      if (target === "cover") {
        setForm((f) => ({ ...f, cover_image: url }));
      } else {
        setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, url] }));
      }
      toast.success("Image uploaded");
    }
    setUploading(false);
  }

  function addGalleryUrl() {
    const url = galleryInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) { toast.error("Enter a valid URL starting with http"); return; }
    setForm((f) => ({ ...f, gallery_images: [...f.gallery_images, url] }));
    setGalleryInput("");
  }

  async function saveItem() {
    if (!form.name.trim()) return toast.error("Item name is required");
    if (form.price_kes < 0) return toast.error("Price must be 0 or more");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_kes: Number(form.price_kes),
      cover_image: form.cover_image.trim() || null,
      gallery_images: form.gallery_images,
      in_stock: form.in_stock,
      created_by: user?.id,
    };

    let error;
    if (editItem) {
      ({ error } = await supabase.from("shop_items").update(payload).eq("id", editItem.id));
    } else {
      ({ error } = await supabase.from("shop_items").insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editItem ? "Item updated" : "Item added to shop");
    setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("shop_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item removed from shop");
    setDeleteId(null);
    load();
  }

  async function toggleStock(item: ShopItem) {
    const { error } = await supabase.from("shop_items").update({ in_stock: !item.in_stock }).eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Shop Management</h1>
            <p className="text-muted-foreground text-sm">{items.length} items in the shop</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="font-semibold text-lg mb-2">No shop items yet</div>
          <p className="text-muted-foreground text-sm mb-4">Add your first item to get started</p>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Cover image */}
              <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{item.name}</div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <Badge variant={item.in_stock ? "default" : "outline"} className="flex-shrink-0 text-xs">
                    {item.in_stock ? "In stock" : "Out of stock"}
                  </Badge>
                </div>

                <div className="text-xl font-black text-primary mb-3">KES {item.price_kes.toLocaleString()}</div>

                {/* Gallery count */}
                {item.gallery_images?.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-3">
                    {item.gallery_images.length} gallery image{item.gallery_images.length > 1 ? "s" : ""}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => toggleStock(item)} title={item.in_stock ? "Mark out of stock" : "Mark in stock"}>
                    {item.in_stock ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form dialog */}
      <AppDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        variant="info"
        title={editItem ? "Edit Shop Item" : "Add New Item"}
        showClose={true}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label>Item name *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="QR Sticker Pack" maxLength={100} />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Weatherproof QR sticker…" maxLength={500} />
          </div>

          <div className="space-y-1">
            <Label>Price (KES) *</Label>
            <Input type="number" min={0} value={form.price_kes} onChange={(e) => setForm((f) => ({ ...f, price_kes: Number(e.target.value) }))} />
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex gap-2">
              <Input
                value={form.cover_image}
                onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                placeholder="https://... or upload below"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-border hover:border-primary px-4 py-2 text-sm text-muted-foreground transition-colors">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Uploading…" : `Upload image (max ${MAX_IMAGE_SIZE_MB}MB)`}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileUpload(e, "cover")} disabled={uploading} />
              </label>
            </div>
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover preview" className="h-24 w-24 object-cover rounded-xl border" />
            )}
          </div>

          {/* Gallery images */}
          <div className="space-y-2">
            <Label>Gallery Images</Label>
            <div className="flex gap-2">
              <Input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} placeholder="https://..." className="flex-1" />
              <Button type="button" size="sm" variant="outline" onClick={addGalleryUrl}>Add URL</Button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-border hover:border-primary px-4 py-2 text-sm text-muted-foreground transition-colors">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading…" : `Upload gallery image (max ${MAX_IMAGE_SIZE_MB}MB)`}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileUpload(e, "gallery")} disabled={uploading} />
            </label>
            {form.gallery_images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.gallery_images.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Gallery ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, gallery_images: f.gallery_images.filter((_, idx) => idx !== i) }))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In stock toggle */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setForm((f) => ({ ...f, in_stock: !f.in_stock }))}
              className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ${form.in_stock ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={form.in_stock}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.in_stock ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-sm font-medium">{form.in_stock ? "In stock" : "Out of stock"}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={saveItem} disabled={saving || uploading}>
              {saving ? "Saving…" : editItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </AppDialog>

      {/* Delete confirmation */}
      <AppDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        variant="error"
        title="Remove this item?"
        message="This will permanently remove the item from the shop."
        actions={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteItem(deleteId!)}>Remove Item</Button>
          </>
        }
      />
    </div>
  );
}
