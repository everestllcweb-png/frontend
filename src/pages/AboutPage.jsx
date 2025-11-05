// src/pages/AboutPage.jsx
import Navbar from ".././Navbar";
import Footer from ".././Footer";
import { Card } from "../ui/card";
import { Target, Heart, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import WhatsApp from "../sections/WhatsApp";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Auto-compress Cloudinary images; no-op for others
const transformCdn = (url, t = "f_auto,q_auto,dpr_auto,w_1200") =>
  url && url.includes("/upload/") ? url.replace("/upload/", `/upload/${t}/`) : url;

// Small helpers (public endpoints → no cookies to reduce preflights)
async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { signal, credentials: "omit" });
  if (!res.ok) {
    const t = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${t}`);
  }
  return res.json();
}

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Excellence",
      description:
        "We strive for the highest standards in everything we do, ensuring quality service and support.",
    },
    {
      icon: Heart,
      title: "Client-Centric",
      description:
        "Your success is our priority. We provide personalized guidance tailored to your unique goals.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We embrace modern approaches and technologies to make your journey smoother and more efficient.",
    },
  ];

  const stats = [
    { number: "15+", label: "Years Experience" },
    { number: "20k+", label: "Workers Placed" },
    { number: "200+", label: "Partners Worldwide" },
    { number: "30+", label: "Countries Worldwide" },
  ];

  // Team — public list (active only)
  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: [API_BASE, "/api/team"],
    queryFn: ({ signal }) => fetchJSON("/api/team", { signal }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Settings — to get logoUrlb for the big image
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: ({ signal }) => fetchJSON("/api/settings", { signal }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const sortedTeam = useMemo(() => {
    return (team || []).slice().sort((a, b) => {
      const oa = Number.isFinite(+a?.order) ? +a.order : 0;
      const ob = Number.isFinite(+b?.order) ? +b.order : 0;
      if (oa !== ob) return oa - ob;
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return tb - ta; // newest last if same order
    });
  }, [team]);

  // ✅ Prefer secondary logo (logoUrlb) for story image; fallback to primary logo, then a static image
  const storyImageRaw =
    (typeof settings?.logoUrlb === "string" && settings.logoUrlb.trim()) ||
    (typeof settings?.logoUrl === "string" && settings.logoUrl.trim()) ||
    "https://via.placeholder.com/1200x800?text=Company+Image";
  const storyImage = transformCdn(storyImageRaw, "f_auto,q_auto,dpr_auto,w_1200");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsApp/>
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-destructive/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Empowering Workers to Reach New Heights in Their International
                Careers
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                At Everest Visas Consulting LLC, Dedicated to helping skilled
                and aspiring workers achieve success abroad through trusted
                recruitment and visa processing solutions.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-card border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div
                    className="text-3xl lg:text-5xl font-bold text-primary mb-2"
                    data-testid={`stat-number-${index}`}
                  >
                    {stat.number}
                  </div>
                  <div
                    className="text-sm lg:text-base text-muted-foreground"
                    data-testid={`stat-label-${index}`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
                  <p>
                    Everest Visas Consulting LLC was founded with a simple yet
                    powerful vision — to make global employment opportunities
                    accessible to individuals from all backgrounds.
                  </p>
                  <p>
                    Over the years, we’ve grown from a small team of passionate
                    professionals to a trusted overseas employment consultancy
                    with a strong global network of partners. Our success is
                    measured not just in numbers, but in the thousands of
                    individuals whose careers and lives we’ve helped transform
                    through international employment opportunities.
                  </p>
                  <p>
                    Today, we continue to innovate and evolve, staying at the
                    forefront of foreign employment trends while maintaining the
                    personal touch that has always been our hallmark.
                  </p>
                </div>
              </div>
              <div>
                <img
                  src={storyImage}
                  alt="Our team / Company visual"
                  className="w-full h-[400px] object-cover rounded-md"
                  data-testid="img-our-story"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 800px, 100vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:4xl font-bold text-foreground mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="p-8 text-center hover-elevate active-elevate-2 transition-all"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The people behind our success
              </p>
            </div>

            {teamLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-muted mb-4" />
                    <div className="h-4 bg-muted rounded mb-2 w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </Card>
                ))}
              </div>
            ) : sortedTeam.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Team coming soon
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedTeam.map((member) => {
                  const key = member._id || member.id || member.name;
                  const initial = (member.name || "?").trim().charAt(0).toUpperCase();
                  const img = transformCdn(member.imageUrl, "f_auto,q_auto,dpr_auto,w_600");
                  return (
                    <Card key={key} className="p-6 text-center hover-elevate transition-all">
                      <div className="flex items-center justify-center mb-4">
                        {img ? (
                          <img
                            src={img}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover"
                            loading="lazy"
                            decoding="async"
                            sizes="120px"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-primary">{initial}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-semibold">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.position}</div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
