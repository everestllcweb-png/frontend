import { AdminLayout } from "../../admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../ui/card";
import { GraduationCap, BookOpen, MapPin, Mail, Calendar, FileText, Users } from "lucide-react";

// ✅ API base (works local + Render + Netlify)
const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchJSON(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export default function Dashboard() {
  const { data: universities = [] } = useQuery({
    queryKey: [API_BASE, "/api/universities"],
    queryFn: () => fetchJSON("/api/universities"),
  });

  const { data: courses = [] } = useQuery({
    queryKey: [API_BASE, "/api/courses"],
    queryFn: () => fetchJSON("/api/courses"),
  });

  const { data: destinations = [] } = useQuery({
    queryKey: [API_BASE, "/api/destinations"],
    queryFn: () => fetchJSON("/api/destinations"),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: [API_BASE, "/api/appointments"],
    queryFn: () => fetchJSON("/api/appointments"),
  });

  const { data: blogs = [] } = useQuery({
    queryKey: [API_BASE, "/api/blogs"],
    queryFn: () => fetchJSON("/api/blogs"),
  });

  const { data: classes = [] } = useQuery({
    queryKey: [API_BASE, "/api/classes"],
    queryFn: () => fetchJSON("/api/classes"),
  });

  // ✅ NEW: Fetch team list
  const { data: team = [] } = useQuery({
    queryKey: [API_BASE, "/api/team"],
    queryFn: () => fetchJSON("/api/team"),
  });

  // ✅ Counts
  const activeUniversities = universities.filter((u) => u?.isActive).length;
  const activeCourses = courses.filter((c) => c?.isActive).length;
  const activeDestinations = destinations.filter((d) => d?.isActive).length;
  const activeClasses = classes.filter((c) => c?.isActive).length;
  const publishedBlogs = blogs.filter((b) => b?.isPublished).length;
  const pendingAppointments = appointments.filter((a) => a?.status === "pending").length;

  // ✅ Team count
  const teamCount = team.length;

  const stats = [
    { title: "Universities", count: activeUniversities, icon: GraduationCap, color: "text-primary" },
    { title: "Courses", count: activeCourses, icon: BookOpen, color: "text-primary" },
    { title: "Destinations", count: activeDestinations, icon: MapPin, color: "text-primary" },
    { title: "Classes", count: activeClasses, icon: Calendar, color: "text-primary" },
    { title: "Blogs", count: publishedBlogs, icon: FileText, color: "text-primary" },
    { title: "Team Members", count: teamCount, icon: Users, color: "text-primary" },
    { title: "Pending Appointments", count: pendingAppointments, icon: Mail, color: "text-destructive" },
  ];

  const totalContent =
    universities.length + courses.length + destinations.length + classes.length + blogs.length + team.length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 hover-elevate active-elevate-2 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Lower Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Appointments</h2>
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => {
                const key = appointment.id || appointment._id || appointment.email;
                const isPending = appointment.status === "pending";
                return (
                  <div key={key} className="flex items-start justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{appointment.fullName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        isPending ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                );
              })}
              {appointments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No appointments yet</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Total Content Items</span>
                <span className="font-medium">{totalContent}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Published Blogs</span>
                <span className="font-medium">{publishedBlogs}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Active Universities</span>
                <span className="font-medium">{activeUniversities}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
