// E2E probe route for #1148 / ADR-0142 (light-mode in-place activation).
//
// Deliberate deviations from content routes like roadmap.tsx:
//
// - No `meta` export: the nav scanner (packages/adapter-vite
//   .../content/nav/scanner.ts) only admits routes with a static
//   section+label meta, and the header nav is hand-configured, so this page
//   enters neither. It is also excluded from sitemap.xml via the sitemap
//   `exclude` list in www/vite.config.ts.
// - `renderMode = 'light'` on the page itself: the probe island must sit in
//   the document tree, not inside a page shadow root. Page elements are
//   never registered on the client (only islands are), so a pre-upgrade
//   click landing in a shadow-mode page would key its replay queue to the
//   never-hydrating page host and be lost; in light DOM the queue keys to
//   the island host itself (pre-hydration-click.ts). The app shell still
//   wraps the route — the light page element is slotted into open-layout
//   like any other page.

import { element, OpenElement } from '@openelement/element';

@element('probe-light', { root: 'light' })
export default class ProbeLightPage extends OpenElement {
  render() {
    return (
      <main class='probe-light-page'>
        <h1>Light-mode activation probe</h1>
        <open-light-probe class='probe-host'></open-light-probe>
      </main>
    );
  }
}
