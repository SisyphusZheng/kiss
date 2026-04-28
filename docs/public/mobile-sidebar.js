// KISS Mobile Sidebar — L2 (browser API)
// Closes sidebar on backdrop click using composedPath() to penetrate Shadow DOM.
// deno-lint-ignore no-var no-inner-declarations
document.addEventListener('click', function (e) {
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
