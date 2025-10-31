import { useEffect } from "react";
import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- AUTH CHECK (so we don't silently 401 on save) ----
  const { data: auth } = useQuery({
    queryKey: ["/api/auth/check"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/check");
      return res.json();
    },
    staleTime: 0,
  });

  // ---- FETCH SETTINGS ----
  const {
    data: settings,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings");
      return res.json();
    },
  });

  // ---- FORM ----
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: "",
      footerDescription: "",
      logoUrl: "",
      email: "",
      mobile: "",
      telephone: "",
      address: "",
      facebookUrl: "",
      whatsappUrl: "",
      tiktokUrl: "",
      instagramUrl: "",
    },
  });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  // ---- UPDATE MUTATION ----
  const updateSettings = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("PUT", "/api/settings", data);
      // Some servers may return empty; normalize to object
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    if (!auth?.authenticated) {
      toast({
        title: "Not logged in",
        description: "Please log in as admin to save settings.",
        variant: "destructive",
      });
      return;
    }
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load settings: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your website settings</p>
        </div>

        {!auth?.authenticated && (
          <div className="mb-4 text-sm text-red-600">
            You are not logged in. Saving will fail until you sign in.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
          {/* Company Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Company Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" {...register("companyName", { required: true })} className="mt-2" />
                {errors.companyName && <p className="text-sm text-red-600 mt-1">Required</p>}
              </div>

              <div>
                <Label htmlFor="footerDescription">Footer Description *</Label>
                <Textarea id="footerDescription" {...register("footerDescription", { required: true })} rows={4} className="mt-2" />
                {errors.footerDescription && <p className="text-sm text-red-600 mt-1">Required</p>}
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" {...register("logoUrl")} placeholder="https://example.com/logo.png" className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Enter the URL of your logo image</p>
              </div>
            </div>
          </Card>

          {/* Contact Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" {...register("mobile")} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="telephone">Telephone</Label>
                <Input id="telephone" {...register("telephone")} className="mt-2" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} rows={3} className="mt-2" />
              </div>
            </div>
          </Card>

          {/* Social Media Links */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Social Media Links</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input id="facebookUrl" {...register("facebookUrl")} placeholder="https://facebook.com/yourpage" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="whatsappUrl">WhatsApp URL</Label>
                <Input id="whatsappUrl" {...register("whatsappUrl")} placeholder="https://wa.me/1234567890" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="tiktokUrl">TikTok URL</Label>
                <Input id="tiktokUrl" {...register("tiktokUrl")} placeholder="https://tiktok.com/@yourhandle" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input id="instagramUrl" {...register("instagramUrl")} placeholder="https://instagram.com/yourhandle" className="mt-2" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
