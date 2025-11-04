import { useRef, useState } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pencil, Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => {
  if (!x) return x;
  const id = getId(x);
  const logoUrl = x.logoUrl || x.imageUrl || "";
  const websiteUrl = x.websiteUrl || x.website || "";
  return { ...x, id, logoUrl, websiteUrl };
};
const transformCard = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_480,c_fill,g_auto/")
    : url;

async function getSignature(folder = "universities") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function uploadToCloudinary({ file, onProgress, folder = "universities" }) {
  if (!CLOUD_NAME) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME");
  const { timestamp, signature, apiKey } = await getSignature(folder);

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const xhr = new XMLHttpRequest();

  const p = new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function")
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
        } catch (err) {
          reject(err);
        }
      }
    };
    xhr.open("POST", endpoint, true);
    xhr.send(fd);
  });

  return p;
}

export default function Universities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // upload state
  const [logoUrl, setLogoUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const {
    data: universities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/universities"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/universities`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/universities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/universities"] });
      closeDialog();
      toast({ title: "Success", description: "University created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to create university", variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing university id");
      const res = await apiRequest("PUT", `${API_BASE}/api/universities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/universities"] });
      closeDialog();
      toast({ title: "Success", description: "University updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to update university", variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing university id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/universities/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/universities"] });
      toast({ title: "Success", description: "University deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to delete university", variant: "destructive" });
    },
  });

  function openCreateDialog() {
    setEditingItem(null);
    setLogoUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEditDialog(item) {
    const norm = normalize(item);
    setEditingItem(norm);
    setLogoUrl(norm.logoUrl || "");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setEditingItem(null);
    setLogoUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(false);
  }

  async function handleUpload() {
    if (!fileObj) {
      toast({ title: "No file selected", description: "Choose a logo first.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadPct(0);
      const result = await uploadToCloudinary({
        file: fileObj,
        onProgress: setUploadPct,
        folder: "universities",
      });
      setLogoUrl(result.secure_url);
      toast({ title: "Uploaded", description: "Logo uploaded to Cloudinary" });
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = (fd.get("name") || "").toString().trim();
    const country = (fd.get("country") || "").toString().trim();
    const description = (fd.get("description") || "").toString();
    const websiteUrl = (fd.get("websiteUrl") || "").toString().trim();
    const finalLogo = logoUrl || (fd.get("logoUrlFallback") || "").toString().trim();

    if (!name || !country) {
      toast({ title: "Missing fields", description: "University name and country are required.", variant: "destructive" });
      return;
    }

    const payload = {
      name,
      country,
      description,
      logoUrl: finalLogo,
      websiteUrl,
      imageUrl: finalLogo, // legacy mirror
      website: websiteUrl, // legacy mirror
    };

    const id = getId(editingItem);
    if (id) {
      updateItem.mutate({ id, data: payload });
    } else {
      createItem.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading partners...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load partners: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Global Partners</h1>
            <p className="text-muted-foreground">Manage partners globally</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-university">
                <Plus className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit University" : "Add New University"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Partner Name *</Label>
                  <Input id="name" name="name" defaultValue={editingItem?.name || ""} required />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input id="country" name="country" defaultValue={editingItem?.country || ""} required />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingItem?.description || ""} rows={3} />
                </div>

                {/* Cloudinary upload */}
                <div className="space-y-2">
                  <Label>Logo/Image</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" ref={fileRef} onChange={(e) => setFileObj(e.target.files?.[0] || null)} />
                    <Button type="button" variant="secondary" onClick={handleUpload} disabled={!fileObj || isUploading}>
                      {isUploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>) : (<><ImageIcon className="w-4 h-4 mr-2" /> Upload to Cloudinary</>)}
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="w-full h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded transition-all" style={{ width: `${uploadPct}%` }} />
                    </div>
                  )}

                  {logoUrl && (
                    <div className="mt-2">
                      <img
                        className="w-full max-h-56 object-cover rounded"
                        alt="Preview"
                        src={
                          logoUrl.includes("/upload/")
                            ? logoUrl.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_1200/")
                            : logoUrl
                        }
                        loading="eager"
                        decoding="async"
                        sizes="100vw"
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">{logoUrl}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="logoUrlFallback" className="text-xs">Or paste image URL</Label>
                    <Input
                      id="logoUrlFallback"
                      name="logoUrlFallback"
                      placeholder="https://…"
                      defaultValue={logoUrl || ""}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input id="websiteUrl" name="websiteUrl" defaultValue={editingItem?.websiteUrl || ""} placeholder="https://..." />
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Partner
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((item) => {
            const id = getId(item);
            const url = transformCard(item.logoUrl || "");
            return (
              <Card key={id || item.name} className="overflow-hidden">
                {url && (
                  <img
                    src={url}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                    fetchPriority="low"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.country}</p>
                  {item.description && <p className="text-sm mb-3 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!id) {
                          toast({ title: "Missing ID", description: "This university does not have an id field.", variant: "destructive" });
                          return;
                        }
                        deleteItem.mutate(id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {universities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No partners added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
