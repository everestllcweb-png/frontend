import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import MessengerIcon from "./messenger.svg"; // keep icon or use react-icons

const API_BASE = import.meta.env.VITE_API_URL || "";

// fetch settings
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const fbRef = useRef(null);

  // ✅ Load settings (to get facebookUrl)
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: () => fetchJSON("/api/settings"),
    staleTime: 60_000,
  });

  // ✅ Load FB SDK if not already
  useEffect(() => {
    if (window.FB) return;

    const script = document.createElement("script");
    script.src =
      "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v24.0&appId=1172993544730705";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // ✅ Parse when opened
  useEffect(() => {
    if (open && window.FB && fbRef.current) {
      window.FB.XFBML.parse(fbRef.current);
    }
  }, [open]);

  if (!settings?.facebookUrl) return null; // No FB? don't show chat

  return (
    <>
      {/* Floating Chat Icon */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 shadow-lg rounded-full p-3 z-50 hover:scale-110 transition"
        >
          <img src={MessengerIcon} alt="Chat" className="w-7 h-7" />
        </button>
      )}

      {/* Chat Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-2 relative w-[92%] max-w-[380px]">
            
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 bg-white text-black rounded-full shadow p-1"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Messenger Widget */}
            <div ref={fbRef}>
              <div
                className="fb-page w-full"
                data-href={settings.facebookUrl}
                data-tabs="messages"
                data-width="360"
                data-height="500"
                data-small-header="true"
                data-adapt-container-width="true"
                data-hide-cover="true"
              ></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
