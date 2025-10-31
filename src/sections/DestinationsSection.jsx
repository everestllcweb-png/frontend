import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";

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

export function DestinationsSection() {
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/destinations"],
    queryFn: () => fetchJSON("/api/destinations"),
    staleTime: 60_000,
  });

  const activeDestinations = (destinations || [])
    .filter((dest) => dest && dest.isActive)
    .slice(0, 8);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeDestinations.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Working Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore opportunities in top destinations around the globe
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {activeDestinations.map((destination, idx) => {
            const key =
              destination.id ||
              destination._id ||
              destination.slug ||
              `${destination.name ?? "destination"}-${idx}`;

            const imgSrc = destination.imageUrl || "";
            const name = destination.name || "Destination";
            const country = destination.country || "";
            const uniCount =
              typeof destination.universityCount === "number"
                ? destination.universityCount
                : 0;

            return (
              <div
                key={key}
                className="group relative aspect-square rounded-md overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1"
                data-testid={`card-destination-${key}`}
              >
                {/* Background Image */}
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={`${name}${country ? `, ${country}` : ""}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    data-testid={`img-destination-${key}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-destructive/10" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3
                    className="text-lg font-semibold text-white mb-1"
                    data-testid={`text-destination-name-${key}`}
                  >
                    {name}
                  </h3>
                  {country && (
                    <p className="text-sm text-white/90 mb-2">{country}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <GraduationCap className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {uniCount} {uniCount === 1 ? "Worker Placed" : "Workers Placed"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
