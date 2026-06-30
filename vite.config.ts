import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend dev server проксирует /api на бэкенд (server/index.js),
// чтобы ключ провайдера никогда не попадал в браузер.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
