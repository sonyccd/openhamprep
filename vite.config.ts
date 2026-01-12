import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    target: "esnext", // Target modern browsers to avoid legacy polyfills
  },
  // Expose env vars: NEXT_PUBLIC_ (Supabase) and VITE_ (PostHog, Pendo)
  envPrefix: ["NEXT_PUBLIC_", "VITE_"],
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
