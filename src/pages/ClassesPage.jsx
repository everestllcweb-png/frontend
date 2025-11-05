import Navbar from "../Navbar";
import Footer from "../Footer";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Search } from "lucide-react";
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

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: classes = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/classes"],
    queryFn: () => fetchJSON("/api/classes"),
  });

  const activeClasses = (classes || []).filter((cls) => cls && cls.isActive);

  const q = (searchQuery || "").toLowerCase();
  const filteredClasses = activeClasses.filter((cls) => {
    const name = (cls.name || "").toLowerCase();
    const instructor = (cls.instructor || "").toLowerCase();
    return name.includes(q) || instructor.includes(q);
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
                Our Services
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8">
                Join our expert-led programs and services designed to guide you
                through every step of your visa, documentation, and overseas
                employment journey.
              </p>

              {/* Search */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  className="pl-12 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-classes"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Classes Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-48 bg-muted rounded-md mb-4" />
                    <div className="h-6 bg-muted rounded-md mb-2" />
                    <div className="h-4 bg-muted rounded-md" />
                  </Card>
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchQuery
                    ? "No services found matching your search"
                    : "No services available at the moment"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredClasses.map((classItem, idx) => {
                  const key =
                    classItem.id ||
                    classItem._id ||
                    classItem.slug ||
                    `${classItem.name || "class"}-${idx}`;
                  const img = classItem.imageUrl || "";
                  const name = classItem.name || "Class";
                  const instructor = classItem.instructor || "";
                  const schedule = classItem.schedule || "";
                  const capacity =
                    typeof classItem.capacity === "number"
                      ? classItem.capacity
                      : null;
                  const description = classItem.description || "";

                  return (
                    <Card
                      key={key}
                      className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1"
                      data-testid={`card-class-${key}`}
                    >
                      {img ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={img}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-destructive/10 flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-primary" />
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          {name}
                        </h3>

                        {instructor && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Employer:</span>{" "}
                            {instructor}
                          </p>
                        )}

                        {schedule && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4" />
                            <span>{schedule}</span>
                          </div>
                        )}

                        {capacity !== null && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Users className="w-4 h-4" />
                            <span>Capacity: {capacity} workers</span>
                          </div>
                        )}

                        {description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {description}
                          </p>
                        )}
                      </div>
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
