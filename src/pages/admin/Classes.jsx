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

// ✅ Prod-safe base (works locally too)
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);

export default function Classes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/classes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/classes"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Class created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create class",
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
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Class updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update class",
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
      imageUrl: (fd.get("imageUrl") || "").toString(),
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
            <p className="text-muted-foreground">Manage services  and sessions</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)} data-testid="button-add-class">
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

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl || ""} />
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
                    <Input
                      id="instructor"
                      name="instructor"
                      defaultValue={editingItem?.instructor || ""}
                    />
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

                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"} Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((item) => {
            const id = getId(item);
            return (
              <Card key={id || item.name} className="overflow-hidden">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="flex gap-2">
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
