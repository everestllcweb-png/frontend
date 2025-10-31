import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Link } from "wouter";

// ✅ Base API URL from environment (.env)
const API_BASE = import.meta.env.VITE_API_URL || "";

// ✅ Helper: absolute URL + credentials + error text
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function CoursesSection() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/courses"],
    queryFn: () => fetchJSON("/api/courses"),
    staleTime: 60_000,
  });

  const activeCourses = (courses || [])
    .filter((course) => course && course.isActive)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-48 bg-muted rounded-md mb-4" />
                <div className="h-6 bg-muted rounded-md mb-2" />
                <div className="h-4 bg-muted rounded-md" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeCourses.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
           Latest Job Demands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover a wide range of job demands tailored to your career goals
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activeCourses.map((course, idx) => {
            const key = course.id || course._id || course.slug || `${course.name ?? "course"}-${idx}`;

            return (
              <Card
                key={key}
                className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1"
                data-testid={`card-course-${key}`}
              >
                {/* Course Image */}
                {course.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={course.imageUrl}
                      alt={course.name || "Course image"}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      data-testid={`img-course-${key}`}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-destructive/10 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary" aria-hidden="true" />
                  </div>
                )}

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {course.category ? (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        data-testid={`badge-category-${key}`}
                      >
                        {course.category}
                      </Badge>
                    ) : null}

                    {course.duration ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{course.duration}</span>
                      </div>
                    ) : null}
                  </div>

                  <h3
                    className="text-lg font-semibold text-foreground mb-3 line-clamp-2"
                    data-testid={`text-course-name-${key}`}
                  >
                    {course.name}
                  </h3>

                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  {/* Valid HTML: render anchor via Button asChild */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid={`button-explore-course-${key}`}
                    asChild
                  >
                    <Link href="/jobs">Explore Job</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All CTA (valid HTML with asChild) */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="font-medium"
            data-testid="button-view-all-courses"
            asChild
          >
            <Link href="/jobs">View All Jobs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
