import { defineConfig } from "vite";
import { openElement } from "@openelement/adapter-vite";

export default defineConfig({
  plugins: [
    openElement({
      mode: "spa",
      routesDir: "./routes",
      islandsDir: "./islands",
      componentsDir: "./components",
    }),
    // Override build entry to use our index.html (not the virtual trigger).
    {
      name: "reader:entry",
      enforce: "post",
      config() {
        return {
          build: {
            rollupOptions: {
              input: "index.html",
              output: {
                entryFileNames: "assets/reader-[hash].js",
              },
            },
          },
        };
      },
    },
  ],
  // ponytail: predictable css output name for server-side reference
  build: {
    cssCodeSplit: false,
  },
});
