// Keep the DSD app-shell logo on the current locale even before client upgrade.
(function () {
  function syncLogo() {
    const locale = location.pathname.match(/^\/(en|zh)(?:\/|$)/)?.[1];
    const logo = document.querySelector('open-layout')?.shadowRoot?.querySelector('a.logo');
    if (logo) logo.setAttribute('href', locale ? `/${locale}/` : '/');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncLogo);
  else syncLogo();
  addEventListener('popstate', syncLogo);
  addEventListener('open:navigation-end', syncLogo);
})();
