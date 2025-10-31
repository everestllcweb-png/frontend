import { Link } from "wouter";
import { useEffect, useRef } from "react";
import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "";
const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

// Fetch app settings
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: () => fetchJSON("/api/settings"),
    staleTime: 60_000,
  });

  const fbRef = useRef(null);

  // Load FB SDK (with env APP ID)
  useEffect(() => {
    if (window.FB) return;
    const script = document.createElement("script");
    script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v24.0&appId=${FB_APP_ID}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Re-render FB widget when settings load
  useEffect(() => {
    if (window.FB && fbRef.current) {
      window.FB.XFBML.parse(fbRef.current);
    }
  }, [settings?.facebookUrl]);

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
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
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
                <a href={settings.facebookUrl} target="_blank" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition">
                  <SiTiktok className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsappUrl && (
                <a href={settings.whatsappUrl} target="_blank" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:text-primary transition">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link href={link.path}>
                    <a className="text-sm text-muted-foreground hover:text-primary transition inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 bg-primary/70 rounded-full"></span>
                      {link.name}
                    </a>
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
                  <a href={`mailto:${settings.email}`} className="hover:text-primary">{settings.email}</a>
                </li>
              )}
              {settings?.mobile && (
                <li className="flex gap-2">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <a href={`tel:${settings.mobile}`} className="hover:text-primary">{settings.mobile}</a>
                </li>
              )}
              {settings?.telephone && (
                <li className="flex gap-2">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <a href={`tel:${settings.telephone}`} className="hover:text-primary">{settings.telephone}</a>
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

          {/* Facebook Feed */}
          <div>
            <h4 className="text-base font-semibold mb-4">Latest from Facebook</h4>

            <div ref={fbRef} className="flex justify-center md:justify-start">
              {settings?.facebookUrl && (
                <div
                  className="fb-page w-full max-w-[380px]"
                  data-href={settings.facebookUrl}
                  data-tabs="timeline"
                  data-width="380"
                  data-height="480"
                  data-small-header="false"
                  data-adapt-container-width="true"
                  data-hide-cover="false"
                  data-show-facepile="true"
                ></div>
              )}
            </div>
          </div>

        </div>

        <div className="mt-10 border-t"></div>

        <div className="py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {settings?.companyName || "Everest Worldwide Consultancy Pvt. Ltd."} — All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}
