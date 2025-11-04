import { useEffect, useRef, useState } from "react";
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

const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const getId = (s) => s?.id ?? s?._id ?? null;
const normalize = (s) => ({ ...s, id: getId(s) });
const transformCard = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_720,c_fill,g_auto/")
    : url;
const transformHero = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_1600/")
    : url;

async function getSignature(folder = "sliders") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function uploadToCloudinary({ file, onProgress, folder = "sliders" }) {
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

export default function Sliders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingSlider, setEditingSlider] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // upload state
  const [imageUrl, setImageUrl] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const { data: sliders = [], isLoading, isError, error } = useQuery({
    queryKey: [API_BASE, "/api/sliders"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/sliders`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  const createSlider = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/sliders`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      closeDialog();
      toast({ title: "Success", description: "Slider created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to create slider", variant: "destructive" });
    },
  });

  const updateSlider = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing slider id");
      const res = await apiRequest("PUT", `${API_BASE}/api/sliders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      closeDialog();
      toast({ title: "Success", description: "Slider updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to update slider", variant: "destructive" });
    },
  });

  const deleteSlider = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing slider id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/sliders/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      toast({ title: "Success", description: "Slider deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to delete slider", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (editingSlider && typeof editingSlider.isActive === "boolean") {
      setIsActive(!!editingSlider.isActive);
    } else {
      setIsActive(true);
    }
  }, [editingSlider, isDialogOpen]);

  function openCreate() {
    setEditingSlider(null);
    setIsActive(true);
    setImageUrl("");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function openEdit(slider) {
    const norm = normalize(slider);
    setEditingSlider(norm);
    setIsActive(!!norm.isActive);
    setImageUrl(norm.imageUrl || "");
    setFileObj(null);
    setUploadPct(0);
    setIsUploading(false);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setEditingSlider(null);
    setIsActive(true);
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
        folder: "sliders",
      });
      setImageUrl(result.secure_url);
      toast({ title: "Uploaded", description: "Slider image uploaded to Cloudinary" });
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      title: (formData.get("title") || "").toString(),
      subtitle: (formData.get("subtitle") || "").toString(),
      imageUrl: imageUrl || (formData.get("imageUrlFallback") || "").toString(),
      buttonText: (formData.get("buttonText") || "").toString(),
      buttonLink: (formData.get("buttonLink") || "").toString(),
      order: parseInt((formData.get("order") || "0").toString(), 10) || 0,
      isActive: !!isActive,
    };

    if (!data.title || !data.imageUrl) {
      toast({
        title: "Missing fields",
        description: "Title and Image are required.",
        variant: "destructive",
      });
      return;
    }

    const id = getId(editingSlider);
    if (id) {
      updateSlider.mutate({ id, data });
    } else {
      createSlider.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading sliders...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load sliders: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Hero Sliders</h1>
            <p className="text-muted-foreground">Manage homepage slider images</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} data-testid="button-add-slider">
                <Plus className="w-4 h-4 mr-2" />
                Add Slider
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSlider ? "Edit Slider" : "Add New Slider"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" defaultValue={editingSlider?.title || ""} required />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea id="subtitle" name="subtitle" defaultValue={editingSlider?.subtitle || ""} rows={2} />
                </div>

                {/* Cloudinary uploader */}
                <div className="space-y-2">
                  <Label>Image *</Label>
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

                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        className="w-full max-h-56 object-cover rounded"
                        alt="Preview"
                        src={transformHero(imageUrl)}
                        loading="eager"
                        decoding="async"
                        sizes="100vw"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input id="buttonText" name="buttonText" defaultValue={editingSlider?.buttonText || ""} />
                  </div>
                  <div>
                    <Label htmlFor="buttonLink">Button Link</Label>
                    <Input id="buttonLink" name="buttonLink" defaultValue={editingSlider?.buttonLink || ""} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Order</Label>
                    <Input id="order" name="order" type="number" defaultValue={editingSlider?.order || 0} />
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} aria-label="Active" />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingSlider ? "Update" : "Create"} Slider
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sliders.map((slider) => {
            const id = getId(slider);
            const url = transformCard(slider.imageUrl || "");
            return (
              <Card key={id || slider.imageUrl} className="overflow-hidden">
                {url && (
                  <img
                    src={url}
                    alt={slider.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width:768px) 50vw, 100vw"
                    fetchPriority="low"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{slider.title}</h3>
                  {slider.subtitle && <p className="text-sm text-muted-foreground mb-3">{slider.subtitle}</p>}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${slider.isActive ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                      {slider.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(slider)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!id) {
                            toast({ title: "Missing ID", description: "This slider does not have an id field.", variant: "destructive" });
                            return;
                          }
                          deleteSlider.mutate(id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
