import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      cache: true,
      // watch: false,
      // treeshake: false,
      // external: ["@uiw/codemirror-extensions-langs", "react-syntax-highlighter"],

      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
            "lucide-react",
          ],
          "codemirror-vendor": ["@uiw/react-codemirror", "@uiw/codemirror-theme-xcode"],
          "codemirror-extensions-vendor": ["@uiw/codemirror-extensions-langs"],
          "pocketbase-vendor": ["pocketbase"],
          "syntax-highlighter-vendor": ["react-syntax-highlighter"],
          "utils-vendor": [
            "date-fns",
            "zod",
            "react-hook-form",
            "diff",
            "react-intersection-observer",
          ],
        },
      },
    },
  },
});
