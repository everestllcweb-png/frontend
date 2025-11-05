// src/pages/BlogsPage.jsx
import Navbar from "../Navbar";
import Footer from "../Footer";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, ArrowRight, Search, X } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { useState, useMemo, useCallback } from "react";
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

// ---- Helper: Date Formatter ----
function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d); // e.g., Oct 29, 2025
}

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Preview overlay state
  const [previewItem, setPreviewItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/blogs"],
    queryFn: () => fetchJSON("/api/blogs"),
  });

  // ---- Data Processing ----
  const publishedBlogs = useMemo(
    () =>
      (blogs || [])
        .filter((blog) => blog && blog.isPublished)
        .sort((a, b) => {
          const dateA = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        }),
    [blogs]
  );

  const q = (searchQuery || "").toLowerCase();
  const filteredBlogs = useMemo(
    () =>
      publishedBlogs.filter((blog) => {
        const title = (blog.title || "").toLowerCase();
        const excerpt = (blog.excerpt || "").toLowerCase();
        const category = (blog.category || "").toLowerCase();
        return title.includes(q) || excerpt.includes(q) || category.includes(q);
      }),
    [publishedBlogs, q]
  );

  const openPreview = useCallback((item) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  }, []);

  // Ensure we clear the selected item when closing (helps on iOS modal re-opens)
  const handleOpenChange = useCallback((open) => {
    setIsPreviewOpen(open);
    if (!open) setPreviewItem(null);
  }, []);

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
                Our Blog
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8">
                Practical advice and expert guidance for a smooth and successful overseas career journey.
              </p>

              {/* Search */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-12 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-blogs"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Blogs Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              // Loading Skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
            ) : filteredBlogs.length === 0 ? (
              // No Results
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  {searchQuery
                    ? "No articles found matching your search"
                    : "No articles available at the moment"}
                </p>
              </div>
            ) : (
              // Blogs List
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredBlogs.map((blog) => {
                  const key = blog.id || blog._id || blog.slug || blog.title;
                  const displayDate = formatDate(blog.publishedAt);

                  return (
                    <Card
                      key={key}
                      className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                      data-testid={`card-blog-${key}`}
                    >
                      {/* Blog Image */}
                      {blog.imageUrl ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={blog.imageUrl}
                            alt={blog.title || "Blog image"}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/10 to-destructive/5" />
                      )}

                      {/* Blog Content */}
                      <div className="p-6 flex flex-col flex-1">
                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {blog.category && (
                            <Badge variant="secondary" className="text-xs">
                              {blog.category}
                            </Badge>
                          )}
                          {displayDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{displayDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                          {blog.title}
                        </h3>

                        {/* Excerpt */}
                        {blog.excerpt && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                            {blog.excerpt}
                          </p>
                        )}

                        {/* Author + Read More (Overlay) */}
                        <div className="flex items-center justify-between pt-4 border-t mt-auto">
                          {blog.author && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{blog.author}</span>
                            </div>
                          )}

                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm text-primary flex items-center gap-1"
                            onClick={() => openPreview(blog)}
                          >
                            Read More
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Preview Overlay (mobile-optimized) */}
      <Dialog open={isPreviewOpen} onOpenChange={handleOpenChange}>
        {/* 
          On mobile, make the dialog nearly full-width and allow its BODY to scroll.
          On desktop, constrain to a nicer width.
        */}
        <DialogContent className="w-[95vw] sm:w-auto sm:max-w-3xl p-0">
          {/* Sticky header inside the dialog for better mobile UX */}
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <DialogHeader className="px-5 pt-4 pb-3">
              <DialogTitle className="pr-8">
                {previewItem?.title || "Blog"}
              </DialogTitle>
              <DialogClose asChild>
                <button
                  className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </DialogHeader>
          </div>

          {/* Scrollable content area */}
          <div className="px-5 pb-5 overflow-y-auto max-h-[80vh] sm:max-h-[85vh]">
            {previewItem?.imageUrl && (
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-60 object-cover rounded-md mb-4"
              />
            )}

            <div className="text-sm text-muted-foreground mb-4 flex items-center gap-4 flex-wrap">
              {previewItem?.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {previewItem.author}
                </span>
              )}
              {previewItem?.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(previewItem.publishedAt)}
                </span>
              )}
              {previewItem?.category && (
                <Badge variant="secondary" className="ml-auto">
                  {previewItem.category}
                </Badge>
              )}
            </div>

            {previewItem?.excerpt && (
              <p className="text-base mb-3">{previewItem.excerpt}</p>
            )}

            {previewItem?.content ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {previewItem.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
