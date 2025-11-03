import { useQuery } from "@tanstack/react-query";
import { Calendar, User, ArrowRight, X } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Link } from "wouter";
import { useMemo, useState, useCallback } from "react";

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

// Try /api/blogs/:slug first, then /api/blogs/id/:id
async function fetchBlogDetail({ slug, id }) {
  if (slug) {
    try {
      return await fetchJSON(`/api/blogs/${slug}`);
    } catch {
      // continue to id fallback
    }
  }
  if (id) {
    return await fetchJSON(`/api/blogs/id/${id}`);
  }
  // If your API returns the full blog in list already, just return null to use the list item.
  return null;
}

export function BlogsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { slug?, id? , fallbackItem? }

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/blogs"],
    queryFn: () => fetchJSON("/api/blogs"),
    staleTime: 60_000,
  });

  const publishedBlogs = useMemo(
    () =>
      (blogs || [])
        .filter((blog) => blog && blog.isPublished)
        .sort((a, b) => {
          const dateA = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 3),
    [blogs]
  );

  const openModal = useCallback((blog) => {
    const id = blog?.id || blog?._id || undefined;
    const slug = blog?.slug || undefined;
    setSelected({ id, slug, fallbackItem: blog });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    // keep selection so reopening is quick; clear if you prefer:
    // setSelected(null)
  }, []);

  // Fetch the full blog only when the dialog is open and we have an identifier
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: [API_BASE, "blog-detail", selected?.slug || selected?.id],
    queryFn: () => fetchBlogDetail({ slug: selected?.slug, id: selected?.id }),
    enabled: modalOpen && !!(selected?.slug || selected?.id),
    staleTime: 60_000,
  });

  const activeBlog = detail || selected?.fallbackItem || null;
  const activeDate = formatDate(activeBlog?.publishedAt);

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
              blog.id || blog._id || blog.slug || `${blog.title ?? "blog"}-${idx}`;
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

                    {/* OPEN OVERLAY */}
                    <button
                      onClick={() => openModal(blog)}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      data-testid={`button-read-more-${key}`}
                      type="button"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All CTA */}
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

      {/* Dialog Overlay for Blog Detail */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-3xl w-[92vw] p-0 overflow-hidden"
          aria-describedby={undefined}
        >
          {/* Top Bar: Title + Close */}
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              {activeBlog?.title || "Article"}
            </DialogTitle>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={closeModal}
            >
              {/* <X className="h-5 w-5" /> */}
            </Button>
          </DialogHeader>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Hero image */}
            {activeBlog?.imageUrl && (
              <div className="h-56 w-full overflow-hidden bg-muted">
                <img
                  src={activeBlog.imageUrl}
                  alt={activeBlog?.title || "Blog image"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {activeBlog?.category ? (
                  <Badge variant="secondary">{activeBlog.category}</Badge>
                ) : null}
                {activeDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {activeDate}
                  </span>
                )}
                {activeBlog?.author && (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {activeBlog.author}
                  </span>
                )}
              </div>

              {/* Loading / Error / Content */}
              {detailLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded md:w-2/3 animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded md:w-5/6 animate-pulse" />
                  <div className="h-4 bg-muted rounded md:w-4/6 animate-pulse" />
                </div>
              ) : detailError ? (
                <div className="text-sm text-destructive">
                  Couldn’t load the full article. You can still read it on the article page.
                </div>
              ) : (
                <>
                  {activeBlog?.content ? (
                    <article
                      className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: activeBlog.content }}
                    />
                  ) : activeBlog?.body ? (
                    <article className="prose prose-sm md:prose-base max-w-none dark:prose-invert whitespace-pre-line">
                      {activeBlog.body}
                    </article>
                  ) : activeBlog?.excerpt ? (
                    <article className="prose prose-sm md:prose-base max-w-none dark:prose-invert whitespace-pre-line">
                      {activeBlog.excerpt}
                    </article>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No content provided for this article.
                    </p>
                  )}
                </>
              )}

              {/* Go to full page */}
              <div className="pt-2">
                <Button asChild variant="link" className="px-0">
                  <Link href={`/blogs/${selected?.slug ?? selected?.id ?? ""}`}>
                    Open full article page
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
