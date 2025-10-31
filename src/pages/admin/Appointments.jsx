import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

import { format, parseISO, isValid } from "date-fns";
import { Mail, Phone, Calendar, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

// ✅ Prod-safe base (also works locally)
const API_BASE = import.meta.env.VITE_API_URL || "";

// helpers
const getId = (x) => x?.id ?? x?._id ?? null;
const normalize = (x) => (x ? { ...x, id: getId(x) } : x);
const fmtDate = (value, pattern = "PPP") => {
  if (!value) return "";
  const d = typeof value === "string" ? parseISO(value) : new Date(value);
  if (!isValid(d)) return "";
  return format(d, pattern);
};

export default function Appointments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // READ
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [API_BASE, "/api/appointments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}/api/appointments`);
      const list = await res.json();
      return Array.isArray(list) ? list.map(normalize) : [];
    },
  });

  // UPDATE
  const updateAppointment = useMutation({
    mutationFn: async ({ id, status }) => {
      if (!id) throw new Error("Missing appointment id");
      const res = await apiRequest("PUT", `${API_BASE}/api/appointments/${id}`, { status });
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/appointments"] });
      toast({ title: "Success", description: "Appointment updated successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  // DELETE
  const deleteAppointment = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Missing appointment id");
      const res = await apiRequest("DELETE", `${API_BASE}/api/appointments/${id}`, {});
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_BASE, "/api/appointments"] });
      toast({ title: "Success", description: "Appointment deleted successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete appointment",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">Loading appointments...</div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 text-red-600">
          Failed to load appointments: {error?.message || "Unknown error"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
          <p className="text-muted-foreground">Manage appointment requests from visitors</p>
        </div>

        <div className="space-y-4">
          {appointments.map((appointment) => {
            const id = getId(appointment);
            const dateLabel = fmtDate(appointment.preferredDate, "PPP");
            const status = (appointment.status || "pending").toLowerCase();

            return (
              <Card key={id || appointment.email || appointment.fullName} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{appointment.fullName}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {appointment.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {appointment.phone}
                      </div>
                    </div>
                  </div>
                  <Badge variant={status === "pending" ? "destructive" : "default"}>
                    {status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {dateLabel || "—"}
                      {appointment.preferredTime && ` at ${appointment.preferredTime}`}
                    </span>
                  </div>
                  {appointment.service && (
                    <div className="text-sm">
                      <span className="font-medium">Service:</span> {appointment.service}
                    </div>
                  )}
                </div>

                {appointment.message && (
                  <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-md">
                    {appointment.message}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Select
                    value={status}
                    onValueChange={(next) => {
                      if (!id) {
                        toast({
                          title: "Missing ID",
                          description: "This appointment does not have an id field.",
                          variant: "destructive",
                        });
                        return;
                      }
                      updateAppointment.mutate({ id, status: next });
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!id) {
                        toast({
                          title: "Missing ID",
                          description: "This appointment does not have an id field.",
                          variant: "destructive",
                        });
                        return;
                      }
                      deleteAppointment.mutate(id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}

          {appointments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No appointments yet</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
