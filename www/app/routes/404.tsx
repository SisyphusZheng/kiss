/**
 * 404 Not Found Page - with search, helpful links, and old URL redirects
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import '@openelement/ui/open-input';
import '@openelement/site-ui/open-brand-mark.tsx';

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
  '/guide/rpc': '/apilist',
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
  :host {
    display: block;
    color: var(--text-primary);
  }
  .container {
    display: grid;
    justify-items: center;
    max-width: none;
    min-height: min(700px, calc(100svh - var(--nav-height)));
    margin: 0 auto;
    padding: var(--size-16) var(--size-6);
    text-align: center;
    background:
      radial-gradient(circle at 50% 22%, color-mix(in srgb, var(--brand-pale) 46%, transparent), transparent 34%),
      var(--bg-base);
  }
  .title {
    font-size: calc(var(--font-size-8) * 1.35);
    font-weight: var(--font-weight-9);
    color: var(--text-primary);
    letter-spacing: 0;
    margin: 0;
    line-height: 1;
  }
  .mark { width:clamp(5rem,12vw,9rem); margin-bottom:var(--size-6); filter:drop-shadow(0 0 44px color-mix(in srgb,var(--brand) 42%,transparent)); }
  .subtitle {
    font-size: var(--font-size-4);
    font-weight: var(--font-weight-8);
    margin: var(--size-3) 0 0;
    color: var(--text-primary);
  }
  .description {
    max-width: 520px;
    font-size: var(--font-size-1);
    color: var(--text-secondary);
    margin: var(--size-2) 0 var(--size-7);
    line-height: var(--font-lineheight-3);
  }
  .search-wrapper {
    max-width: 400px;
    width: 100%;
    margin: 0 auto var(--size-8);
  }
  .popular-label {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
    color: var(--brand);
    margin-bottom: var(--size-3);
    letter-spacing: 0;
  }
  .links-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
    justify-content: center;
    margin-bottom: var(--size-8);
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
  static override styles = [styles];
  override render() {
    return (
      <div class='container'>
        <open-brand-mark class='mark' size='xl'></open-brand-mark>
        <h1 class='title'>404</h1>
        <p class='subtitle'>Page not found</p>
        <p class='description'>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div class='search-wrapper'>
          <open-input placeholder='Search docs and API'></open-input>
        </div>
        <p class='popular-label'>Popular pages</p>
        <div class='links-grid'>
          {POPULAR_LINKS.map((l) => (
            <open-button size='sm' href={l.href}>
              {l.label}
            </open-button>
          ))}
        </div>
        <open-button variant='primary' href='/'>
          Go home
        </open-button>
      </div>
    );
  }
}

customElements.define('page-404', Page404);
export const tagName = 'page-404';
