import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "remover-preview-do-build",
      apply: "build",
      closeBundle() {
        const arquivo = path.resolve(import.meta.dirname, "dist/__preview.html");
        if (fs.existsSync(arquivo)) fs.rmSync(arquivo);
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { port: 8080, strictPort: true, host: true },
  preview: { port: 4173 },
  build: { target: "es2020", cssCodeSplit: false, sourcemap: false },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
