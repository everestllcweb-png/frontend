// frontend/src/pages/admin/Universities.jsx
import { useState } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => {
  if (!x) return x;
  const id = getId(x);
  // ensure frontend-friendly names always exist
  const logoUrl = x.logoUrl || x.imageUrl || "";
  const websiteUrl = x.websiteUrl || x.website || "";
  return { ...x, id, logoUrl, websiteUrl };
};

export default function Universities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // READ
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
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/universities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/universities"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "University created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create university",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing university id");
      const res = await apiRequest("PUT", `${API_BASE}/api/universities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/universities"] });
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "University updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update university",
        variant: "destructive",
      });
    },
  });

  // DELETE
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
      toast({
        title: "Error",
        description: err?.message || "Failed to delete university",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = (fd.get("name") || "").toString().trim();
    const country = (fd.get("country") || "").toString().trim();
    const description = (fd.get("description") || "").toString();
    const logoUrl = (fd.get("logoUrl") || "").toString().trim();
    const websiteUrl = (fd.get("websiteUrl") || "").toString().trim();

    if (!name || !country) {
      toast({
        title: "Missing fields",
        description: "University name and country are required.",
        variant: "destructive",
      });
      return;
    }

    // send both new and legacy keys so any backend version is happy
    const payload = {
      name,
      country,
      description,
      logoUrl,
      websiteUrl,
      imageUrl: logoUrl, // legacy mirror
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
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
                data-testid="button-add-university"
              >
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
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingItem?.description || ""}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo/Image URL</Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={editingItem?.logoUrl || ""} />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    defaultValue={editingItem?.websiteUrl || ""}
                    placeholder="https://..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"} Partner
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((item) => {
            const id = getId(item);
            return (
              <Card key={id || item.name} className="overflow-hidden">
                {item.logoUrl && (
                  <img src={item.logoUrl} alt={item.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.country}</p>
                  {item.description && (
                    <p className="text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
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
                            description: "This university does not have an id field.",
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

        {universities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No partners added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
