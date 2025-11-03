// src/components/sections/ReviewsSection.jsx
import { useQuery } from "@tanstack/react-query";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

/* -----------------------
 * Config
 * --------------------- */
const RAW_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash

// Build candidate URLs to try (absolute first if provided, then same-origin)
const REVIEW_PATH = "/api/reviews";
const CANDIDATE_URLS = [
  ...(API_BASE ? [`${API_BASE}${REVIEW_PATH}`] : []),
  REVIEW_PATH, // same-origin fallback
];

/* -----------------------
 * Helpers
 * --------------------- */
// Small timeout wrapper so a bad endpoint doesn't hang forever (esp. mobile)
async function withTimeout(promise, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await promise(ctrl.signal);
  } finally {
    clearTimeout(id);
  }
}

// Try to fetch JSON from a (url, credentials) pair
async function tryFetchJsonOnce(url, credentials) {
  const doFetch = (signal) =>
    fetch(url, {
      signal,
      credentials, // "omit" or "include"
    });

  const res = await withTimeout(doFetch);
  if (!res.ok) {
    const text = (await res.text().catch(() => "")) || res.statusText;
    throw new Error(`${res.status} ${res.statusText} @ ${url}: ${text}`);
  }
  return res.json();
}

// Try multiple URLs and both credential modes, in a sensible order
// 1) absolute + omit, 2) absolute + include, 3) same-origin + omit, 4) same-origin + include
async function smartFetchReviews() {
  const tried = [];

  for (const url of CANDIDATE_URLS) {
    for (const credentials of ["omit", "include"]) {
      try {
        const data = await tryFetchJsonOnce(url, credentials);
        return { data, mode: { url, credentials } };
      } catch (e) {
        tried.push({ url, credentials, error: e?.message || String(e) });
        // keep trying next combination
      }
    }
  }

  const err = new Error(
    "All attempts to fetch reviews failed:\n" +
      tried.map((t) => `- [${t.credentials}] ${t.url} -> ${t.error}`).join("\n")
  );
  err._attempts = tried;
  throw err;
}

// Normalize array shape if API returns { data: [...] } or a plain array
function toArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (maybe && Array.isArray(maybe.data)) return maybe.data;
  return [];
}

// Flexible "active" check; defaults to visible if flags are missing
function isActiveReview(r) {
  if (!r || typeof r !== "object") return false;

  // Common booleans
  if (typeof r.isActive === "boolean") return r.isActive;
  if (typeof r.active === "boolean") return r.active;
  if (typeof r.published === "boolean") return r.published;
  if (typeof r.isPublished === "boolean") return r.isPublished;

  // String statuses
  const s = String(r.status || "").toLowerCase().trim();
  if (["active", "approved", "publish", "published", "visible", "enabled"].includes(s)) return true;

  // No explicit flags? Show it (prevents silent empty UI)
  return true;
}

/* -----------------------
 * Component
 * --------------------- */
export function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use one query that tries multiple strategies under the hood
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reviews-smart", CANDIDATE_URLS],
    queryFn: smartFetchReviews,
    staleTime: 60_000,
  });

  const raw = useMemo(() => toArray(data?.data), [data]);
  const filtered = useMemo(() => raw.filter(isActiveReview), [raw]);
  const items = filtered.length > 0 ? filtered : raw;

  // Keep index valid when list length changes
  useEffect(() => {
    const maxStart = Math.max(0, items.length - 3);
    setCurrentIndex((prev) => Math.min(prev, maxStart));
  }, [items.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, items.length - 3) : prev - 1
    );
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, Math.max(0, items.length - 3))
    );
  }, [items.length]);

  const showDebug = import.meta.env.DEV;

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Success Stories With Reviews
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our clients who achieved their dreams with our guidance
          </p>
        </div>

        {/* Debug */}
        {showDebug && (
          <div className="mb-4 space-y-1 rounded-md border px-3 py-2 text-xs text-muted-foreground">
            <div>API_BASE: {API_BASE || "(same-origin)"}</div>
            {data?.mode && (
              <div>
                Using: <code>{data.mode.url}</code> | creds: <code>{data.mode.credentials}</code>
              </div>
            )}
            <div>
              counts → raw={raw.length} filtered={filtered.length} shown={items.length}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-32 bg-muted rounded-md" />
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="mb-8 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="font-medium">Couldn’t load reviews.</div>
            <div className="mt-2 break-words opacity-80 whitespace-pre-wrap">
              {error?.message}
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-sm text-muted-foreground">No reviews yet.</div>
        )}

        {/* Grid + Controls */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {(items.length <= 3 ? items : items.slice(currentIndex, currentIndex + 3)).map((review, idx) => {
                const key =
                  review.id ||
                  review._id ||
                  `${review.studentName ?? "student"}-${review.university ?? "uni"}-${idx}`;
                const rating = Math.max(0, Math.min(5, Number(review.rating ?? review.stars ?? 0)));
                const displayName = review.studentName || review.name || "Student";
                const initial =
                  (displayName && displayName.trim().charAt(0).toUpperCase()) || "S";

                return (
                  <Card
                    key={key}
                    className="p-6 transition-all duration-300 hover:shadow-lg"
                    data-testid={`card-review-${key}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Quote className="w-8 h-8 text-primary/20" aria-hidden="true" />
                      <div className="flex gap-1" aria-label={`Rating: ${rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/40"}`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>

                    {review.testimonial || review.comment ? (
                      <p className="text-base text-foreground mb-6 leading-relaxed line-clamp-4">
                        “{review.testimonial || review.comment}”
                      </p>
                    ) : null}

                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar>
                        {review.imageUrl ? (
                          <AvatarImage
                            src={review.imageUrl}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {review.university}
                          {review.country ? `, ${review.country}` : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {items.length > 3 && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border shadow-md hover:bg-accent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= items.length - 3}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border shadow-md hover:bg-accent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
