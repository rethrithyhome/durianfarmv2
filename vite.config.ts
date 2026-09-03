import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ប្រព័ន្ធគ្រប់គ្រងចំការទុរេន",
        short_name: "ចំការទុរេន",
        description: "ប្រព័ន្ធគ្រប់គ្រងចំការទុរេន ពីការដាំ រហូតដល់លក់ទិន្នផល",
        theme_color: "#1F3A2E",
        background_color: "#F7F3E7",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/")) return "vendor-react";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("leaflet")) return "vendor-leaflet";
          }
        },
      },
    },
  },
});
