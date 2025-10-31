import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

// ✅ Base API URL from environment (.env)
const API_BASE = import.meta.env.VITE_API_URL || "";

// ✅ Fetch helper (absolute URL + credentials)
async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ Separate caches per API_BASE (dev/prod)
  const { data: slides = [], isLoading } = useQuery({
    queryKey: [API_BASE, "/api/sliders"],
    queryFn: () => fetchJSON("/api/sliders"),
    staleTime: 60_000,
  });

  const activeSlides = useMemo(
    () => (slides || []).filter((s) => s && s.isActive),
    [slides]
  );

  // ✅ Keep index valid if slides change
  useEffect(() => {
    if (activeSlides.length === 0) return;
    setCurrentSlide((prev) =>
      prev >= activeSlides.length ? 0 : Math.max(0, prev)
    );
  }, [activeSlides.length]);

  // ✅ Auto-advance
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const goToPrevious = () =>
    setCurrentSlide((prev) =>
      activeSlides.length ? (prev === 0 ? activeSlides.length - 1 : prev - 1) : 0
    );
  const goToNext = () =>
    setCurrentSlide((prev) =>
      activeSlides.length ? (prev + 1) % activeSlides.length : 0
    );

  // ⏳ Loading skeleton
  if (isLoading) {
    return (
      <div className="relative min-h-[600px] lg:min-h-[700px] bg-gradient-to-br from-primary/20 via-background to-destructive/10 animate-pulse" />
    );
  }

  // 🚫 No slides fallback
  if (activeSlides.length === 0) {
    return (
      <div className="relative min-h-[600px] lg:min-h-[700px] bg-gradient-to-br from-primary/20 via-background to-destructive/10 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            Your Gateway to Global Education
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8">
            Expert guidance for studying abroad with personalized support every step of the way
          </p>
          <Link href="/appointment">
            <Button size="lg" className="font-medium" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Slides UI (clickable buttons on top of image)
  return (
    <div className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden bg-background mt-16 lg:mt-20">
      {/* Slides */}
      {activeSlides.map((slide, index) => {
        const key = slide.id || slide._id || slide.slug || index;
        const img = slide.imageUrl || "";
        const title = slide.title || "";
        const subtitle = slide.subtitle || "";
        const btnText = slide.buttonText || "";
        const btnLink = slide.buttonLink || "";

        return (
          <div
            key={key}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            data-testid={`slide-${index}`}
          >
            {/* Background (click-through) */}
            <div className="absolute inset-0 pointer-events-none">
              {img ? (
                <img
                  src={img}
                  alt={title || "Slide"}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-destructive/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 pointer-events-none" />
            </div>

            {/* Text + Buttons (on top) */}
            <div className="relative z-10 h-full flex items-center pointer-events-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {title && (
                    <h1
                      className="text-4xl lg:text-6xl font-bold text-white mb-6 animate-in fade-in slide-in-from-left-8 duration-1000"
                      data-testid={`text-slide-title-${index}`}
                    >
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p
                      className="text-lg lg:text-2xl text-white/90 mb-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150"
                      data-testid={`text-slide-subtitle-${index}`}
                    >
                      {subtitle}
                    </p>
                  )}
                  {btnText && btnLink && (
                    <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
                      <Link href={btnLink}>
                        <Button
                          size="lg"
                          variant="default"
                          className="font-medium backdrop-blur-md"
                          data-testid={`button-slide-cta-${index}`}
                        >
                          {btnText}
                        </Button>
                      </Link>
                      <Link href="/about">
                        <Button
                          size="lg"
                          variant="outline"
                          className="font-medium bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                          data-testid={`button-slide-secondary-${index}`}
                        >
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-all shadow-lg"
            aria-label="Previous slide"
            data-testid="button-slide-prev"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-all shadow-lg"
            aria-label="Next slide"
            data-testid="button-slide-next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`button-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
