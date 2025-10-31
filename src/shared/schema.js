import { z } from "zod";

export const insertAppointmentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().max(50).optional().default(""),
  service: z.string().max(100).optional().default(""),
  message: z.string().max(1000, "Message too long").optional(),
});
