import { HeroSlider } from "../HeroSlider";
import { UniversitiesSection } from "../sections/UniversitiesSection";
import { AboutSection } from "../sections/AboutSection";
import { DestinationsSection } from "../sections/DestinationsSection";
import { CoursesSection } from "../sections/CoursesSection";
import { ReviewsSection } from "../sections/ReviewsSection";
import { BlogsSection } from "../sections/BlogsSection";
import Navbar from "../Navbar";
import Footer from "../Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSlider />

      {/* Main Content */}
      <main>
        <UniversitiesSection />
        <AboutSection />
        <DestinationsSection />
        <CoursesSection />
        <ReviewsSection />
        <BlogsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
