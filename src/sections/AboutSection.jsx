import { Award, Users, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "";

// small helper to fetch JSON with abort signal
async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { signal, credentials: "include" });
  if (!res.ok) {
    const txt = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

export function AboutSection() {
  // ✅ fetch settings to get logoUrl
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: ({ signal }) => fetchJSON("/api/settings", { signal }),
    staleTime: Infinity,
  });

  const highlights = [
    { icon: Award, text: "15+ Years of Excellence " },
    { icon: Users, text: "100k+ Workers Successfully Placed Worldwide" },
    { icon: Globe, text: "Partner with 200+ Top Employers Globally" },
  ];

  // ✅ prefer backend logo; fallback if empty
  const logoUrl =
    settings?.logoUrl?.trim() ||
    "https://via.placeholder.com/600x400?text=Company+Image";

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Side */}
          {/* <div className="order-2 lg:order-1">
            <div className="relative rounded-md overflow-hidden">
              <img
                src={logoUrl}
                alt="Company Logo / About Image"
                className="w-full h-[400px] lg:h-[500px] object-cover"
                loading="lazy"
                decoding="async"
                sizes="(min-width:1024px) 600px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div> */}

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Your Trusted Partner in Global Workforce
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              At Everest Visas Consulting LLC, we are dedicated to transforming dreams
              into reality. Our expert team provides personalized guidance to help you
              navigate the complex journey abroad.
            </p>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              From job selection to visa assistance, we're with you every step of the
              way. Our comprehensive services ensure a smooth transition to your bright future.
            </p>

            {/* Highlights */}
            <div className="space-y-4 mb-8">
              {highlights.map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-base text-foreground pt-2">{text}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button size="lg" className="font-medium" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
