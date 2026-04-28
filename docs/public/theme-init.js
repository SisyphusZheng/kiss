// KISS Theme Initialization — L2 (browser API)
// Runs before page render to prevent FOUC (Flash of Unstyled Content).
// Reads saved theme from localStorage or prefers-color-scheme.
// deno-lint-ignore no-var no-window
(function () {
  var saved = localStorage.getItem('kiss-theme');
  var prefersLight = globalThis.matchMedia('(prefers-color-scheme: light)').matches;
  var theme = saved || (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
})();
