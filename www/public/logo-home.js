// Keep the DSD app-shell logo on the current locale even before client upgrade.
(function () {
  function syncLogo() {
    // Locale prefix pattern mirrors LOCALE_PREFIX_RE in app/site-ui/open-layout.tsx
    // (public scripts are static assets and cannot import app modules).
    const locale = location.pathname.match(/^\/(en|zh)(?:\/|$)/)?.[1];
    const logo = document.querySelector('open-layout')?.shadowRoot?.querySelector('a.logo');
    if (logo) logo.setAttribute('href', locale ? `/${locale}/` : '/');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncLogo);
  else syncLogo();
  addEventListener('popstate', syncLogo);
})();
