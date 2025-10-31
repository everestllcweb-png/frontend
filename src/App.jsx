import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './ui/toaster';

import Home from './pages/HomePage';
import UniversitiesPage from './pages/UniversitiesPage';
import CoursesPage from './pages/CoursesPage';
import DestinationsPage from './pages/DestinationsPage';
import ClassesPage from './pages/ClassesPage';
import BlogsPage from './pages/BlogsPage';
import Other from './pages/OtherPage';
import About from './pages/AboutPage';
import AppointmentPage from './pages/AppointmentPage';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import Settings from './pages/admin/Settings';
import Sliders from './pages/admin/Sliders';
import Universities from './pages/admin/Universities';
import Courses from './pages/admin/Courses';
import Destinations from './pages/admin/Destinations';
import Classes from './pages/admin/Classes';
import Blogs from './pages/admin/Blogs';
import Reviews from './pages/admin/Reviews';
import Appointments from './pages/admin/Appointments';
import Team from './pages/admin/Team';

import NotFound from './pages/not-found';
import ProtectedRoute from './auth/ProtectedRoute';

// Small wrappers so Wouter can pass a component
const DashboardPage = () => (
  <ProtectedRoute><AdminDashboard /></ProtectedRoute>
);
const SettingsPage = () => (
  <ProtectedRoute><Settings /></ProtectedRoute>
);
const SlidersPage = () => (
  <ProtectedRoute><Sliders /></ProtectedRoute>
);
const UniversitiesAdminPage = () => (
  <ProtectedRoute><Universities /></ProtectedRoute>
);
const CoursesAdminPage = () => (
  <ProtectedRoute><Courses /></ProtectedRoute>
);
const DestinationsAdminPage = () => (
  <ProtectedRoute><Destinations /></ProtectedRoute>
);
const ClassesAdminPage = () => (
  <ProtectedRoute><Classes /></ProtectedRoute>
);
const BlogsAdminPage = () => (
  <ProtectedRoute><Blogs /></ProtectedRoute>
);
const ReviewsAdminPage = () => (
  <ProtectedRoute><Reviews /></ProtectedRoute>
);
const AppointmentsAdminPage = () => (
  <ProtectedRoute><Appointments /></ProtectedRoute>
);

function Router() {
  return (
    <Switch>
      {/* public */}
      <Route path="/" component={Home} />
      <Route path="/partners" component={UniversitiesPage} />
      <Route path="/jobs" component={CoursesPage} />
      <Route path="/destinations" component={DestinationsPage} />
      <Route path="/services" component={ClassesPage} />
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/about" component={About} />
      <Route path="/other" component={Other} />
      <Route path="/appointment" component={AppointmentPage} />

      {/* admin login is public */}
      <Route path="/admin" component={AdminLogin} />

      {/* admin protected */}
      <Route path="/admin/dashboard" component={DashboardPage} />
      <Route path="/admin/settings" component={SettingsPage} />
      <Route path="/admin/sliders" component={SlidersPage} />
      <Route path="/admin/universities" component={UniversitiesAdminPage} />
      <Route path="/admin/courses" component={CoursesAdminPage} />
      <Route path="/admin/destinations" component={DestinationsAdminPage} />
      <Route path="/admin/classes" component={ClassesAdminPage} />
      <Route path="/admin/blogs" component={BlogsAdminPage} />
      <Route path="/admin/reviews" component={ReviewsAdminPage} />
      <Route path="/admin/appointments" component={AppointmentsAdminPage} />
      <Route path="/admin/team" component={Team} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
 
      <Toaster />
    </QueryClientProvider>
  );
}
