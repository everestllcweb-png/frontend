import { Award, Users, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "wouter";

export function AboutSection() {
  const highlights = [
    { icon: Award, text: "15+ Years of Excellence " },
    { icon: Users, text: "100k+ Workers Successfully Placed Worldwide" },
    { icon: Globe, text: "Partner with 200+ Top Employers Globally" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-md overflow-hidden">
              <img
                src="https://media.istockphoto.com/id/1347652268/photo/group-of-colleagues-celebrating-success.jpg?s=612x612&w=0&k=20&c=dojtkf9ItX21j3jtlGOGpbKDs320TTAuofoGnNSZD8Y="
                alt="Workers collaborating while planning their  abroad journey"
                className="w-full h-[400px] lg:h-[500px] object-cover"
                loading="lazy"
                decoding="async"
                data-testid="img-about"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Your Trusted Partner in Global Workforce
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              At Everest Visas Consulting LLC, we are dedicated to transforming dreams into reality. Our expert team provides personalized guidance to help you navigate the complex journey of  abroad.
            </p>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              From Job selection to visa assistance, we're with you every step of the way. Our comprehensive services ensure a smooth transition to your bright future.
            </p>

            {/* Highlights */}
            <div className="space-y-4 mb-8">
              {highlights.map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-base text-foreground pt-2">{text}</p>
                </div>
              ))}
            </div>

            {/* CTA (valid HTML: Button renders <a> via asChild) */}
            <Button size="lg" className="font-medium" data-testid="button-learn-more" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
