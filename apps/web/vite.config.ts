import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
});
