// KISS :has() Fallback — L2 (browser API)
// For older browsers (Safari < 15.4, Firefox < 121) that don't support :has().
// deno-lint-ignore no-var no-inner-declarations
(function () {
  if (typeof document === 'undefined') return;
  try {
    var style = document.createElement('style');
    style.innerHTML = ':has(*){}';
    document.head.appendChild(style);
    // style.sheet may be null in certain environments (cross-origin, etc.)
    var sheet = style.sheet;
    if (!sheet) {
      document.head.removeChild(style);
      return; // Assume unsupported
    }
    var supported = sheet.cssRules.length > 0;
    if (!supported) {
      document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('kiss-layout').forEach(function (el) {
          var sr = el.shadowRoot;
          if (sr) {
            var details = sr.querySelector('details.mobile-menu');
            if (details) {
              details.addEventListener('toggle', function () {
                if (this.open) el.classList.add('sidebar-open');
                else el.classList.remove('sidebar-open');
              });
            }
          }
        });
      });
    }
    document.head.removeChild(style);
  } catch (e) {
    console.warn(':has() detection failed:', e);
  }
})();
