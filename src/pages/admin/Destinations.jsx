// frontend/src/pages/admin/Destinations.jsx
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

// ✅ Prod-safe base (also works locally)
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);

export default function Destinations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/destinations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/destinations"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Destination created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create destination",
        variant: "destructive",
      });
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
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Destination updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update destination",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: err?.message || "Failed to delete destination",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      name: (fd.get("name") || "").toString(),
      country: (fd.get("country") || "").toString(),
      imageUrl: (fd.get("imageUrl") || "").toString(),
      description: (fd.get("description") || "").toString(),
      universityCount: parseInt((fd.get("universityCount") || "0").toString(), 10) || 0,
    };

    if (!data.name || !data.country || !data.imageUrl) {
      toast({
        title: "Missing fields",
        description: "Name, Country, and Image URL are required.",
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
            <h1 className="text-3xl font-bold text-foreground mb-2"> Destinations</h1>
            <p className="text-muted-foreground">Manage  abroad destinations</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)} data-testid="button-add-destination">
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
                  <Input id="country" name="country" defaultValue={editingItem?.country || ""} required placeholder="e.g., USA" />
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL *</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl || ""} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingItem?.description || ""} rows={3} />
                </div>
                <div>
                  <Label htmlFor="universityCount">Employees Count</Label>
                  <Input id="universityCount" name="universityCount" type="number" min="0" defaultValue={editingItem?.universityCount || 0} />
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"} Destination
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((item) => {
            const id = getId(item);
            return (
              <Card key={id || item.name} className="overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.country}</p>
                  {item.description && <p className="text-sm mb-3 line-clamp-2">{item.description}</p>}
                  <div className="text-sm text-primary mb-3">
                    {item.universityCount} {item.universityCount === 1 ? "Workers" : "Workers"}
                  </div>
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
                            description: "This destination does not have an id field.",
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

        {destinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No destinations added yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
