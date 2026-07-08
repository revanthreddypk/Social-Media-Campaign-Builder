import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, forward /api to `vercel dev` on port 3000 if you run it.
      // If you don't run vercel dev, AI features simply show a friendly notice.
      "/api": "http://localhost:3000"
    }
  }
});
