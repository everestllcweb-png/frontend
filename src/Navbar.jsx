import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";

// ---- NEW: configure API base from env (prod uses Render URL)
const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper: robust fetch with absolute URL + credentials
async function fetchJSON(path) {
  // Works with either absolute or relative path
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch site settings (logo, company name, etc.) — key includes API_BASE so cache splits per env
  const { data: settings } = useQuery({
    queryKey: [API_BASE, "/api/settings"],
    queryFn: () => fetchJSON("/api/settings"),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Job Demands", path: "/jobs" },
    { name: "Partners", path: "/partners" },
    { name: "Destinations", path: "/destinations" },
    { name: "Services", path: "/services" },
    { name: "Blogs", path: "/blogs" },
    { name: "Others", path: "/other" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo (FIXED: go to "/") */}
          <Link href="/">
            <div
              className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-2 py-1 cursor-pointer"
              data-testid="link-home"
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName || "Logo"}
                  className="h-10 lg:h-12 w-auto object-contain"
                />
              ) : (
                <div className="h-10 lg:h-12 w-32 bg-primary/10 rounded-md flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {settings?.companyName || "Everest LLC"}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <span
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2 cursor-pointer ${
                    location === link.path ? "text-primary" : "text-foreground"
                  }`}
                  data-testid={`link-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Book a Visit Button */}
          <div className="hidden lg:block">
            <Link href="/appointment">
              <Button
                variant="default"
                className="font-medium"
                data-testid="button-appointment"
              >
                Book a Visit
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-b shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <div
                  className={`block px-4 py-3 rounded-md text-base font-medium hover-elevate active-elevate-2 cursor-pointer ${
                    location === link.path
                      ? "text-primary bg-primary/5"
                      : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </div>
              </Link>
            ))}
            <Link href="/appointment">
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full mt-2" data-testid="button-mobile-appointment">
                  Book a Visit
                </Button>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
