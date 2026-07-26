/**
 * @openelement/docs - Comparison: openElement vs Alternatives
 *
 * Honest, benchmark-free comparison of openElement against the frameworks
 * teams commonly evaluate. Each card covers architecture, rendering model,
 * developer experience, and lock-in. No invented performance numbers.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-artifact-panel.tsx';

export const tagName = 'comparison-page';
export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    open-card {
      min-height: 100%;
    }

    open-card[variant='artifact'] {
      border-color: var(--brand);
    }

    .label {
      color: var(--brand);
      font-family: var(--font-mono);
      font-size: var(--font-size-0);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    h3 {
      margin: var(--size-2) 0 var(--size-3);
      font-size: var(--font-size-3);
    }

    p,
    li {
      color: var(--text-secondary);
      line-height: var(--font-lineheight-4);
    }

    .dim {
      margin: var(--size-1) 0;
      font-size: var(--font-size-1);
    }

    .dim .k {
      display: inline-block;
      min-width: 5.5em;
      color: var(--text-primary);
      font-weight: 600;
    }

    ul {
      padding-left: var(--size-4);
    }

    @media (max-width: 860px) {
      .comparison-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export default class ComparisonPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items='[{"id":"how-to-read","label":"How to read this"},{"id":"decision-criteria","label":"Decision criteria"},{"id":"sources","label":"Sources and review scope"}]'
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            openElement<span class='title-accent'>vs Alternatives</span>
          </h1>
          <p class='subtitle'>
            A conservative comparison of product direction. This page describes what each framework
            optimizes for; it does not invent benchmark claims. Use it to understand fit, not to
            rank speed.
          </p>

          <open-artifact-panel>
            <span slot='label'>framework decision surface</span>
            <span slot='meta'>reviewed 2026-07-11</span>
            <div class='comparison-grid'>
              <open-card variant='artifact'>
                <span class='label'>openElement</span>
                <h3>WC-native application framework</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  Custom Elements + Declarative Shadow DOM are first-class; standard Custom Elements
                  remain the application contract; App owns routes and rendering; Vite and Nitro are
                  the official build path.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSG by default, DSD/shadow default, selective element upgrades, and static output
                  with no framework JavaScript when interaction is unnecessary.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span>{' '}
                  JSX + Basic Element, defineElement / definePage / defineApp / buildApp.
                </p>
                <p class='dim'>
                  <span class='k'>Fit</span>{' '}
                  Choose it when Custom Elements must span component libraries and application
                  runtime; current scope is static-first, not general fullstack parity.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Next.js</span>
                <h3>React meta-framework</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  File-based routing, React Server Components, app router, server actions.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSR / SSG / ISR, RSC streaming, client components hydrated on the client.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> React/JSX, large ecosystem, first-class on Vercel.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  React runtime plus Next.js abstractions; platform affinity with Vercel.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Nuxt</span>
                <h3>Vue meta-framework</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  File routing, Vue Single-File Components, Nitro server engine.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSR / SSG / ISR, hybrid rendering, client hydration.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> Vue SFCs, auto-imports, convention-driven.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span> Vue runtime plus Nuxt and Nitro conventions.
                </p>
              </open-card>

              <open-card>
                <span class='label'>SvelteKit</span>
                <h3>Svelte meta-framework</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  File routing, Svelte components, Vite, adapter-based deployment.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSR / SSG / CSR, progressive hydration, no virtual DOM.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> Svelte compiler, concise syntax, small runtime.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Svelte compiler/runtime; deploy adapters are swappable (lower lock-in than
                  Next.js).
                </p>
              </open-card>

              <open-card>
                <span class='label'>Astro</span>
                <h3>Islands / content engine</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  File routing, multi-framework islands, content collections.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  Static-first, island hydration, server islands, View Transitions.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span>{' '}
                  .astro components, framework-agnostic islands, Markdown/MDX.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Low — islands can be any framework; some Astro-specific component syntax.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Fresh</span>
                <h3>Deno + Preact</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  File routing, Preact islands, Deno-native, zero build step.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSR with Preact islands; minimal client JavaScript by default.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> Preact/TypeScript, Deno runtime, no bundler config.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Deno runtime plus Preact; islands are Preact components.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Lit</span>
                <h3>Web Components base</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  Base class for Custom Elements with reactive properties; application routing is
                  deliberately outside its component model.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  Lit provides SSR tooling with server-specific authoring constraints.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> TypeScript, decorators, tagged-template rendering.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Low — pure standards Web Components; no framework of its own.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Enhance</span>
                <h3>HTML-first Web Components fullstack</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  Custom Elements, file-based routes and server-side Custom Elements.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  SSR to Web Components, zero-JS by default, progressive enhancement.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> HTML-first, single-file components, minimal abstraction.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Low — standards Web Components; Enhance adds helpers, not a runtime.
                </p>
              </open-card>

              <open-card>
                <span class='label'>Stencil</span>
                <h3>Web Components compiler</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  Compiler that outputs standards Web Components; framework-agnostic output.
                </p>
                <p class='dim'>
                  <span class='k'>Rendering</span>{' '}
                  Client Web Components with prerendering, lazy loading, internal virtual DOM.
                </p>
                <p class='dim'>
                  <span class='k'>DX</span> TSX, decorators, design-system oriented tooling.
                </p>
                <p class='dim'>
                  <span class='k'>Lock-in</span>{' '}
                  Output is lock-in-free Web Components; authoring uses the Stencil toolchain.
                </p>
              </open-card>

              <open-card>
                <span class='label'>FAST / Web Awesome</span>
                <h3>Component systems</h3>
                <p class='dim'>
                  <span class='k'>Architecture</span>{' '}
                  FAST provides Web Component authoring foundations; Web Awesome distributes a
                  component library and design assets.
                </p>
                <p class='dim'>
                  <span class='k'>Fit</span>{' '}
                  Choose either when your primary need is a component system. OpenElement does not
                  replace an established design system and should be evaluated as an app framework
                  around components.
                </p>
              </open-card>
            </div>
          </open-artifact-panel>

          <h2 id='how-to-read'>How to read this</h2>
          <ul>
            <li>
              <strong>Architecture</strong> — how routing, components, and the server are composed.
            </li>
            <li>
              <strong>Rendering</strong> — SSR/SSG/CSR defaults, hydration, and island strategy.
            </li>
            <li>
              <strong>DX</strong> — language, tooling, and learning curve.
            </li>
            <li>
              <strong>Lock-in</strong>{' '}
              — how tied you are to a proprietary runtime or platform versus open standards.
            </li>
          </ul>

          <h2 id='decision-criteria'>Decision criteria</h2>
          <ul>
            <li>
              Choose <strong>openElement</strong>{' '}
              when Web Components are the public integration surface and SSR output should preserve
              browser-native component boundaries.
            </li>
            <li>
              Choose <strong>Astro / Enhance / Lit / Stencil</strong>{' '}
              when a standards-first Web Components story matters and you want to avoid a heavy
              application runtime.
            </li>
            <li>
              Choose <strong>Next.js / Nuxt / SvelteKit</strong>{' '}
              when your product is intentionally built around a React, Vue, or Svelte application
              model.
            </li>
            <li>
              Choose <strong>Fresh</strong>{' '}
              when you want a Deno-native, near-zero-build Preact island experience.
            </li>
            <li>
              Do not choose <strong>openElement</strong>{' '}
              when a mature ecosystem, a framework-specific UI runtime, or a ready-made enterprise
              design system is the main requirement. Alpha releases also require teams to validate
              the documented starter and deployment path themselves.
            </li>
          </ul>

          <h2 id='sources'>Sources and review scope</h2>
          <p>
            Reviewed 2026-07-11 against primary project documentation. This is a decision guide, not
            a benchmark or compatibility certification.
          </p>
          <ul>
            <li>
              <a href='https://lit.dev/docs/'>Lit documentation</a>
            </li>
            <li>
              <a href='https://stenciljs.com/docs/introduction'>Stencil documentation</a>
            </li>
            <li>
              <a href='https://www.fast.design/docs/fast-element/getting-started'>
                FAST documentation
              </a>
            </li>
            <li>
              <a href='https://enhance.dev/docs/'>Enhance documentation</a>
            </li>
            <li>
              <a href='https://docs.astro.build/en/concepts/islands/'>
                Astro islands documentation
              </a>
            </li>
            <li>
              <a href='https://docs.deno.com/runtime/frameworks/fresh/'>Fresh documentation</a>
            </li>
            <li>
              <a href='https://webawesome.com/docs/'>Web Awesome documentation</a>
            </li>
          </ul>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define(tagName, ComparisonPage);
