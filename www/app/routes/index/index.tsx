/**
 * Homepage - openElement v0.40.2.
 * Strategic anchor: openElement = Elements + UI + Framework + Protocols.
 * Active execution: v0.40.2.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import { consumeContext } from '@openelement/core/signal-context';
import { THEME_CTX } from '@openelement/ui/open-layout';
import '../../islands/open-search.tsx';
import '../../islands/home-console.tsx';

export const tagName = 'docs-home';

const heroSheet = new StyleSheet();
heroSheet.replaceSync(`
  :host { display: block; }
  .swiss-grid { min-height: 100vh; background: linear-gradient(180deg, var(--bg-obsidian, var(--bg-base)) 0%, var(--bg-surface) 100%); color: var(--text-primary); }
  .hero { position: relative; z-index: 1; }
  .hero-inner { max-width: 1200px; margin: 0 auto; padding: var(--size-8) var(--size-10) 0; display: grid; grid-template-columns: 1fr 480px; gap: var(--size-10); align-items: start; }
  .hero-left { padding-top: var(--size-10); }
  .eyebrow { font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-7); color: var(--teal-6); letter-spacing: var(--font-letterspacing-5); text-transform: uppercase; margin-bottom: var(--size-6); }
  .giant-headline { margin: 0; font-family: var(--font-sans); font-weight: var(--font-weight-9); font-size: clamp(3.5rem, 8vw, 5.5rem); line-height: var(--font-lineheight-1); letter-spacing: 0; color: var(--text-primary); }
  .glow-line { background: linear-gradient(135deg, var(--indigo-5), var(--indigo-4)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-desc { margin-top: var(--size-7); max-width: 560px; font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-secondary); }
  .terminal { margin-top: var(--size-7); border: var(--border-size-1) solid var(--border); border-radius: var(--radius-2); background: var(--bg-terminal, var(--bg-surface)); overflow: hidden; max-width: 560px; }
  .terminal-head { display: flex; align-items: center; gap: var(--size-2); padding: var(--size-3) var(--size-4); background: var(--bg-surface); border-bottom: var(--border-size-1) solid var(--border); font-family: var(--font-mono); font-size: var(--font-size-00); color: var(--text-muted); }
  .term-dot { width: var(--size-2); height: var(--size-2); border-radius: var(--radius-round); }
  .term-dot.r { background: var(--red-5); } .term-dot.y { background: var(--yellow-5); } .term-dot.g { background: var(--green-5); }
  .terminal-body { padding: var(--size-4); font-family: var(--font-mono); font-size: var(--font-size-0); line-height: var(--font-lineheight-4); color: var(--text-secondary); }
  .term-line { display: flex; white-space: pre; }
  .term-prefix { color: var(--indigo-5); } .term-cmd { color: var(--text-primary); } .term-info { color: var(--text-muted); } .term-ok { color: var(--teal-6); } .term-gate { color: var(--cyan-6); }
  .features { max-width: 1200px; margin: 0 auto; padding: var(--size-10) var(--size-10) var(--size-10); position: relative; z-index: 1; }
  .features-head { margin-bottom: var(--size-8); }
  .features-head p { font-size: var(--font-size-00); font-weight: var(--font-weight-8); color: var(--indigo-5); text-transform: uppercase; letter-spacing: var(--font-letterspacing-5); margin: 0 0 var(--size-2); }
  .features-head h2 { margin: 0; font-size: var(--font-size-6); font-weight: var(--font-weight-9); letter-spacing: 0; color: var(--text-primary); max-width: 680px; line-height: var(--font-lineheight-1); }
  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: var(--border-size-1) solid var(--border); border-radius: var(--radius-3); overflow: hidden; }
  .ft-card { padding: var(--size-7); background: var(--bg-surface); transition: background 0.3s ease; }
  .ft-card:hover { background: color-mix(in srgb, var(--indigo-5) 15%, transparent); }
  .ft-icon { font-size: var(--font-size-4); margin-bottom: var(--size-3); display: block; }
  .ft-card h3 { margin: 0 0 var(--size-2); font-size: var(--font-size-1); font-weight: var(--font-weight-8); color: var(--text-primary); }
  .ft-card p { margin: 0; font-size: var(--font-size-0); line-height: var(--font-lineheight-3); color: var(--text-secondary); }
  .cta-bar { display: flex; gap: var(--size-3); margin-top: var(--size-8); }
  @media (max-width: 1024px) { .hero-inner { grid-template-columns: 1fr; padding: var(--size-6) var(--size-6) 0; gap: var(--size-8); } .feature-grid { grid-template-columns: 1fr 1fr; } .features { padding: var(--size-8) var(--size-6); } }
  @media (max-width: 640px) { .hero-inner { padding: var(--size-4) var(--size-4) 0; } .hero-left { padding-top: var(--size-4); } .features { padding: var(--size-6) var(--size-4); } .feature-grid { grid-template-columns: 1fr; } .giant-headline { font-size: 2.4rem; } .cta-bar { flex-direction: column; } }
`);

export class DocsHome extends OpenElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet, heroSheet];

  override connectedCallback() {
    super.connectedCallback();
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));
  }

  override render() {
    return (
      <div class='swiss-grid'>
        <section class='hero'>
          <div class='hero-inner'>
            <div class='hero-left'>
              <p class='eyebrow'>openElement 0.40.2 / v0.40.2 active</p>
              <h1 class='giant-headline'>
                THE OPEN<br />
                <span class='glow-line'>ELEMENT.</span>
              </h1>
              <p class='hero-desc'>
                A four-product Web Components platform: Elements, UI, Framework, and Protocols. JSX
                pages, one VNode renderer pipeline, structured route lifecycle, explicit trusted
                HTML boundaries, and island JavaScript that upgrades only where it is needed.
              </p>
              <div class='terminal'>
                <div class='terminal-head'>
                  <span class='term-dot r'></span>
                  <span class='term-dot y'></span>
                  <span class='term-dot g'></span>openelement build
                </div>
                <div class='terminal-body'>
                  <div class='term-line'>
                    <span class='term-prefix'>$</span>
                    <span class='term-cmd'>deno task build</span>
                  </div>
                  <div class='term-line'>
                    <span class='term-info'>[scan]</span>
                    <span>routes, islands, app shell, package manifests</span>
                  </div>
                  <div class='term-line'>
                    <span class='term-ok'>[lifecycle]</span>
                    <span>params, load, route meta, redirect, not-found</span>
                  </div>
                  <div class='term-line'>
                    <span class='term-ok'>[render]</span>
                    <span>VNode to DSD, VNode to DOM, one event model</span>
                  </div>
                  <div class='term-line'>
                    <span class='term-gate'>[gate]</span>
                    <span>graph, architecture, DSD report, publish dry-run</span>
                  </div>
                </div>
              </div>
              <div class='cta-bar'>
                <a href='/guide/getting-started' class='btn btn-primary'>Start building</a>
                <a href='/architecture/architecture' class='btn btn-outline'>Read architecture</a>
              </div>
            </div>
            <home-console></home-console>
          </div>
        </section>

        <section class='features'>
          <div class='features-head'>
            <p>Why openElement</p>
            <h2>Static-first Web Components without duplicate render paths.</h2>
          </div>
          <div class='feature-grid'>
            <div class='ft-card'>
              <span class='ft-icon'>EL</span>
              <h3>Elements-first</h3>
              <p>
                OpenElement is the future Elements surface; shadow/DSD remains the default render
                mode.
              </p>
            </div>
            <div class='ft-card'>
              <span class='ft-icon'>IR</span>
              <h3>One renderer model</h3>
              <p>
                JSX becomes VNode IR. SSR, CSR, signals, and events share the same structural model.
              </p>
            </div>
            <div class='ft-card'>
              <span class='ft-icon'>LIFE</span>
              <h3>App lifecycle</h3>
              <p>
                Route params, load context, route metadata, redirect, not-found, and error fallback
                are explicit app contracts.
              </p>
            </div>
            <div class='ft-card'>
              <span class='ft-icon'>SEC</span>
              <h3>Trusted boundary</h3>
              <p>
                HTML injection is explicit and reserved for pre-sanitized non-interactive content.
              </p>
            </div>
            <div class='ft-card'>
              <span class='ft-icon'>CI</span>
              <h3>Gate-proven</h3>
              <p>
                AutoFlow3, package graph validation, workflow slimming, and Nitro proofs guard the
                14-package line.
              </p>
            </div>
            <div class='ft-card'>
              <span class='ft-icon'>WC</span>
              <h3>Web standards</h3>
              <p>
                Custom Elements, Shadow DOM, CSSStyleSheet, URL, fetch, and Web Streams stay at the
                center.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

customElements.define(tagName, DocsHome);
export default DocsHome;
