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

// ✅ Cloudinary cloud name (public)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => {
  if (!x) return x;
  const id = getId(x);
  // Always expose "category" even if backend returns "level"
  const category = x.category || x.level || "";
  return { ...x, id, category };
};

// 🔐 Ask backend for a short-lived signature
async function getCloudinarySignature({ folder = "courses" } = {}) {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) {
    const txt = (await res.text()) || res.statusText;
    throw new Error(`Signature request failed: ${txt}`);
  }
  return res.json(); // { timestamp, signature, apiKey, folder }
}

// 🚀 Upload directly to Cloudinary with progress
async function uploadToCloudinary({ file, onProgress, folder = "courses" }) {
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

export default function Courses() {
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
    data: courses = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/courses`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000, // ✅ reduce refetch thrash
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      // send both category + level so any backend variant works
      const payload = { ...data, level: data.category };
      const res = await apiRequest("POST", `${API_BASE}/api/courses`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/courses"] });
      closeDialog();
      toast({ title: "Success", description: "Course created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing course id");
      const payload = { ...data, level: data.category };
      const res = await apiRequest("PUT", `${API_BASE}/api/courses/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/courses"] });
      closeDialog();
      toast({ title: "Success", description: "Course updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });

  // DELETE
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing course id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/courses/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/courses"] });
      toast({ title: "Success", description: "Course deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete course",
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
        folder: "courses",
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

    const data = {
      name: (fd.get("name") || "").toString().trim(),
      category: (fd.get("category") || "").toString().trim(), // UI field
      duration: (fd.get("duration") || "").toString(),
      description: (fd.get("description") || "").toString(),
      // ✅ Prefer uploaded URL, allow pasted fallback
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString().trim(),
    };

    if (!data.name || !data.category) {
      toast({
        title: "Missing fields",
        description: "Course name and category are required.",
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
        <div className="p-6 lg:p-8">Loading jobs...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load jobs: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Job Demands</h1>
            <p className="text-muted-foreground">Manage Job Demands</p>
          </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              data-testid="button-add-course"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Job Demand
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Job" : "Add New Job"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Job Title *</Label>
                <Input id="name" name="name" defaultValue={editingItem?.name || ""} required />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editingItem?.category || ""}
                  required
                  placeholder="e.g., Engineering, Business, Arts"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  defaultValue={editingItem?.duration || ""}
                  placeholder="e.g., 3 Months, 1 Year"
                />
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

              <Button type="submit" className="w-full" disabled={isUploading}>
                {editingItem ? "Update" : "Create"} Job
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => {
            const id = getId(item);
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
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    fetchPriority="low"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <p className="text-xs text-primary mb-2">{item.category}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.duration && (
                    <div className="text-sm mb-3">
                      <span className="font-medium">Duration:</span> {item.duration}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(normalize(item));
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!id) {
                          toast({
                            title: "Missing ID",
                            description: "This JOB does not have an id field.",
                            variant: "destructive",
                          });
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

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No JOBS added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
