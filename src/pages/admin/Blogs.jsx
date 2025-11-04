import { useEffect, useMemo, useRef, useState } from "react";
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
import { Pencil, Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { format } from "date-fns";

// ✅ Prod-safe base (works locally too)
const API_BASE = import.meta.env.VITE_API_URL || "";

// ✅ Your Cloud Name for uploads (public, safe on client)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const generateSlug = (title) =>
  (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// 🔐 Get a short-lived signed payload from your backend for a secure direct upload
async function getCloudinarySignature({ folder = "blogs" } = {}) {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) {
    const txt = (await res.text()) || res.statusText;
    throw new Error(`Signature request failed: ${txt}`);
  }
  return res.json(); // { timestamp, signature, apiKey, folder }
}

// 🚀 Upload file directly to Cloudinary using the signature from your backend
async function uploadToCloudinary({ file, onProgress, folder = "blogs" }) {
  if (!CLOUDINARY_CLOUD_NAME) throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME env");
  const { timestamp, signature, apiKey } = await getCloudinarySignature({ folder });

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);
  // Optional: eager transformations for thumbnails, etc.

  // Use XHR to report progress
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
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

  const result = await promise;
  // result.secure_url is your canonical image URL
  return result;
}

export default function Blogs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // 📷 local image state
  const [imageUrl, setImageUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // READ (admins will see all because server inspects session)
  const {
    data: blogs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/blogs"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/blogs`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/blogs`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/blogs"] });
      resetDialog();
      toast({ title: "Success", description: "Blog post created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing blog id");
      const res = await apiRequest("PUT", `${API_BASE}/api/blogs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/blogs"] });
      resetDialog();
      toast({ title: "Success", description: "Blog post updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  // DELETE
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing blog id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/blogs/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/blogs"] });
      toast({ title: "Success", description: "Blog post deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  function openCreateDialog() {
    setEditingItem(null);
    setIsPublished(false);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEditDialog(item) {
    const norm = normalize(item);
    setEditingItem(norm);
    setIsPublished(!!norm.isPublished);
    setImageUrl(norm.imageUrl || "");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function resetDialog() {
    setEditingItem(null);
    setIsPublished(false);
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
        folder: "blogs",
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

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const title = (fd.get("title") || "").toString().trim();
    if (!title) {
      toast({
        title: "Missing fields",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    // Require an image URL if you want; otherwise optional
    // if (!imageUrl) { ... }

    const data = {
      title,
      slug: generateSlug(title),
      excerpt: (fd.get("excerpt") || "").toString(),
      content: (fd.get("content") || "").toString(),
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString(), // fallback field
      category: (fd.get("category") || "").toString(),
      author: (fd.get("author") || "").toString(),
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
    };

    const id = getId(editingItem);
    if (id) {
      updateItem.mutate({ id, data });
    } else {
      createItem.mutate(data);
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading blog posts...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load blogs: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Blog Posts</h1>
            <p className="text-muted-foreground">Manage blog articles and news</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-blog">
                <Plus className="w-4 h-4 mr-2" />
                Add Blog Post
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" defaultValue={editingItem?.title || ""} required />
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug will be auto-generated from title
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    defaultValue={editingItem?.excerpt || ""}
                    rows={2}
                    placeholder="Brief summary..."
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingItem?.content || ""}
                    rows={8}
                    required
                  />
                </div>

                {/* 📷 Image Upload Section */}
                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setFileObj(f || null);
                      }}
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

                  {/* Show preview if available */}
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        className="w-full max-h-56 object-cover rounded"
                        alt="Preview"
                        // Serve responsive/optimized variant (low traffic)
                        src={`${imageUrl.replace(
                          "/upload/",
                          "/upload/f_auto,q_auto,w_1200/"
                        )}`}
                        loading="lazy"
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {imageUrl}
                      </p>
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
                      Tip: Prefer uploading to Cloudinary to reduce Netlify bandwidth.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" name="author" defaultValue={editingItem?.author || ""} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={editingItem?.category || ""}
                      placeholder="e.g., Study Tips"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isPublished"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                    aria-label="Published"
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Blog Post
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map((item) => {
            const id = getId(item);
            const displayUrl = (item.imageUrl || "").includes("/upload/")
              ? item.imageUrl.replace("/upload/", "/upload/f_auto,q_auto,w_800/")
              : item.imageUrl || "";

            return (
              <Card key={id || item.slug || item.title} className="overflow-hidden">
                {displayUrl && (
                  <img src={displayUrl} alt={item.title} className="w-full h-40 object-cover" loading="lazy" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg flex-1">{item.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ml-2 ${
                        item.isPublished ? "bg-primary/10 text-primary" : "bg-muted"
                      }`}
                    >
                      {item.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">Slug: {item.slug}</p>

                  {item.excerpt && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    {item.author && <span>By {item.author}</span>}
                    {item.publishedAt && (
                      <span>{format(new Date(item.publishedAt), "MMM d, yyyy")}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!id) {
                          toast({
                            title: "Missing ID",
                            description: "This blog post does not have an id field.",
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

        {blogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No blog posts yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
