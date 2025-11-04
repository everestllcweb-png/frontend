import { useRef, useState } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Switch } from "../../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pencil, Trash2, Plus, Star, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n || 0));
const transformAvatar = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_160,h_160,c_fill,g_face/")
    : url;

async function getSignature(folder = "reviews") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function uploadToCloudinary({ file, onProgress, folder = "reviews" }) {
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

export default function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // upload state
  const [imageUrl, setImageUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const {
    data: reviews = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/reviews"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/reviews`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/reviews"] });
      closeDialog();
      toast({ title: "Success", description: "Review created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to create review", variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing review id");
      const res = await apiRequest("PUT", `${API_BASE}/api/reviews/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/reviews"] });
      closeDialog();
      toast({ title: "Success", description: "Review updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to update review", variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing review id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/reviews/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/reviews"] });
      toast({ title: "Success", description: "Review deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to delete review", variant: "destructive" });
    },
  });

  function openCreateDialog() {
    setEditingItem(null);
    setIsActive(true);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEditDialog(item) {
    const norm = normalize(item);
    setEditingItem(norm);
    setIsActive(!!norm.isActive);
    setImageUrl(norm.imageUrl || "");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setEditingItem(null);
    setIsActive(true);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(false);
  }

  async function handleUpload() {
    if (!fileObj) {
      toast({ title: "No file selected", description: "Choose a photo first.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadPct(0);
      const result = await uploadToCloudinary({
        file: fileObj,
        onProgress: setUploadPct,
        folder: "reviews",
      });
      setImageUrl(result.secure_url);
      toast({ title: "Uploaded", description: "Photo uploaded to Cloudinary" });
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

    const ratingRaw = (fd.get("rating") || "").toString();
    const ratingNum = clamp(parseInt(ratingRaw, 10), 1, 5);

    const data = {
      studentName: (fd.get("studentName") || "").toString(),
      university: (fd.get("university") || "").toString(),
      country: (fd.get("country") || "").toString(),
      rating: ratingNum,
      testimonial: (fd.get("testimonial") || "").toString(),
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString(),
      isActive: !!(fd.get("isActive") ?? true), // switch state also applied below
    };

    if (!data.studentName || !data.testimonial || !data.rating) {
      toast({
        title: "Missing fields",
        description: "Student name, testimonial, and a rating between 1–5 are required.",
        variant: "destructive",
      });
      return;
    }
    data.isActive = data.isActive && isActive;

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
        <div className="p-6 lg:p-8">Loading reviews...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load reviews: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Student Reviews</h1>
            <p className="text-muted-foreground">Manage testimonials and student feedback</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-review">
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Review" : "Add New Review"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input id="studentName" name="studentName" defaultValue={editingItem?.studentName || ""} required />
                </div>

                {/* Cloudinary photo */}
                <div className="space-y-2">
                  <Label>Student Photo</Label>
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
                        className="w-28 h-28 object-cover rounded-full"
                        alt="Preview"
                        src={transformAvatar(imageUrl)}
                        loading="eager"
                        decoding="async"
                        sizes="112px"
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">{imageUrl}</p>
                    </div>
                  )}

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
                  <Label htmlFor="testimonial">Testimonial *</Label>
                  <Textarea id="testimonial" name="testimonial" defaultValue={editingItem?.testimonial || ""} rows={4} required />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating (1–5) *</Label>
                    <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={editingItem?.rating ?? 5} required />
                  </div>
                  <div>
                    <Label htmlFor="university">University</Label>
                    <Input id="university" name="university" defaultValue={editingItem?.university || ""} placeholder="e.g., Harvard" />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" defaultValue={editingItem?.country || ""} placeholder="e.g., USA" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} aria-label="Active for display" />
                  <Label htmlFor="isActive">Active for display</Label>
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Review
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((item) => {
            const id = getId(item);
            const initial = (item.studentName || "?").toString().trim().charAt(0).toUpperCase();
            const rating = clamp(item.rating, 1, 5);
            const avatar = transformAvatar(item.imageUrl || "");

            return (
              <Card key={id || item.studentName} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={item.studentName || "Student"}
                      className="w-12 h-12 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{initial}</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{item.studentName}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.isActive ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-3">{item.testimonial}</p>

                {(item.university || item.country) && (
                  <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                    {item.university && <span><span className="font-medium">University:</span> {item.university}</span>}
                    {item.country && <span><span className="font-medium">Country:</span> {item.country}</span>}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const idToDelete = getId(item);
                      if (!idToDelete) {
                        toast({ title: "Missing ID", description: "This review does not have an id field.", variant: "destructive" });
                        return;
                      }
                      deleteItem.mutate(idToDelete);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
