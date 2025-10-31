// src/lib/queryClient.js
import { QueryClient } from "@tanstack/react-query";

// Accept either VITE_API_URL or VITE_API_BASE_URL
const RAW_BASE =
  (import.meta.env?.VITE_API_URL ||
   import.meta.env?.VITE_API_BASE_URL ||
   "").toString();

const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash
const isAbsoluteUrl = (u) => /^https?:\/\//i.test(u);

const resolveUrl = (u) => {
  if (!u) return u;
  if (isAbsoluteUrl(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${API_BASE}${path}`;
};

async function throwIfResNotOk(res) {
  if (!res.ok) {
    let message;
    try {
      const text = await res.text();
      message = text || res.statusText;
    } catch {
      message = res.statusText;
    }
    throw new Error(`${res.status}: ${message}`);
  }
}

export async function apiRequest(method, url, data) {
  const fullUrl = resolveUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const joined = Array.isArray(queryKey) ? queryKey.map(String).join("/") : String(queryKey || "");
    const urlLike = joined.startsWith("/") ? joined : `/${joined}`;
    const fullUrl = resolveUrl(urlLike);

    const res = await fetch(fullUrl, { credentials: "include" });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) return null;

    await throwIfResNotOk(res);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});
