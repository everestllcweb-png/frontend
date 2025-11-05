import Navbar from "../Navbar";
import Footer from "../Footer";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Search } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useMemo, useState } from "react";
import WhatsApp from "../sections/WhatsApp";

const API_BASE = import.meta.env.VITE_API_URL || "";

// ---- Helper: Fetch Wrapper ----
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// ---- Safe accessors ----
const getCourseId = (course) => course?.id || course?._id || course?.slug;
const toLower = (v) => (v || "").toLowerCase();

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // List fetch
  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/courses"],
    queryFn: () => fetchJSON("/api/courses"),
  });

  const activeCourses = useMemo(
    () => (Array.isArray(courses) ? courses.filter((c) => c?.isActive) : []),
    [courses]
  );

  const q = toLower(searchQuery);
  const filteredCourses = useMemo(() => {
    return activeCourses.filter((course) => {
      const name = toLower(course?.name);
      const category = toLower(course?.category);
      return name.includes(q) || category.includes(q);
    });
  }, [activeCourses, q]);

  // Detail fetch (when a course is selected)
  const {
    data: courseDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: [API_BASE, "/api/courses", selectedId],
    queryFn: () => fetchJSON(`/api/courses/${selectedId}`),
    enabled: !!selectedId,
    // If your backend returns 404 for unknown, keep stale data off
    staleTime: 0,
  });

  // Fallback detail (if API has no detail endpoint, use from list)
  const fallbackFromList = useMemo(
    () => activeCourses.find((c) => getCourseId(c) === selectedId),
    [activeCourses, selectedId]
  );
  const detail = courseDetail || fallbackFromList || null;

  const handleOpenDetail = (course) => {
    const id = getCourseId(course);
    if (!id) return;
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    // Small timeout so closing animation doesn’t flicker while unsetting id
    setTimeout(() => setSelectedId(null), 200);
  };

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
                Explore Our Available Jobs
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8">
                Explore diverse international job openings that align with your
                professional goals and global ambitions.
              </p>

              {/* Search */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jobs..."
                  className="pl-12 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-courses"
                />
              </div>

              {error ? (
                <p className="mt-4 text-sm text-destructive">
                  Failed to load jobs: {String(error.message || error)}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Courses Grid */}
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
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchQuery
                    ? "No jobs found matching your search"
                    : "No jobs available at the moment"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredCourses.map((course, idx) => {
                  const key =
                    getCourseId(course) || `${course?.name || "course"}-${idx}`;
                  const img = course?.imageUrl || "";
                  const name = course?.name || "Course";
                  const category = course?.category || "";
                  const duration = course?.duration || "";
                  const description = course?.description || "";

                  return (
                    <Card
                      key={key}
                      className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1"
                      data-testid={`card-course-${key}`}
                    >
                      {img ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={img}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            data-testid={`img-course-${key}`}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-destructive/10 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-primary" />
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {category && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              data-testid={`badge-category-${key}`}
                            >
                              {category}
                            </Badge>
                          )}
                          {duration && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{duration}</span>
                            </div>
                          )}
                        </div>

                        <h3
                          className="text-lg font-semibold text-foreground mb-3 line-clamp-2"
                          data-testid={`text-course-name-${key}`}
                          title={name}
                        >
                          {name}
                        </h3>

                        {description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                            {description}
                          </p>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid={`button-learn-more-${key}`}
                          onClick={() => handleOpenDetail(course)}
                        >
                          Learn More
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => (open ? null : handleClose())}
      >
        <DialogContent
          className="max-w-3xl p-0 overflow-hidden"
          data-testid="dialog-course-detail"
        >
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{detail?.name || "Job Details"}</DialogTitle>
            {!!detail?.category && (
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {detail.category}
                </Badge>
                {!!detail?.duration && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {detail.duration}
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Image */}
          {detail?.imageUrl ? (
            <div className="h-56 w-full overflow-hidden">
              <img
                src={detail.imageUrl}
                alt={detail?.name || "Course Image"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Description */}
            {isDetailLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ) : detailError ? (
              <p className="text-sm text-destructive">
                Failed to load full details. Showing available information.
              </p>
            ) : null}

            {detail?.description && (
              <section>
                <h4 className="text-sm font-semibold mb-2">
                  About this Job
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {detail.description}
                </p>
              </section>
            )}

            {/* Optional fields if your API provides them */}
            {detail?.syllabus?.length ? (
              <section>
                <h4 className="text-sm font-semibold mb-2">Duties</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {detail.syllabus.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail?.requirements?.length ? (
              <section>
                <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {detail.requirements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detail?.fee ? (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Salary</p>
                  <p className="text-sm font-medium">{detail.fee}</p>
                </div>
              ) : null}
              {detail?.startDate ? (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">
                    {new Date(detail.startDate).toLocaleDateString()}
                  </p>
                </div>
              ) : null}
              {detail?.applicationDeadline ? (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    Application Deadline
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(detail.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
              ) : null}
            </div>

            {/* CTA row (customize as you like) */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {detail?.applyUrl ? (
                <a href={detail.applyUrl} target="_blank" rel="noreferrer">
                  <Button>Apply Now</Button>
                </a>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
