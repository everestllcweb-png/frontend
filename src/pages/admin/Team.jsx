// src/pages/admin/Team.jsx
import { useState } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "";

// helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);

export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // READ (admin: show all to manage)
  const { data: team = [], isLoading, isError, error } = useQuery({
    queryKey: [API_BASE, "/api/team/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/team/all`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
  });

  // CREATE
  const createItem = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${API_BASE}/api/team`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/team/all"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Team member created successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to create team member",
        variant: "destructive",
      });
    },
  });

  // UPDATE
  const updateItem = useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Missing team member id");
      const res = await apiRequest("PUT", `${API_BASE}/api/team/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/team/all"] });
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Team member updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });

  // DELETE
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
      toast({
        title: "Error",
        description: err?.message || "Failed to delete team member",
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
    const fd = new FormData(e.currentTarget);

    const orderRaw = (fd.get("order") || "").toString();
    const order = Number.isNaN(parseInt(orderRaw, 10)) ? 0 : parseInt(orderRaw, 10);

    const data = {
      name: (fd.get("name") || "").toString().trim(),
      position: (fd.get("position") || "").toString().trim(),
      imageUrl: (fd.get("imageUrl") || "").toString().trim(),
      order,
      isActive: !!isActive,
    };

    if (!data.name || !data.position) {
      toast({
        title: "Missing fields",
        description: "Name and Position are required.",
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

                <div>
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={editingItem?.imageUrl || ""} />
                </div>

                <div>
                  <Label htmlFor="order">Order (lower shows first)</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    defaultValue={editingItem?.order ?? 0}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    aria-label="Active on site"
                  />
                  <Label htmlFor="isActive">Active on site</Label>
                </div>

                <Button type="submit" className="w-full">
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
            return (
              <Card key={id || item.name} className="p-5 flex gap-4 items-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover"
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
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.isActive ? "bg-primary/10 text-primary" : "bg-muted"
                      }`}
                    >
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
                          toast({
                            title: "Missing ID",
                            description: "This member does not have an id field.",
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

        {team.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No team members yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
