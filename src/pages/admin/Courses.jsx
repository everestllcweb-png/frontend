// frontend/src/pages/admin/Courses.jsx
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
const normalize = (x) => {
  if (!x) return x;
  const id = getId(x);
  // Always expose "category" to the UI even if backend returns "level"
  const category = x.category || x.level || "";
  return { ...x, id, category };
};

export default function Courses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      setIsDialogOpen(false);
      setEditingItem(null);
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
      // send both category + level for compatibility
      const payload = { ...data, level: data.category };
      const res = await apiRequest("PUT", `${API_BASE}/api/courses/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/courses"] });
      setEditingItem(null);
      setIsDialogOpen(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      name: (fd.get("name") || "").toString().trim(),
      category: (fd.get("category") || "").toString().trim(),   // UI field
      duration: (fd.get("duration") || "").toString(),
      description: (fd.get("description") || "").toString(),
      imageUrl: (fd.get("imageUrl") || "").toString().trim(),
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
                onClick={() => {
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
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

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl || ""} />
                </div>

                <Button type="submit" className="w-full">
                  {editingItem ? "Update" : "Create"} Job
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => {
            const id = getId(item);
            return (
              <Card key={id || item.name} className="overflow-hidden">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <p className="text-xs text-primary mb-2">
                    {item.category /* normalized above */}
                  </p>
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
