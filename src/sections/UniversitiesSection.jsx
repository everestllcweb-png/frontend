import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Globe } from "lucide-react";
import { Card } from "../ui/card";

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

// 🔑 Stable ID helper
const getUniId = (u) => u?.id || u?._id || u?.slug || u?.name;

// 🌐 Normalize website URL (adds https:// if missing)
function normalizeUrl(raw = "") {
  const u = String(raw).trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export function UniversitiesSection() {
  const { data: universities = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/universities"],
    queryFn: () => fetchJSON("/api/universities"),
    staleTime: 60_000,
  });

  const activeUniversities = (universities || [])
    .filter((uni) => uni && uni.isActive)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse h-[400px] flex flex-col">
                <div className="w-full aspect-square rounded-xl bg-muted mb-4" />
                <div className="h-6 bg-muted rounded-md mb-2" />
                <div className="h-4 bg-muted rounded-md" />
                <div className="mt-auto h-4 bg-muted rounded-md w-1/3" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeUniversities.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
           Our Global Partners
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We collaborate with prestigious agencies and companies worldwide to bring you the best  opportunities
          </p>
        </div>

        {/* Universities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activeUniversities.map((university, idx) => {
            const key = getUniId(university) || `university-${idx}`;

            const logoUrl = university.logoUrl || "";
            const name = university.name || "University";
            const country = university.country || "";
            const websiteUrl = normalizeUrl(university.websiteUrl || "");
            const description = university.description || "";

            return (
              <Card
                key={key}
                className="p-6 hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 h-[400px] flex flex-col"
                data-testid={`card-university-${key}`}
              >
                {/* Fixed 1:1 Logo Block */}
                <div className="w-full aspect-square rounded-xl border bg-muted/40 grid place-items-center mb-4 overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={name}
                      title={name}
                      loading="lazy"
                      decoding="async"
                      className="w-3/4 h-3/4 object-contain mix-blend-multiply"
                      data-testid={`img-university-logo-${key}`}
                    />
                  ) : (
                    <Globe className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>

                {/* University Info */}
                <h3
                  className="text-lg font-semibold text-foreground mb-1"
                  data-testid={`text-university-name-${key}`}
                  title={name}
                >
                  {name}
                </h3>

                {country ? (
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {getCountryFlag(country)}
                    </span>
                    {country}
                  </p>
                ) : (
                  <div className="h-5" /> // keep heights similar if no country
                )}

                {description ? (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {description}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}

                {/* Website Link pinned to bottom */}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-auto"
                    data-testid={`link-university-website-${key}`}
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// 🔤 Case-insensitive country name → flag emoji
function getCountryFlag(countryRaw) {
  const country = String(countryRaw).trim().toLowerCase();
  const flags = {
    "united states": "🇺🇸",
    "united kingdom": "🇬🇧",
    canada: "🇨🇦",
    australia: "🇦🇺",
    germany: "🇩🇪",
    france: "🇫🇷",
    netherlands: "🇳🇱",
    switzerland: "🇨🇭",
    singapore: "🇸🇬",
    japan: "🇯🇵",
    "south korea": "🇰🇷",
    "new zealand": "🇳🇿",
    india: "🇮🇳",
    china: "🇨🇳",
    italy: "🇮🇹",
    spain: "🇪🇸",
    ireland: "🇮🇪",
    sweden: "🇸🇪",
    norway: "🇳🇴",
    finland: "🇫🇮",
    denmark: "🇩🇰",
    "united arab emirates": "🇦🇪",
    malaysia: "🇲🇾",
  };
  return flags[country] || "🌍";
}
