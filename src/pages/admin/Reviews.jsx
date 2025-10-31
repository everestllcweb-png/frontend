import { useState } from "react";
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
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

// ✅ Prod-safe base (works locally too)
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n || 0));

export default function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Radix Switch is not a native input → control it
  const [isActive, setIsActive] = useState(true);

  // READ (admin list; requires session)
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
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/reviews"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Review created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create review",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing review id");
      const res = await apiRequest("PUT", `${API_BASE}/api/reviews/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/reviews"] });
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Review updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update review",
        variant: "destructive",
      });
    },
  });

  // DELETE
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
      toast({
        title: "Error",
        description: err?.message || "Failed to delete review",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(normalize(item));
    setIsActive(!!item.isActive);
    setIsDialogOpen(true);
  };

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
      imageUrl: (fd.get("imageUrl") || "").toString(),
      isActive: !!isActive,
    };

    if (!data.studentName || !data.testimonial || !data.rating) {
      toast({
        title: "Missing fields",
        description: "Student name, testimonial, and a rating between 1–5 are required.",
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
                  <Input
                    id="studentName"
                    name="studentName"
                    defaultValue={editingItem?.studentName || ""}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Student Photo URL</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl || ""} />
                </div>

                <div>
                  <Label htmlFor="testimonial">Testimonial *</Label>
                  <Textarea
                    id="testimonial"
                    name="testimonial"
                    defaultValue={editingItem?.testimonial || ""}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating (1–5) *</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      min="1"
                      max="5"
                      defaultValue={editingItem?.rating ?? 5}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      name="university"
                      defaultValue={editingItem?.university || ""}
                      placeholder="e.g., Harvard"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={editingItem?.country || ""}
                      placeholder="e.g., USA"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    aria-label="Active for display"
                  />
                  <Label htmlFor="isActive">Active for display</Label>
                </div>

                <Button type="submit" className="w-full">
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

            return (
              <Card key={id || item.studentName} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.studentName || "Student"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{initial}</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{item.studentName}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.isActive ? "bg-primary/10 text-primary" : "bg-muted"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-3">{item.testimonial}</p>

                {(item.university || item.country) && (
                  <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                    {item.university && (
                      <span>
                        <span className="font-medium">University:</span> {item.university}
                      </span>
                    )}
                    {item.country && (
                      <span>
                        <span className="font-medium">Country:</span> {item.country}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const idToDelete = getId(item);
                      if (!idToDelete) {
                        toast({
                          title: "Missing ID",
                          description: "This review does not have an id field.",
                          variant: "destructive",
                        });
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
