import { Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger } from "../ui/sidebar";
import {
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  GraduationCap,
  BookOpen,
  MapPin,
  Calendar,
  FileText,
  Star,
  Mail,
  LogOut,
  Users
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "../ui/button";
import { useToast } from "../hooks/use-toast";

export function AdminLayout({ children }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/admin/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Settings", url: "/admin/settings", icon: Settings },
      ],
    },
    {
      title: "Content Management",
      items: [
        { title: "Hero Sliders", url: "/admin/sliders", icon: ImageIcon },
        { title: "Partners", url: "/admin/universities", icon: GraduationCap },
        { title: "Jobs", url: "/admin/courses", icon: BookOpen },
        { title: "Destinations", url: "/admin/destinations", icon: MapPin },
        { title: "Services", url: "/admin/classes", icon: Calendar },
        { title: "Blogs", url: "/admin/blogs", icon: FileText },
        { title: "Teams", url: "/admin/team", icon: Users },
        { title: "Reviews", url: "/admin/reviews", icon: Star },
      ],
    },
    {
      title: "Appointments",
      items: [{ title: "View Appointments", url: "/admin/appointments", icon: Mail }],
    },
  ];

  // CSS variables for the sidebar
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            {/* Logo/Brand */}
            <div className="px-4 py-6 border-b">
              <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
              <h4 className="text-xs text-muted-foreground mt-1">Everest LLC</h4>
              
            </div>

            {/* Menu */}
            {menuItems.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link
                            href={item.url}
                            className="flex items-center gap-3 w-full"
                            data-testid={`link-${item.title
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {/* Logout */}
            <div className="mt-auto p-4 border-t">
              <h3 className="text-xs font-bold mb-2 text-muted-foreground mt-1">Developer-Santosh Thapa</h3>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-sm text-muted-foreground">Welcome, Admin</div>
          </header>
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
