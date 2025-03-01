import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'waste-app-pdi-web-1.onrender.com',
      '0e64-216-238-103-84.ngrok-free.app',
    ]
  }
});
