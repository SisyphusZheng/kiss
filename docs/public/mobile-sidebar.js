// KISS Mobile Sidebar — L2 (browser API)
// Closes sidebar on backdrop click using composedPath() to penetrate Shadow DOM.
// deno-lint-ignore no-var no-inner-declarations
if (typeof document !== 'undefined') document.addEventListener('click', function (e) {
  // Early exit: only process if the click target is or is inside a backdrop
  const target = e.target;
  if (!target || !(target instanceof Element)) return;

  var path = e.composedPath();
  for (var i = 0; i < path.length; i++) {
    if (path[i].classList && path[i].classList.contains('mobile-backdrop')) {
      document.querySelectorAll('kiss-layout').forEach(function (el) {
        var sr = el.shadowRoot;
        if (sr) {
          var details = sr.querySelector('details.mobile-menu');
          if (details && details.open) details.removeAttribute('open');
        }
      });
      break;
    }
  }
});
