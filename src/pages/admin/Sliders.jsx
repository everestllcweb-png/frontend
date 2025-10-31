import { useEffect, useState } from "react";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

// ✅ Use API base from env so it works on Render/Netlify too
const API_BASE = import.meta.env.VITE_API_URL || "";

// --- helpers ---
const getId = (s) => s?.id ?? s?._id ?? null;
const normalize = (s) => ({ ...s, id: getId(s) });

export default function Sliders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingSlider, setEditingSlider] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // -------- READ: sliders (normalize id) --------
  const { data: sliders = [], isLoading, isError, error } = useQuery({
    queryKey: [API_BASE, "/api/sliders"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/sliders`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
  });

  // -------- CREATE --------
  const createSlider = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/sliders`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      setIsDialogOpen(false);
      setEditingSlider(null);
      toast({ title: "Success", description: "Slider created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create slider",
        variant: "destructive",
      });
    },
  });

  // -------- UPDATE --------
  const updateSlider = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing slider id");
      const res = await apiRequest("PUT", `${API_BASE}/api/sliders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      setEditingSlider(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Slider updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update slider",
        variant: "destructive",
      });
    },
  });

  // -------- DELETE --------
  const deleteSlider = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing slider id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/sliders/${id}`, {});
      // some APIs return no content on delete
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/sliders"] });
      toast({ title: "Success", description: "Slider deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete slider",
        variant: "destructive",
      });
    },
  });

  // Keep Switch state synced
  useEffect(() => {
    if (editingSlider && typeof editingSlider.isActive === "boolean") {
      setIsActive(!!editingSlider.isActive);
    } else {
      setIsActive(true);
    }
  }, [editingSlider, isDialogOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      title: (formData.get("title") || "").toString(),
      subtitle: (formData.get("subtitle") || "").toString(),
      imageUrl: (formData.get("imageUrl") || "").toString(),
      buttonText: (formData.get("buttonText") || "").toString(),
      buttonLink: (formData.get("buttonLink") || "").toString(),
      order: parseInt((formData.get("order") || "0").toString(), 10) || 0,
      isActive: !!isActive,
    };

    if (!data.title || !data.imageUrl) {
      toast({
        title: "Missing fields",
        description: "Title and Image URL are required.",
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

  const openCreateDialog = () => {
    setEditingSlider(null);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (slider) => {
    setEditingSlider(normalize(slider));
    setIsActive(!!slider.isActive);
    setIsDialogOpen(true);
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
              <Button onClick={openCreateDialog} data-testid="button-add-slider">
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

                <div>
                  <Label htmlFor="imageUrl">Image URL *</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingSlider?.imageUrl || ""} required />
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

                <Button type="submit" className="w-full">
                  {editingSlider ? "Update" : "Create"} Slider
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sliders.map((slider) => {
            const id = getId(slider);
            return (
              <Card key={id || slider.imageUrl} className="overflow-hidden">
                <img src={slider.imageUrl} alt={slider.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{slider.title}</h3>
                  {slider.subtitle && <p className="text-sm text-muted-foreground mb-3">{slider.subtitle}</p>}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        slider.isActive ? "bg-primary/10 text-primary" : "bg-muted"
                      }`}
                    >
                      {slider.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(slider)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!id) {
                            toast({
                              title: "Missing ID",
                              description: "This slider does not have an id field.",
                              variant: "destructive",
                            });
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
