import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    globals: false,
    include: ["src/**/*.test.ts"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    setupFiles: [],
    passWithNoTests: true,
  },
});
