// src/components/WhatsApp.jsx
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

// ✅ Base API URL from environment (.env)
const API_BASE = import.meta.env.VITE_API_URL || "";

// ✅ Helper: absolute URL + credentials + readable errors
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// ✅ Normalize various "whatsappUrl" formats to a proper chat link
// Accepts:
//   - Full urls (https://wa.me/..., https://api.whatsapp.com/send?...)
//   - Plain numbers like "+9715xxxx" or "9715xxxx" -> converted to https://wa.me/<digits>
function normalizeWhatsAppUrl(raw) {
  if (!raw) return null;
  const val = String(raw).trim();

  // If it's already a URL, use as-is
  if (/^https?:\/\//i.test(val)) return val;

  // Extract digits (and leading +) to handle numbers like +9715xxxx
  const num = val.replace(/[^\d+]/g, "");
  if (!num) return null;

  // Remove leading + for wa.me format
  const digits = num.replace(/^\+/, "");
  return `https://wa.me/${digits}`;
}

export default function WhatsApp() {
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: () => fetchJSON("/api/settings"),
    staleTime: 60_000,
  });

  const href = normalizeWhatsAppUrl(settings?.whatsappUrl);

  // Hide if no whatsapp url available yet
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      // 🟢 WhatsApp brand look: #25D366 background, white icon
      className="
        fixed right-3 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50
        inline-flex items-center justify-center
        h-12 w-12 md:h-14 md:w-14 rounded-full
        shadow-lg md:shadow-xl
        bg-[#25D366] text-white
        hover:opacity-90 active:scale-95 transition
      "
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
    </a>
  );
}
