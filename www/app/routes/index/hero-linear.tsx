/** @jsxImportSource @openelement/core */
/**
 * Hero section — Linear.app-style two-column layout.
 * Left: eyebrow, headline, subhead, CTA buttons.
 * Right: code panel with macOS-style card.
 */
import { StyleSheet, type StyleSheetLike } from "@openelement/core/style-sheet";
import "@openelement/ui/open-button-linear";
import "@openelement/ui/open-card-linear";

export const heroSheet: StyleSheetLike = new StyleSheet();
heroSheet.replaceSync(`
  .hero-section {
    padding-top: 120px;
    padding-bottom: 64px;
    padding-left: var(--space-xl);
    padding-right: var(--space-xl);
  }
  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 480px;
    gap: var(--space-xl);
    align-items: start;
  }
  .hero-eyebrow {
    font-family: var(--font-sans);
    font-size: var(--font-size-eyebrow);
    font-weight: var(--font-weight-medium);
    color: var(--color-brand);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    margin: 0 0 var(--space-lg);
  }
  .hero-headline {
    margin: 0;
    font-family: var(--font-sans);
    font-size: clamp(3.5rem, 8vw, var(--font-size-display-xl));
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
    line-height: var(--line-height-tight);
    color: var(--color-text-primary);
  }
  .hero-headline-accent {
    color: var(--color-brand);
  }
  .hero-subhead {
    margin: var(--space-lg) 0 0;
    font-family: var(--font-sans);
    font-size: var(--font-size-body-lg);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
    max-width: 520px;
  }
  .hero-cta {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-xl);
  }
  .hero-code-wrapper {
    width: 480px;
    flex-shrink: 0;
  }
  .hero-code-sample {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--font-size-mono);
    line-height: 1.6;
    color: var(--color-text-secondary);
    white-space: pre;
  }
  @media (max-width: 1024px) {
    .hero-inner { grid-template-columns: 1fr; }
    .hero-code-wrapper { display: none; }
    .hero-section { padding-top: 96px; padding-bottom: var(--space-xxl); }
  }
  @media (max-width: 640px) {
    .hero-section { padding-left: var(--space-md); padding-right: var(--space-md); padding-top: 80px; }
    .hero-headline { font-size: 2.4rem; }
    .hero-cta { flex-direction: column; }
  }
`);

const code = `import { OpenElement } from '@openelement/element';

export class App extends OpenElement {
  override render() {
    return (
      <div className="app">
        <h1>Hello, openElement</h1>
      </div>
    );
  }
}`;

export function renderHero() {
  return (
    <section class="hero-section">
      <div class="hero-inner">
        <div>
          <p class="hero-eyebrow">openElement 0.40.7 / v0.40.7 active</p>
          <h1 class="hero-headline">
            THE OPEN<br />
            <span class="hero-headline-accent">ELEMENT.</span>
          </h1>
          <p class="hero-subhead">
            A four-product Web Components platform: Elements, UI, Framework, and
            Protocols. JSX pages, one VNode renderer pipeline, structured route
            lifecycle, explicit trusted HTML boundaries, and island JavaScript
            that upgrades only where it is needed.
          </p>
          <div class="hero-cta">
            <open-button-linear variant="primary" href="/guide/getting-started">
              Start building
            </open-button-linear>
            <open-button-linear
              variant="secondary"
              href="/architecture/architecture"
            >
              Read architecture
            </open-button-linear>
          </div>
        </div>
        <div class="hero-code-wrapper">
          <open-card-linear variant="code-panel" title="App.tsx">
            <pre class="hero-code-sample">{code}</pre>
          </open-card-linear>
        </div>
      </div>
    </section>
  );
}
