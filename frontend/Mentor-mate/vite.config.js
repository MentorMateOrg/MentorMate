import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    // Only use proxy in development mode
    ...(mode === "development" && {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    }),
    // Configure fallback for SPA routing in development
    historyApiFallback: true,
  },
  // Configure fallback for SPA routing in production builds
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Configure preview server for production builds
  preview: {
    historyApiFallback: true,
  },
}));
