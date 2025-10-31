import Navbar from "../Navbar";
import Footer from "../Footer";
import { useQuery } from "@tanstack/react-query";
import {  Users} from "lucide-react";
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

export default function DestinationsPage() {
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/destinations"],
    queryFn: () => fetchJSON("/api/destinations"),
  });

  const activeDestinations = (destinations || []).filter(
    (dest) => dest && dest.isActive
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-destructive/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Destinations
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground">
                Explore global career opportunities in leading destinations
                around the world. From dynamic cities to thriving industries,
                find the perfect place to build your future and achieve your
                international career goals.
              </p>
            </div>
          </div>
        </section>

        {/* Destinations Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : activeDestinations.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  No destinations available at the moment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activeDestinations.map((destination, idx) => {
                  const key =
                    destination.id ||
                    destination._id ||
                    destination.slug ||
                    `${destination.name || "dest"}-${idx}`;
                  const img = destination.imageUrl || "";
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
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-destructive/10" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {name}
                        </h3>
                        {country && (
                          <p className="text-sm text-white/90 mb-3">
                            {country}
                          </p>
                        )}
                        {destination.description && (
                          <p className="text-sm text-white/80 mb-3 line-clamp-2">
                            {destination.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Users className="w-4 h-4" />
                          <span>
                            {uniCount}{" "}
                            {uniCount === 1 ? "Workers Placed" : "Workers Placed"}
                          </span>
                        </div>
                      </div>
                    </div>
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
