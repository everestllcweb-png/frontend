// src/Footer.jsx
import { Link } from "wouter";
import { useMemo } from "react";
import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Public GET → omit credentials to avoid preflights
async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { signal, credentials: "omit" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: ({ signal }) => fetchJSON("/api/settings", { signal }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const facebookUrl = useMemo(
    () => (settings?.facebookUrl ? String(settings.facebookUrl).trim() : ""),
    [settings?.facebookUrl]
  );

  // Build the official iframe Page Plugin URL (no SDK required)
  const fbIframeSrc = useMemo(() => {
    if (!facebookUrl) return "";
    const params = new URLSearchParams({
      href: facebookUrl,
      tabs: "timeline",
      width: "380",
      height: "480",
      small_header: "false",
      adapt_container_width: "true",
      hide_cover: "false",
      show_facepile: "true",
      lazy: "true",
    });
    return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
  }, [facebookUrl]);

  const quickLinks = [
    { name: "About", path: "/about" },
    { name: "Blogs", path: "/blogs" },
    { name: "Contact Us", path: "/appointment" },
  ];

  return (
    <footer className="bg-card border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="space-y-4">
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-12 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            )}

            <h3 className="text-xl font-semibold text-foreground">
              {settings?.companyName || "Everest Worldwide Consultancy Pvt. Ltd."}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {settings?.footerDescription ||
                "Your trusted partner for international education. We guide you to achieve your global study dreams."}
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsappUrl && (
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition inline-flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 bg-primary/70 rounded-full" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              {settings?.email && (
                <li className="flex gap-2">
                  <Mail className="w-4 h-4 text-primary mt-0.5" />
                  <a href={`mailto:${settings.email}`} className="hover:text-primary">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings?.mobile && (
                <li className="flex gap-2">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <a href={`tel:${settings.mobile}`} className="hover:text-primary">
                    {settings.mobile}
                  </a>
                </li>
              )}
              {settings?.telephone && (
                <li className="flex gap-2">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <a href={`tel:${settings.telephone}`} className="hover:text-primary">
                    {settings.telephone}
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="flex gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Facebook Feed (iframe — no SDK, no errors) */}
          <div>
            <h4 className="text-base font-semibold mb-4">Latest from Facebook</h4>
            {fbIframeSrc ? (
              <iframe
                title="Facebook Page"
                src={fbIframeSrc}
                width="380"
                height="480"
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                loading="lazy"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Facebook page not configured.</div>
            )}
          </div>
        </div>

        <div className="mt-10 border-t" />

        <div className="py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {settings?.companyName || "Everest Worldwide Consultancy Pvt. Ltd."} — All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
