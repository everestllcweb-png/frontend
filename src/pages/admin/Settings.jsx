import { useEffect, useRef, useState } from "react";
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
import { Loader2, Image as ImageIcon } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

/** Cloudinary helpers */
const transformLogo = (url) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,dpr_auto,w_600/")
    : url;

async function getSignature(folder = "settings") {
  const res = await apiRequest("POST", `${API_BASE}/api/cloudinary/signature`, { folder });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { apiKey, signature, timestamp, folder }
}

async function uploadToCloudinary({ file, onProgress, folder = "settings" }) {
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
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
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

  return p; // { secure_url, ... }
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- AUTH CHECK ----
  const { data: auth } = useQuery({
    queryKey: [API_BASE, "/api/auth/check"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/auth/check`);
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
    queryKey: [API_BASE, "/api/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/settings`);
      return res.json();
    },
  });

  // ---- FORM ----
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: "",
      footerDescription: "",
      logoUrl: "",
      logoUrlb: "",
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

  // Watch both logo URLs for previews
  const logoUrl = watch("logoUrl");
  const logoUrlb = watch("logoUrlb");

  // Independent upload states for each logo
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [pctA, setPctA] = useState(0);
  const [pctB, setPctB] = useState(0);
  const [upA, setUpA] = useState(false);
  const [upB, setUpB] = useState(false);

  const fileRefA = useRef(null);
  const fileRefB = useRef(null);

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  // ---- UPDATE MUTATION ----
  const updateSettings = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("PUT", `${API_BASE}/api/settings`, data);
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/settings"] });
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

  // Generic uploader that fills the correct form field
  async function doUpload(field, file, setPct, setBusy) {
    if (!file) {
      toast({ title: "No file selected", description: "Choose an image first.", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      setPct(0);
      const result = await uploadToCloudinary({
        file,
        onProgress: setPct,
        folder: "settings",
      });
      setValue(field, result.secure_url, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Uploaded", description: `${field} uploaded to Cloudinary` });
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload image", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

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
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Company Information</h2>

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

            {/* Logo A */}
            <div className="space-y-2">
              <Label>Logo (Primary)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileRefA}
                  onChange={(e) => setFileA(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => doUpload("logoUrl", fileA, setPctA, setUpA)}
                  disabled={!fileA || upA}
                >
                  {upA ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" /> Upload to Cloudinary
                    </>
                  )}
                </Button>
              </div>

              {upA && (
                <div className="w-full h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded transition-all" style={{ width: `${pctA}%` }} />
                </div>
              )}

              {logoUrl ? (
                <div className="mt-2">
                  <img
                    className="max-h-28 object-contain"
                    alt="Logo preview"
                    src={transformLogo(logoUrl)}
                    loading="eager"
                    decoding="async"
                    sizes="40vw"
                  />
                  <p className="text-xs text-muted-foreground mt-1 break-all">{logoUrl}</p>
                </div>
              ) : null}

              <div>
                <Label htmlFor="logoUrl" className="text-xs">Or paste logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                  {...register("logoUrl")}
                />
                <p className="text-sm text-muted-foreground mt-1">Enter the URL of your logo image</p>
              </div>
            </div>

            {/* Logo B */}
            <div className="space-y-2">
              <Label>Logo (Secondary)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileRefB}
                  onChange={(e) => setFileB(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => doUpload("logoUrlb", fileB, setPctB, setUpB)}
                  disabled={!fileB || upB}
                >
                  {upB ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" /> Upload to Cloudinary
                    </>
                  )}
                </Button>
              </div>

              {upB && (
                <div className="w-full h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded transition-all" style={{ width: `${pctB}%` }} />
                </div>
              )}

              {logoUrlb ? (
                <div className="mt-2">
                  <img
                    className="max-h-28 object-contain"
                    alt="Secondary logo preview"
                    src={transformLogo(logoUrlb)}
                    loading="eager"
                    decoding="async"
                    sizes="40vw"
                  />
                  <p className="text-xs text-muted-foreground mt-1 break-all">{logoUrlb}</p>
                </div>
              ) : null}

              <div>
                <Label htmlFor="logoUrlb" className="text-xs">Or paste secondary logo URL</Label>
                <Input
                  id="logoUrlb"
                  placeholder="https://example.com/logo2.png"
                  className="mt-1"
                  {...register("logoUrlb")}
                />
                <p className="text-sm text-muted-foreground mt-1">Enter the URL of your secondary logo image</p>
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
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
