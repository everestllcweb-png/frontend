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

// ✅ Prod-safe base (also works locally)
const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const transformCard = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_480,c_fill,g_auto/")
    : url;

// Signature + upload
async function getSignature(folder = "destinations") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { timestamp, signature, apiKey, folder }
}

async function uploadToCloudinary({ file, onProgress, folder = "destinations" }) {
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

  return p; // { secure_url, ... }
}

export default function Destinations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // upload state
  const [imageUrl, setImageUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  // READ
  const {
    data: destinations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/destinations"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/destinations`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/destinations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/destinations"] });
      closeDialog();
      toast({ title: "Success", description: "Destination created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to create destination", variant: "destructive" });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing destination id");
      const res = await apiRequest("PUT", `${API_BASE}/api/destinations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/destinations"] });
      closeDialog();
      toast({ title: "Success", description: "Destination updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to update destination", variant: "destructive" });
    },
  });

  // DELETE
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing destination id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/destinations/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/destinations"] });
      toast({ title: "Success", description: "Destination deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to delete destination", variant: "destructive" });
    },
  });

  function openCreate() {
    setEditingItem(null);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEdit(item) {
    const norm = normalize(item);
    setEditingItem(norm);
    setImageUrl(norm.imageUrl || "");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setEditingItem(null);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(false);
  }

  async function handleUpload() {
    if (!fileObj) {
      toast({ title: "No file selected", description: "Choose an image first.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadPct(0);
      const result = await uploadToCloudinary({
        file: fileObj,
        onProgress: setUploadPct,
        folder: "destinations",
      });
      setImageUrl(result.secure_url);
      toast({ title: "Uploaded", description: "Image uploaded to Cloudinary" });
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

    const data = {
      name: (fd.get("name") || "").toString().trim(),
      country: (fd.get("country") || "").toString().trim(), // you labelled “City *” — sending as country to keep backend unchanged
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString().trim(),
      description: (fd.get("description") || "").toString(),
      universityCount: parseInt((fd.get("universityCount") || "0").toString(), 10) || 0,
    };

    if (!data.name || !data.country || !data.imageUrl) {
      toast({
        title: "Missing fields",
        description: "Name, Country/City, and Image are required.",
        variant: "destructive",
      });
      return;
    }

    const id = getId(editingItem);
    if (id) updateItem.mutate({ id, data });
    else createItem.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading destinations...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load destinations: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Destinations</h1>
            <p className="text-muted-foreground">Manage abroad destinations</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} data-testid="button-add-destination">
                <Plus className="w-4 h-4 mr-2" />
                Add Destination
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Destination" : "Add New Destination"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Destination Name *</Label>
                  <Input id="name" name="name" defaultValue={editingItem?.name || ""} required placeholder="e.g., United States" />
                </div>
                <div>
                  <Label htmlFor="country">City *</Label>
                  <Input id="country" name="country" defaultValue={editingItem?.country || ""} required placeholder="e.g., New York" />
                </div>

                {/* Cloudinary uploader */}
                <div className="space-y-2">
                  <Label>Image *</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={(e) => setFileObj(e.target.files?.[0] || null)}
                    />
                    <Button type="button" variant="secondary" onClick={handleUpload} disabled={!fileObj || isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" /> Upload to Cloudinary
                        </>
                      )}
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="w-full h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded transition-all" style={{ width: `${uploadPct}%` }} />
                    </div>
                  )}

                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        className="w-full max-h-56 object-cover rounded"
                        alt="Preview"
                        src={
                          imageUrl.includes("/upload/")
                            ? imageUrl.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_1200/")
                            : imageUrl
                        }
                        loading="eager"
                        decoding="async"
                        sizes="100vw"
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">{imageUrl}</p>
                    </div>
                  )}

                  {/* Fallback URL */}
                  <div>
                    <Label htmlFor="imageUrlFallback" className="text-xs">Or paste image URL</Label>
                    <Input
                      id="imageUrlFallback"
                      name="imageUrlFallback"
                      placeholder="https://…"
                      defaultValue={imageUrl || ""}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingItem?.description || ""} rows={3} />
                </div>
                <div>
                  <Label htmlFor="universityCount">Employees Count</Label>
                  <Input id="universityCount" name="universityCount" type="number" min="0" defaultValue={editingItem?.universityCount || 0} />
                </div>
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Destination
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((item) => {
            const id = getId(item);
            const cardUrl = transformCard(item.imageUrl || "");
            return (
              <Card key={id || item.name} className="overflow-hidden">
                {cardUrl && (
                  <img
                    src={cardUrl}
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
                  <p className="text-sm text-muted-foreground mb-2">{item.country}</p>
                  {item.description && <p className="text-sm mb-3 line-clamp-2">{item.description}</p>}
                  <div className="text-sm text-primary mb-3">
                    {item.universityCount} {item.universityCount === 1 ? "Worker" : "Workers"}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!id) {
                          toast({ title: "Missing ID", description: "This destination does not have an id field.", variant: "destructive" });
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

        {destinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No destinations added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
