// KISS Mobile Sidebar — L2 (browser API)
// Closes sidebar on backdrop click or nav link click (mobile).
// Uses composedPath() to penetrate Shadow DOM.
// deno-lint-ignore no-var no-inner-declarations
if (typeof document !== 'undefined') document.addEventListener('click', function (e) {
  const target = e.target;
  if (!target || !(target instanceof Element)) return;

  var path = e.composedPath();
  var isBackdrop = false;
  var isNavLink = false;

  for (var i = 0; i < path.length; i++) {
    var el = path[i];
    if (!el.classList) continue;
    if (el.classList.contains('mobile-backdrop')) isBackdrop = true;
    // KISS S-constraint: nav links are <a> elements in the sidebar
    if (el.tagName === 'A' && (
      el.closest('.sidebar-nav') || el.closest('.nav-section')
    )) isNavLink = true;
    if (isBackdrop || isNavLink) break;
  }

  if (!isBackdrop && !isNavLink) return;

  document.querySelectorAll('kiss-layout').forEach(function (el) {
    var sr = el.shadowRoot;
    if (sr) {
      var details = sr.querySelector('details.mobile-menu');
      if (details && details.open) details.removeAttribute('open');
    }
  });
});
