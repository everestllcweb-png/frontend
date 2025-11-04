import { useRef, useState } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pencil, Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const transformAvatar = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_160,h_160,c_fill,g_face/")
    : url;

async function getSignature(folder = "team") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function uploadToCloudinary({ file, onProgress, folder = "team" }) {
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

export default function Team() {
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

  const { data: team = [], isLoading, isError, error } = useQuery({
    queryKey: [API_BASE, "/api/team/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/team/all`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
    staleTime: 60_000,
  });

  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/team`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/team/all"] });
      closeDialog();
      toast({ title: "Success", description: "Team member created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to create team member", variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing team member id");
      const res = await apiRequest("PUT", `${API_BASE}/api/team/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/team/all"] });
      closeDialog();
      toast({ title: "Success", description: "Team member updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to update team member", variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing team member id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/team/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/team/all"] });
      toast({ title: "Success", description: "Team member deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.message || "Failed to delete team member", variant: "destructive" });
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
      toast({ title: "No file selected", description: "Choose an image first.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadPct(0);
      const result = await uploadToCloudinary({
        file: fileObj,
        onProgress: setUploadPct,
        folder: "team",
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
    const fd = new FormData(e.currentTarget);

    const orderRaw = (fd.get("order") || "").toString();
    const order = Number.isNaN(parseInt(orderRaw, 10)) ? 0 : parseInt(orderRaw, 10);

    const data = {
      name: (fd.get("name") || "").toString().trim(),
      position: (fd.get("position") || "").toString().trim(),
      imageUrl: imageUrl || (fd.get("imageUrlFallback") || "").toString().trim(),
      order,
      isActive: !!isActive,
    };

    if (!data.name || !data.position) {
      toast({ title: "Missing fields", description: "Name and Position are required.", variant: "destructive" });
      return;
    }

    const id = getId(editingItem);
    if (id) updateItem.mutate({ id, data });
    else createItem.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading team...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load team: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Team</h1>
            <p className="text-muted-foreground">Manage staff list shown on the About page</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Member" : "Add New Member"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" defaultValue={editingItem?.name || ""} required />
                </div>

                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input id="position" name="position" defaultValue={editingItem?.position || ""} required />
                </div>

                {/* Cloudinary uploader */}
                <div className="space-y-2">
                  <Label>Photo</Label>
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
                        className="w-24 h-24 object-cover rounded-full"
                        alt="Preview"
                        src={transformAvatar(imageUrl)}
                        loading="eager"
                        decoding="async"
                        sizes="96px"
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
                  <Label htmlFor="order">Order (lower shows first)</Label>
                  <Input id="order" name="order" type="number" defaultValue={editingItem?.order ?? 0} placeholder="0" />
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} aria-label="Active on site" />
                  <Label htmlFor="isActive">Active on site</Label>
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {editingItem ? "Update" : "Create"} Member
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((item) => {
            const id = getId(item);
            const initial = (item.name || "?").trim().charAt(0).toUpperCase();
            const avatar = transformAvatar(item.imageUrl || "");
            return (
              <Card key={id || item.name} className="p-5 flex gap-4 items-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-xl">{initial}</span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.position}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${item.isActive ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">Order: {item.order ?? 0}</div>

                  <div className="flex items-center justify-end gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!id) {
                          toast({ title: "Missing ID", description: "This member does not have an id field.", variant: "destructive" });
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

        {team.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No team members yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
