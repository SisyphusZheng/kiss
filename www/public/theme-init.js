// openElement Theme Initialization - L2 (browser API)
// Runs before page render to prevent FOUC (Flash of Unstyled Content).
// Reads saved theme from localStorage or prefers-color-scheme.
// Default: dark theme (matching open-theme-toggle default).
(function () {
  if (typeof document === 'undefined') return;

  // Kill any stale service workers/caches that could serve old blank HTML
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => {}));
      }).catch(() => {});
    }
    if (globalThis.caches?.keys) {
      caches.keys().then((keys) => {
        keys.filter((k) => k.startsWith('open-')).forEach((k) => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
  } catch { /* ignore */ }

  let saved;
  try {
    saved = localStorage.getItem('open-theme');
  } catch {
    // localStorage may be blocked in private browsing or restricted contexts
  }

  let prefersDark = false;
  try {
    prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    // matchMedia may be unavailable in old WebViews
  }

  // Default: dark (matching Linear-style and open-theme-toggle default)
  const theme = saved || (prefersDark ? 'dark' : 'dark');
  try {
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    // Ignore errors
  }
})();
