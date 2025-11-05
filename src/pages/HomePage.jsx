import { HeroSlider } from "../HeroSlider";
import { UniversitiesSection } from "../sections/UniversitiesSection";
import { AboutSection } from "../sections/AboutSection";
import { DestinationsSection } from "../sections/DestinationsSection";
import { CoursesSection } from "../sections/CoursesSection";
import { ReviewsSection } from "../sections/ReviewsSection";
import { BlogsSection } from "../sections/BlogsSection";
import Navbar from "../Navbar";
import Footer from "../Footer";
import WhatsApp from "../sections/WhatsApp";


export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSlider />

      {/* Main Content */}
      <main>
        <WhatsApp/>
        <AboutSection />
        <CoursesSection />
        <DestinationsSection />
        <ReviewsSection />
        <UniversitiesSection />
        <BlogsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
