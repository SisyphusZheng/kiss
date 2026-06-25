import { defineApp } from "@openelement/app";
import { getRouter, routes, setRouter } from "./routes.ts";

export function bootReader() {
  const app = defineApp({ mode: "spa", routes });
  app.mount("#root");
  // ponytail: expose router to route components for navigation
  setRouter(app.router);

  // ─── Keyboard shortcuts ──────────────────────────────────────
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const router = getRouter();
    if (!router) return;

    const pathname = globalThis.location.pathname;
    const tag = (e.target as HTMLElement)?.tagName;
    // Don't intercept when typing in inputs
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    // ArrowLeft / ArrowRight: page nav on reading route
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (!pathname.startsWith("/books/")) return;
      e.preventDefault();
      const url = new URL(globalThis.location.href);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const newPage = e.key === "ArrowLeft" ? Math.max(1, page - 1) : page + 1;
      router.navigate(`${pathname}?page=${newPage}`);
      return;
    }

    // Meta/Ctrl+F → search
    if ((e.metaKey || e.ctrlKey) && e.key === "f") {
      e.preventDefault();
      router.navigate("/search");
      return;
    }

    // Meta/Ctrl+, → settings
    if ((e.metaKey || e.ctrlKey) && e.key === ",") {
      e.preventDefault();
      router.navigate("/settings");
      return;
    }

    // Escape: back to reading surface from settings/search
    if (e.key === "Escape") {
      if (pathname === "/search" || pathname === "/settings") {
        router.navigate("/");
      }
    }
  });

  return app;
}
