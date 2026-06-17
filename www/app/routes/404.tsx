/**
 * 404 Not Found Page - with search, helpful links, and old URL redirects
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-button-linear';
import '@openelement/ui/open-input-linear';

const POPULAR_LINKS = [
  { href: '/guide/getting-started', label: 'Getting Started' },
  { href: '/guide/core-concepts', label: 'Core Concepts' },
  { href: '/architecture/dsd', label: 'DSD Rendering' },
  { href: '/apilist', label: 'API Reference' },
  { href: '/architecture/architecture', label: 'Architecture' },
  { href: '/architecture/comparison', label: 'Framework Comparison' },
  { href: '/roadmap', label: 'Roadmap' },
];

/** Mapping of old URLs to new URLs for client-side redirects. */
const REDIRECT_MAP: Record<string, string> = {
  '/engine/architecture': '/architecture/architecture',
  '/engine/dsd': '/architecture/dsd',
  '/engine/islands': '/architecture/islands',
  '/engine/islands-deep': '/architecture/islands-deep',
  '/engine/design-system': '/architecture/design-system',
  '/engine/comparison': '/architecture/comparison',
  '/engine/package-compatibility': '/architecture/package-compatibility',
  '/engine/standards-registry': '/architecture/standards-registry',
  '/engine/reference/core': '/apilist',
  '/guide/migration-v0.24': '/guide/getting-started',
  '/guide/positioning': '/architecture/architecture',
  '/guide/rpc': '/api/reference',
  '/guide/security-middleware': '/guide/error-handling',
  '/guide/content-system': '/guide/routing-and-data',
  '/guide/pwa': '/guide/deployment',
  '/examples': '/architecture/comparison',
  '/components': '/architecture/design-system',
  '/decisions': '/blog',
  '/zh/decisions': '/blog',
};

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .container {
    max-width: 560px;
    margin: 0 auto;
    padding: 120px 32px 96px;
    text-align: center;
  }
  .title {
    font-size: 96px;
    font-weight: 780;
    color: var(--color-text-primary);
    letter-spacing: 0;
    margin: 0;
    line-height: 1;
  }
  .subtitle {
    font-size: 24px;
    font-weight: 600;
    margin: 16px 0 0;
    color: var(--color-text-primary);
  }
  .description {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 8px 0 32px;
  }
  .search-wrapper {
    max-width: 400px;
    margin: 0 auto 40px;
  }
  .popular-label {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 12px;
    letter-spacing: 0.05em;
  }
  .links-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 40px;
  }
  @media (max-width: 600px) {
    .container {
      padding: 80px 20px 64px;
    }
    .title {
      font-size: 64px;
    }
    .subtitle {
      font-size: 20px;
    }
  }
`);

export default class Page404 extends OpenElement {
  static override styles = [linearTokenSheet, styles];
  override render() {
    return (
      <div class='container'>
        <h1 class='title'>404</h1>
        <p class='subtitle'>Page not found</p>
        <p class='description'>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div class='search-wrapper'>
          <open-input-linear variant='search'></open-input-linear>
        </div>
        <p class='popular-label'>Popular pages</p>
        <div class='links-grid'>
          {POPULAR_LINKS.map((l) => (
            <open-button-linear variant='secondary' size='sm' href={l.href}>
              {l.label}
            </open-button-linear>
          ))}
        </div>
        <open-button-linear variant='primary' href='/'>
          Go home
        </open-button-linear>
      </div>
    );
  }
}

customElements.define('page-404', Page404);
export const tagName = 'page-404';
