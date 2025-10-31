import Navbar  from ".././Navbar";
import  Footer  from ".././Footer";
import { HelpCircle, FileText, Phone, Mail } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "wouter";

export default function OtherPage() {
  const resources = [
    {
      icon: FileText,
      title: "Application Guidelines",
      description: "Step-by-step guides for applying  abroad" },
    {
      icon: HelpCircle,
      title: "FAQs",
      description: "Common questions about working abroad answered" },
    {
      icon: Phone,
      title: "Contact Support",
      description: "Get in touch with our expert counselors" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-destructive/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Additional Resources
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground">
                Everything you need to make informed decisions about your international education journey
              </p>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resources.map((resource, index) => (
                <Card key={index} className="p-8 text-center hover-elevate active-elevate-2 transition-all">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
                    <resource.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {resource.title}
                  </h3>
                  <p className="text-base text-muted-foreground mb-6">
                    {resource.description}
                  </p>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Need Personalized Guidance?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our expert counselors are ready to help you navigate your  abroad journey
            </p>
            <Link href="/appointment">
              <Button size="lg" className="font-medium" data-testid="button-schedule-consultation">
                Schedule a Consultation
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
