import Navbar from "../Navbar";
import Footer from "../Footer";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Globe, Search } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { useState } from "react";
import WhatsApp from "../sections/WhatsApp";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper: fetch wrapper
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// Small helper to get a stable key/id
const getUniId = (u) => u?.id || u?._id || u?.slug;

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: universities = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/universities"],
    queryFn: () => fetchJSON("/api/universities"),
  });

  const activeUniversities = (universities || []).filter(
    (uni) => uni && uni.isActive
  );

  const q = (searchQuery || "").toLowerCase();
  const filteredUniversities = activeUniversities.filter((uni) => {
    const name = (uni.name || "").toLowerCase();
    const country = (uni.country || "").toLowerCase();
    return name.includes(q) || country.includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsApp/>
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-destructive/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Our Global Partners
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8">
                We collaborate with trusted global partners to bring you
                rewarding and secure overseas job opportunities.
              </p>

              {/* Search */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search partners..."
                  className="pl-12 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-universities"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Universities Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-24 bg-muted rounded-xl mb-4" />
                    <div className="h-6 bg-muted rounded-md mb-2" />
                    <div className="h-4 bg-muted rounded-md" />
                  </Card>
                ))}
              </div>
            ) : filteredUniversities.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchQuery
                    ? "No universities found matching your search"
                    : "No universities available at the moment"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredUniversities.map((university, idx) => {
                  const key =
                    getUniId(university) ||
                    `${university.name || "uni"}-${idx}`;
                  const logoUrl = university.logoUrl || "";
                  const name = university.name || "University";
                  const country = university.country || "";
                  const websiteUrl = university.websiteUrl || "";
                  const description = university.description || "";

                  return (
                    <Card
                      key={key}
                      className="p-6 hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1"
                      data-testid={`card-university-${key}`}
                    >
                      {/* Polished logo block */}
                      <div className="mb-4">
                        <div
                          className={[
                            // Aspect & layout
                            "relative w-full aspect-[5/1] sm:aspect-[4/1] lg:aspect-[5/1]",
                            // Container styling
                            "grid place-items-center rounded-xl border bg-gradient-to-br from-muted/70 to-background",
                            "ring-1 ring-border/60 shadow-sm",
                            // Spacing
                            "p-3 sm:p-4",
                            // Hover micro-interaction
                            "transition-transform duration-300 hover:scale-[1.01]",
                          ].join(" ")}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={name}
                              title={name}
                              loading="lazy"
                              className={[
                                // Keep inside box nicely
                                "max-h-full max-w-full object-contain",
                                // Improve legibility for transparent PNG/SVG over light bg
                                "drop-shadow-sm",
                                // Subtle blend that helps dark logos on light bg without harming colored ones
                                "mix-blend-multiply dark:mix-blend-normal",
                                // Prevent pixelation on HiDPI if big logos scale down
                                "[image-rendering:auto]",
                              ].join(" ")}
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="w-6 h-6" />
                              <span className="text-sm">Logo unavailable</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {name}
                      </h3>

                      {country && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {country}
                        </p>
                      )}

                      {description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {description}
                        </p>
                      )}

                      {websiteUrl && (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          data-testid={`link-university-website-${key}`}
                        >
                          Visit Website
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
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
