import Navbar from "../Navbar";
import Footer from "../Footer";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "../shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

// === NEW: prod-safe API base (works locally and on Render) ===
const API_BASE = import.meta.env.VITE_API_URL || "";

// keep it a string (schema requires string), but make it ISO (still a string)
const toISOstringOrSame = (yyyyMMdd) => {
  if (!yyyyMMdd) return "";
  // produce ISO string (still a string, ok for your schema)
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

export default function AppointmentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      preferredDate: "",
      preferredTime: "",
      service: "",
      message: "",
    },
  });

  const serviceValue = watch("service");

  const createAppointment = useMutation({
    mutationFn: async (data) => {
      // === CHANGED: prefix with API_BASE so it works after deploy ===
      const res = await apiRequest("POST", `${API_BASE}/api/appointments`, data);
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      setIsSubmitted(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Requested",
        description: "We'll contact you soon to confirm your appointment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to submit appointment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    const payload = {
      fullName: data.fullName.trim(),                        // string
      email: data.email.trim(),                              // string
      phone: data.phone.trim(),                              // string (required by schema)
      preferredDate: toISOstringOrSame(data.preferredDate),  // string (ISO OK)
      preferredTime: (data.preferredTime || "").trim(),      // string ("" allowed)
      service: (data.service || "").trim(),                  // string ("" allowed)
      message: (data.message || "").trim(),                  // string ("" allowed)
      // ⛔ NO status here — your schema doesn't include it
    };

    if (!payload.preferredDate) {
      toast({
        title: "Invalid date",
        description: "Please choose a valid preferred date.",
        variant: "destructive",
      });
      return;
    }

    createAppointment.mutate(payload);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 lg:pt-20">
          <section className="py-20 lg:py-32">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
                Thank You!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your appointment request has been received. Our team will
                contact you shortly to confirm the details.
              </p>
              <Button onClick={() => setIsSubmitted(false)} data-testid="button-book-another">
                Book Another Appointment
              </Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        {/* Hero */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-destructive/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Book Your Consultation
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground">
                Schedule a personalized consultation with our expert counselors.
                We're here to guide you every step of the way.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 lg:p-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" {...register("fullName")} className="mt-2" />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{String(errors.fullName.message)}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...register("email")} className="mt-2" />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{String(errors.email.message)}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" {...register("phone")} className="mt-2" />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{String(errors.phone.message)}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="preferredDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Preferred Date *
                    </Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      {...register("preferredDate")}
                      className="mt-2"
                      onChange={(e) => setValue("preferredDate", e.target.value, { shouldValidate: true })}
                    />
                    {errors.preferredDate && (
                      <p className="text-sm text-destructive mt-1">{String(errors.preferredDate.message)}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="preferredTime" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Preferred Time
                    </Label>
                    <Input id="preferredTime" type="time" {...register("preferredTime")} className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service">Service Interested In</Label>
                  <Select
                    value={serviceValue || undefined}
                    onValueChange={(v) => setValue("service", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="university-selection">Job Selection</SelectItem>
                      <SelectItem value="visa-assistance">Visa Assistance</SelectItem>
                      <SelectItem value="course-counseling">Service Counseling</SelectItem>
                      <SelectItem value="scholarship-guidance">Skilled Jobs </SelectItem>
                      <SelectItem value="test-preparation">Training Support</SelectItem>
                      <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Additional Message</Label>
                  <Textarea id="message" {...register("message")} rows={5} className="mt-2" />
                </div>

                <Button type="submit" size="lg" className="w-full font-medium" disabled={createAppointment.isPending}>
                  {createAppointment.isPending ? "Submitting..." : "Book Appointment"}
                </Button>
              </form>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
