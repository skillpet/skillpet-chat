import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mockServerPlugin } from "./mock-server";

export default defineConfig({
  plugins: [react(), tailwindcss(), mockServerPlugin()],
  server: { port: 5400 },
});
