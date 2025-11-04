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

// ✅ Prod-safe base (works locally too)
const API_BASE = import.meta.env.VITE_API_URL || "";

// ✅ Cloudinary Cloud Name (public)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);

// 🔐 Ask backend for a short-lived signature
async function getCloudinarySignature({ folder = "classes" } = {}) {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) {
    const txt = (await res.text()) || res.statusText;
    throw new Error(`Signature request failed: ${txt}`);
  }
  return res.json(); // { timestamp, signature, apiKey, folder }
}

// 🚀 Upload directly to Cloudinary with progress
async function uploadToCloudinary({ file, onProgress, folder = "classes" }) {
  if (!CLOUDINARY_CLOUD_NAME) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME env");

  const { timestamp, signature, apiKey } = await getCloudinarySignature({ folder });

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
          }
        } catch (err) {
          reject(err);
        }
      }
    };
    xhr.open("POST", endpoint, true);
    xhr.send(fd);
  });

  return promise; // { secure_url, ... }
}

export default function Classes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 📷 local upload state
  const [imageUrl, setImageUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // READ
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/classes"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/classes`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000, // ✅ don’t refetch too often
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/classes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/classes"] });
      closeDialog();
      toast({ title: "Success", description: "Service created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing class id");
      const res = await apiRequest("PUT", `${API_BASE}/api/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/classes"] });
      closeDialog();
      toast({ title: "Success", description: "Service updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  // DELETE
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing class id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/classes/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/classes"] });
      toast({ title: "Success", description: "Service deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  function openCreateDialog() {
    setEditingItem(null);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEditDialog(item) {
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

  async function handleUploadClick() {
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
        folder: "classes",
      });
      setImageUrl(result.secure_url);
      toast({ title: "Uploaded", description: "Image uploaded to Cloudinary" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const capacityRaw = fd.get("capacity");
    const capacity =
      capacityRaw === null || capacityRaw === ""
        ? null
        : Number.isNaN(parseInt(capacityRaw.toString(), 10))
        ? null
        : parseInt(capacityRaw.toString(), 10);

    const data = {
      name: (fd.get("name") || "").toString(),
      instructor: (fd.get("instructor") || "").toString(),
      schedule: (fd.get("schedule") || "").toString(),
      description: (fd.get("description") || "").toString(),
      // ✅ Prefer Cloudinary URL; allow manual fallback
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString(),
      capacity,
    };

    if (!data.name) {
      toast({
        title: "Missing fields",
        description: "service name is required.",
        variant: "destructive",
      });
      return;
    }

    const id = getId(editingItem);
    if (id) {
      updateItem.mutate({ id, data });
    } else {
      createItem.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading services...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load services: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Services</h1>
            <p className="text-muted-foreground">Manage services and sessions</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-class">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Class" : "Add New Class"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input id="name" name="name" defaultValue={editingItem?.name || ""} required />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingItem?.description || ""}
                    rows={3}
                  />
                </div>

                {/* 📷 Image Upload Section (Cloudinary) */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setFileObj(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleUploadClick}
                      disabled={!fileObj || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Upload to Cloudinary
                        </>
                      )}
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="w-full h-2 bg-muted rounded">
                      <div
                        className="h-2 bg-primary rounded transition-all"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                  )}

                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        className="w-full max-h-56 object-cover rounded"
                        alt="Preview"
                        // ✅ large preview but still optimized
                        src={
                          imageUrl.includes("/upload/")
                            ? imageUrl.replace(
                                "/upload/",
                                "/upload/f_auto,q_auto,dpr_auto,w_1200/"
                              )
                            : imageUrl
                        }
                        loading="eager"
                        decoding="async"
                        sizes="100vw"
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">{imageUrl}</p>
                    </div>
                  )}

                  {/* Fallback manual URL (optional) */}
                  <div>
                    <Label htmlFor="imageUrlFallback" className="text-xs">
                      Or paste an image URL (fallback)
                    </Label>
                    <Input
                      id="imageUrlFallback"
                      name="imageUrlFallback"
                      placeholder="https://…"
                      defaultValue={imageUrl || ""}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Prefer uploading to Cloudinary to reduce host bandwidth.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule">Schedule</Label>
                    <Input
                      id="schedule"
                      name="schedule"
                      defaultValue={editingItem?.schedule || ""}
                      placeholder="e.g., Mon–Fri 9am–11am"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructor">Employer</Label>
                    <Input id="instructor" name="instructor" defaultValue={editingItem?.instructor || ""} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Quantity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    defaultValue={
                      editingItem?.capacity === null || editingItem?.capacity === undefined
                        ? ""
                        : editingItem.capacity
                    }
                    placeholder="Max workers"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((item) => {
            const id = getId(item);
            // ✅ small, optimized card image
            const displayUrl =
              (item.imageUrl || "").includes("/upload/")
                ? item.imageUrl.replace(
                    "/upload/",
                    "/upload/f_auto,q_auto,dpr_auto,w_480,c_fill,g_auto/"
                  )
                : item.imageUrl || "";

            return (
              <Card key={id || item.name} className="overflow-hidden">
                {displayUrl && (
                  <img
                    src={displayUrl}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    fetchPriority="low"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const safeId = getId(item);
                          if (!safeId) {
                            toast({
                              title: "Missing ID",
                              description: "This class does not have an id field.",
                              variant: "destructive",
                            });
                            return;
                          }
                          deleteItem.mutate(safeId);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  )}

                  <div className="space-y-1 text-sm">
                    {item.schedule && (
                      <div>
                        <span className="font-medium">Schedule:</span> {item.schedule}
                      </div>
                    )}
                    {item.instructor && (
                      <div>
                        <span className="font-medium">Employer:</span> {item.instructor}
                      </div>
                    )}
                    {item.capacity !== null && item.capacity !== undefined && (
                      <div>
                        <span className="font-medium">Capacity:</span> {item.capacity} workers
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
