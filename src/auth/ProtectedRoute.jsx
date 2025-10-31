import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

// Simple loader UI (you can replace with your own)
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

/**
 * ProtectedRoute:
 * - Calls /api/auth/me to check session.
 * - While loading => spinner.
 * - If 401/unauthorized => redirect to /admin (login).
 * - If OK => render children.
 */
export default function ProtectedRoute({ children }) {
  const [, setLocation] = useLocation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    // If not loading and there is an error, assume unauthorized → redirect to login
    if (!isLoading && (isError || !data)) {
      setLocation("/admin"); // login page
    }
  }, [isLoading, isError, data, setLocation]);

  if (isLoading) return <Spinner />;

  // If authorized, data should exist (e.g., { id, username, role })
  if (data && !isError) return children;

  // While redirecting (isError case), render nothing
  return null;
}
