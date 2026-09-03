import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": { target: "http://127.0.0.1:4343", changeOrigin: true },
      "/__vibet": { target: "http://127.0.0.1:4343", changeOrigin: true },
      "/p": { target: "http://127.0.0.1:4343", changeOrigin: true, ws: true },
      "/term": { target: "ws://127.0.0.1:4343", ws: true },
    },
  },
});
