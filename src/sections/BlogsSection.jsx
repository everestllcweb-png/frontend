import { useQuery } from "@tanstack/react-query";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Link } from "wouter";

// ✅ Base API URL from environment (.env)
const API_BASE = import.meta.env.VITE_API_URL || "";

// small helper to safely format dates without date-fns
function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d); // e.g., "Oct 29, 2025"
}

// ✅ helper to fetch JSON with absolute URL + credentials
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function BlogsSection() {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/blogs"],
    queryFn: () => fetchJSON("/api/blogs"),
    staleTime: 60_000,
  });

  const publishedBlogs = (blogs || [])
    .filter((blog) => blog && blog.isPublished)
    .sort((a, b) => {
      const dateA = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded-md" />
                  <div className="h-6 bg-muted rounded-md" />
                  <div className="h-4 bg-muted rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (publishedBlogs.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Latest Insights
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with helpful tips, guides, and news about studying abroad
          </p>
        </div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {publishedBlogs.map((blog, idx) => {
            const key =
              blog.id ||
              blog._id ||
              blog.slug ||
              `${blog.title ?? "blog"}-${idx}`;
            const displayDate = formatDate(blog.publishedAt);

            return (
              <Card
                key={key}
                className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                data-testid={`card-blog-${key}`}
              >
                {/* Featured Image */}
                {blog.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.imageUrl}
                      alt={blog.title || "Blog image"}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                      decoding="async"
                      data-testid={`img-blog-${key}`}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-destructive/5" />
                )}

                {/* Blog Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {blog.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {blog.category}
                      </Badge>
                    ) : null}

                    {displayDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        <span>{displayDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-semibold text-foreground mb-3 line-clamp-2"
                    data-testid={`text-blog-title-${key}`}
                  >
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  {blog.excerpt && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {blog.excerpt}
                    </p>
                  )}

                  {/* Author & Read More */}
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    {blog.author && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" aria-hidden="true" />
                        <span>{blog.author}</span>
                      </div>
                    )}

                    <Link
                      href={`/blogs/${blog.slug ?? key}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      data-testid={`link-read-more-${key}`}
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All CTA (valid HTML: Button renders <a> via asChild) */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="font-medium"
            data-testid="button-view-all-blogs"
            asChild
          >
            <Link href="/blogs">View All Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
