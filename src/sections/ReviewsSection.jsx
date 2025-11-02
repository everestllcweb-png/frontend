// src/components/sections/ReviewsSection.jsx
import { useQuery } from "@tanstack/react-query";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// ---- Config ----
const RAW_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing /
const USE_COOKIES = (import.meta.env.VITE_USE_COOKIES ?? "true") !== "false"; // default true

// ---- Fetch helper with credentials + readable errors ----
async function fetchJSON(path) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    credentials: USE_COOKIES ? "include" : "omit",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status} ${res.statusText} @ ${url}: ${text}`);
  }
  return res.json();
}

export function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data: reviews = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE || "(same-origin)", "/api/reviews", USE_COOKIES ? "withCookies" : "noCookies"],
    queryFn: () => fetchJSON("/api/reviews"),
    staleTime: 60_000,
  });

  const activeReviews = useMemo(
    () => (reviews || []).filter((r) => r && r.isActive),
    [reviews]
  );

  // keep index valid when list length changes
  useEffect(() => {
    const maxStart = Math.max(0, activeReviews.length - 3);
    setCurrentIndex((prev) => Math.min(prev, maxStart));
  }, [activeReviews.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, activeReviews.length - 3) : prev - 1
    );
  }, [activeReviews.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, Math.max(0, activeReviews.length - 3))
    );
  }, [activeReviews.length]);

  // --- UI ---
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

        {/* Error (visible on mobile too) */}
        {isError && (
          <div className="mb-8 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="font-medium">Couldn’t load reviews on this device.</div>
            <div className="mt-2 break-words opacity-80">{error?.message}</div>
            <div className="mt-2 text-xs opacity-70">
              Tip: Ensure API is HTTPS, cookies use <code>SameSite=None; Secure</code>,
              and CORS has exact <code>Access-Control-Allow-Origin</code> +{" "}
              <code>Access-Control-Allow-Credentials: true</code>.
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && activeReviews.length === 0 && (
          <div className="text-sm text-muted-foreground">No reviews yet.</div>
        )}

        {/* Grid + Controls */}
        {!isLoading && !isError && activeReviews.length > 0 && (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {(activeReviews.length <= 3
                ? activeReviews
                : activeReviews.slice(currentIndex, currentIndex + 3)
              ).map((review, idx) => {
                const key =
                  review.id ||
                  review._id ||
                  `${review.studentName ?? "student"}-${review.university ?? "uni"}-${idx}`;
                const rating = Math.max(0, Math.min(5, Number(review.rating || 0)));
                const initial =
                  (review.studentName && review.studentName.trim().charAt(0).toUpperCase()) || "S";

                return (
                  <Card
                    key={key}
                    className="p-6 transition-all duration-300 hover:shadow-lg"
                    data-testid={`card-review-${key}`}
                  >
                    {/* Quote + Rating */}
                    <div className="flex items-center justify-between mb-4">
                      <Quote className="w-8 h-8 text-primary/20" aria-hidden="true" />
                      <div className="flex gap-1" aria-label={`Rating: ${rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating ? "text-primary fill-primary" : "text-muted-foreground/40"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Testimonial */}
                    {review.testimonial && (
                      <p className="text-base text-foreground mb-6 leading-relaxed line-clamp-4">
                        “{review.testimonial}”
                      </p>
                    )}

                    {/* Student */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar>
                        {review.imageUrl ? (
                          <AvatarImage
                            src={review.imageUrl}
                            alt={review.studentName || "Student"}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground" data-testid={`text-student-name-${key}`}>
                          {review.studentName || "Student"}
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

            {/* Arrows */}
            {activeReviews.length > 3 && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border shadow-md hover:bg-accent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous reviews"
                  data-testid="button-reviews-prev"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= activeReviews.length - 3}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-card border shadow-md hover:bg-accent active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next reviews"
                  data-testid="button-reviews-next"
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
