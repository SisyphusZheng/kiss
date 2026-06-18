/**
 * Homepage - Industrial Standards System.
 *
 * Strategic anchors:
 * openElement = Elements + UI + Framework + Protocols.
 * Current public package line: v0.40.7.
 * Active execution line: v0.40.7.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-lab-panel';
import '@openelement/ui/open-standards-visual';
import '../../islands/home-console.js';

export const tagName = 'docs-home';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .home {
    display: grid;
    background: var(--bg-base);
  }

  .hero {
    position: relative;
    min-height: clamp(560px, calc(100svh - var(--nav-height) - 220px), 720px);
    overflow: hidden;
    background-image:
      linear-gradient(var(--brand), var(--brand)),
      linear-gradient(var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, var(--border) var(--border-size-1), transparent var(--border-size-1));
    background-size: auto, 258px 120px, 258px 120px;
    color: var(--on-brand);
  }

  :host([data-theme="dark"]) .hero,
  :host-context([data-theme="dark"]) .hero {
    background-image:
      linear-gradient(var(--bg-code), var(--bg-code)),
      linear-gradient(var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, var(--border) var(--border-size-1), transparent var(--border-size-1));
    color: var(--code-text);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, .72fr) minmax(420px, 1fr);
    min-height: inherit;
  }

  .hero-copy,
  .hero-art {
    min-width: 0;
    border-inline-end: var(--border-size-1) solid color-mix(in srgb, var(--on-brand) 28%, transparent);
  }

  :host([data-theme="dark"]) .hero-copy,
  :host([data-theme="dark"]) .hero-art,
  :host-context([data-theme="dark"]) .hero-copy,
  :host-context([data-theme="dark"]) .hero-art {
    border-inline-end-color: var(--border);
  }

  .hero-copy {
    display: grid;
    align-content: space-between;
    gap: var(--size-8);
    padding: var(--size-6) var(--size-5) var(--size-8);
  }

  .hero-art {
    position: relative;
    display: grid;
    align-items: center;
    justify-items: end;
    padding: var(--size-10) var(--size-12);
  }

  .hero-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-block: var(--border-size-1) solid color-mix(in srgb, var(--on-brand) 24%, transparent);
  }

  .hero-meta span {
    padding: var(--size-5);
    border-inline-end: var(--border-size-1) solid color-mix(in srgb, var(--on-brand) 24%, transparent);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .hero-title {
    max-width: 780px;
  }

  h1 {
    margin: 0;
    font-size: clamp(var(--font-size-6), 8vw, 7.25rem);
    line-height: .88;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .lede {
    max-width: 720px;
    margin-block: var(--size-8) 0;
    font-size: var(--font-size-3);
    line-height: 1.12;
    font-weight: var(--font-weight-5);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin-block-start: var(--size-8);
  }

  .hero .actions open-button[variant="primary"],
  .cta open-button[variant="primary"] {
    --brand: var(--text-primary);
    --brand-hover: var(--text-primary);
    --on-brand: var(--bg-base);
  }

  .aperture {
    position: relative;
    width: min(34vw, 430px);
    aspect-ratio: 1;
    border: clamp(var(--size-6), 3.4vw, var(--size-12)) solid currentColor;
    border-radius: var(--radius-round);
  }

  .aperture::before {
    content: "";
    position: absolute;
    inset-inline-end: calc(var(--size-5) * -1);
    inset-block-start: calc(var(--size-5) * -1);
    width: clamp(var(--size-12), 7vw, 104px);
    height: clamp(var(--size-12), 7vw, 104px);
    border-block-start: clamp(var(--size-5), 2vw, var(--size-8)) solid var(--brand);
    border-inline-end: clamp(var(--size-5), 2vw, var(--size-8)) solid var(--brand);
  }

  .aperture::after {
    content: "";
    position: absolute;
    inset-inline: 28%;
    inset-block: 42%;
    border-block: clamp(var(--size-2), .9vw, var(--size-4)) solid var(--brand);
  }

  .hero-art-label {
    position: absolute;
    inset-inline-start: var(--size-5);
    inset-block-start: var(--size-5);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .workbench {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, .46fr);
    min-height: 220px;
    background: var(--bg-code);
    color: var(--code-text);
    border-block: var(--border-size-1) solid var(--code-border);
  }

  .terminal {
    display: grid;
    gap: var(--size-4);
    padding: var(--size-6);
    background: var(--bg-card);
    color: var(--text-primary);
    border-inline-end: var(--border-size-1) solid var(--code-border);
  }

  .terminal strong,
  .section-kicker,
  .card-index,
  .matrix-key {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .terminal pre {
    margin: 0;
    overflow: hidden;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
    white-space: pre-wrap;
  }

  .console-wrap {
    display: grid;
    align-content: center;
    padding: var(--size-6);
    border-inline-start: var(--border-size-1) solid var(--code-border);
  }

  .product-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    background: var(--bg-base);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .strip-item {
    display: grid;
    gap: var(--size-3);
    min-height: 138px;
    padding: var(--size-6);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .strip-item:last-child {
    border-inline-end: 0;
  }

  .strip-item h2,
  .section-title,
  .path-card h3,
  .workflow h3 {
    margin: 0;
    color: var(--text-primary);
    letter-spacing: 0;
  }

  .strip-item h2 {
    font-size: var(--font-size-3);
    line-height: 1.08;
  }

  .section {
    display: grid;
    grid-template-columns: minmax(280px, .42fr) minmax(0, 1fr);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section-head,
  .section-body {
    padding: var(--size-8) var(--size-5);
  }

  .section-head {
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .section-title {
    margin-block-start: var(--size-4);
    max-width: 620px;
    font-size: var(--font-size-6);
    line-height: .96;
    font-weight: var(--font-weight-9);
  }

  .section-copy,
  .path-card p,
  .workflow p,
  .matrix-value {
    color: var(--text-secondary);
    font-size: var(--font-size-1);
    line-height: 1.35;
  }

  .matrix {
    display: grid;
    border-block-start: var(--border-size-1) solid var(--border);
  }

  .matrix-row {
    display: grid;
    grid-template-columns: minmax(160px, .28fr) minmax(0, 1fr);
    gap: var(--size-5);
    padding-block: var(--size-5);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .paths,
  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-block-start: var(--border-size-1) solid var(--border);
    border-inline-start: var(--border-size-1) solid var(--border);
  }

  .path-link {
    color: inherit;
    text-decoration: none;
  }

  .path-card,
  .workflow {
    min-height: 260px;
    border-block-end: 0;
    border-inline-start: 0;
  }

  .path-card h3,
  .workflow h3 {
    margin-block: var(--size-5) var(--size-3);
    font-size: var(--font-size-3);
    line-height: 1.05;
  }

  .visual {
    display: grid;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1fr);
    gap: var(--size-5);
  }

  .cta {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--size-5);
    align-items: center;
    padding: var(--size-8) var(--size-5);
    background: var(--brand);
    color: var(--on-brand);
  }

  .cta h2 {
    margin-block: var(--size-3) 0;
    font-size: var(--font-size-5);
    line-height: .98;
  }

  .cta p {
    max-width: 680px;
    margin-block-end: 0;
    font-size: var(--font-size-1);
    line-height: 1.35;
  }

  @media (max-width: 980px) {
    .hero-grid,
    .workbench,
    .section,
    .visual,
    .cta {
      grid-template-columns: 1fr;
    }

    .hero-copy,
    .hero-art,
    .section-head,
    .terminal,
    .console-wrap {
      border-inline-end: 0;
    }

    .product-strip,
    .paths,
    .workflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .aperture {
      width: min(70vw, 360px);
    }
  }

  @media (max-width: 620px) {
    .hero-grid {
      min-height: auto;
    }

    .hero-copy,
    .section-head,
    .section-body,
    .terminal,
    .console-wrap,
    .cta {
      padding: var(--size-5) var(--size-4);
    }

    h1 {
      font-size: var(--font-size-5);
      line-height: .94;
    }

    .lede {
      font-size: var(--font-size-1);
      line-height: 1.24;
    }

    .hero-art {
      min-height: 300px;
      padding: var(--size-6) var(--size-4);
    }

    .product-strip,
    .paths,
    .workflow-grid,
    .matrix-row {
      grid-template-columns: 1fr;
    }

    .secondary-action {
      display: none !important;
    }
  }
`);

const productLines = [
  ['01 Elements', 'Native component surface'],
  ['02 UI', 'Open Props primitives'],
  ['03 Framework', 'DSD routes and islands'],
  ['04 Protocols', 'Contracts and CI truth'],
];

const workflow = [
  ['Author', 'Write pages, layouts, components, and content in one app tree.'],
  ['Render', 'Generate static HTML with Declarative Shadow DOM boundaries.'],
  ['Hydrate', 'Attach islands only where behavior is required.'],
  ['Serve', 'Use the same project for documents, API routes, and assets.'],
];

const entries = [
  ['Guide', 'Build an app', 'Start with routes, layouts, content, islands, and deployment.', '/guide/getting-started'],
  ['API', 'Read contracts', 'Inspect public package exports and framework helpers.', '/apilist'],
  ['Architecture', 'Follow boundaries', 'Understand DSD, islands, adapters, and package responsibilities.', '/architecture/architecture'],
  ['Roadmap', 'Check truth', 'See shipped, current, planned, and out-of-scope language.', '/roadmap'],
];

export class DocsHome extends OpenElement {
  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    return (
      <main class='home'>
        <section class='hero swiss-grid'>
          <div class='hero-grid'>
            <div class='hero-copy'>
              <div class='hero-meta' aria-label='Product status'>
                <span>System</span>
                <span>v0.40.7</span>
              </div>
              <div class='hero-title'>
                <h1>Web Standards Productized.</h1>
                <p class='lede'>
                  Elements, UI, Framework, and Protocols as one inspectable
                  application system.
                </p>
                <div class='actions'>
                  <open-button variant='primary' size='lg' href='/guide/getting-started'>Start building</open-button>
                  <open-button class='secondary-action' size='lg' href='/architecture/architecture'>Architecture</open-button>
                </div>
              </div>
            </div>
            <div class='hero-art' aria-hidden='true'>
              <span class='hero-art-label'>open mode</span>
              <div class='aperture'></div>
            </div>
          </div>
        </section>

        <section class='workbench'>
          <div class='terminal'>
            <strong>DSD workbench</strong>
            <pre>{`customElements.define('docs-home', OpenElement)
<template shadowrootmode="open">
route graph / island hydration / package truth`}</pre>
          </div>
          <div class='console-wrap'>
            <home-console></home-console>
          </div>
        </section>

        <section class='product-strip' aria-label='Product lines'>
          {productLines.map(([index, title]) => (
            <div class='strip-item'>
              <span class='card-index'>{index}</span>
              <h2>{title}</h2>
            </div>
          ))}
        </section>

        <section class='section'>
          <div class='section-head'>
            <p class='section-kicker'>Product matrix</p>
            <h2 class='section-title'>One standard surface across app, UI, docs, and package contracts.</h2>
          </div>
          <div class='section-body'>
            <p class='section-copy'>
              The site now behaves like a technical sheet: fewer decorative cards,
              stronger grid structure, and every visual block tied to something
              users can inspect in the framework.
            </p>
            <div class='matrix'>
              <div class='matrix-row'>
                <span class='matrix-key'>Browser native</span>
                <span class='matrix-value'>Custom elements and DSD define the rendering boundary instead of hiding it.</span>
              </div>
              <div class='matrix-row'>
                <span class='matrix-key'>Docs as product</span>
                <span class='matrix-value'>The framework is explained through routes, contracts, packages, and release truth.</span>
              </div>
              <div class='matrix-row'>
                <span class='matrix-key'>UI package first</span>
                <span class='matrix-value'>The site consumes the same Open Props primitives it expects consumers to use.</span>
              </div>
            </div>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <p class='section-kicker'>Application flow</p>
            <h2 class='section-title'>Author a route. Ship platform HTML. Hydrate exactly what moves.</h2>
          </div>
          <div class='section-body'>
            <div class='workflow-grid'>
              {workflow.map(([title, copy], index) => (
                <open-card class='workflow' variant={index === 1 ? 'muted' : undefined}>
                  <span class='card-index'>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </open-card>
              ))}
            </div>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <p class='section-kicker'>System visual</p>
            <h2 class='section-title'>The package graph is part of the product experience.</h2>
          </div>
          <div class='section-body visual'>
            <open-lab-panel variant='surface' label='package graph' meta='public product line'>
              <open-standards-visual variant='packages' emphasis='high' motion='auto'></open-standards-visual>
            </open-lab-panel>
            <open-lab-panel variant='muted' label='decision sheet' meta='why it matters'>
              <div class='matrix'>
                <div class='matrix-row'>
                  <span class='matrix-key'>Elements</span>
                  <span class='matrix-value'>Public surface for Custom Elements and runtime behavior.</span>
                </div>
                <div class='matrix-row'>
                  <span class='matrix-key'>Framework</span>
                  <span class='matrix-value'>Routes, layouts, content, islands, i18n, and deployment.</span>
                </div>
                <div class='matrix-row'>
                  <span class='matrix-key'>Protocols</span>
                  <span class='matrix-value'>Package contracts and compatibility language for consumers.</span>
                </div>
              </div>
            </open-lab-panel>
          </div>
        </section>

        <section class='section'>
          <div class='section-head'>
            <p class='section-kicker'>Entry paths</p>
            <h2 class='section-title'>Move from product promise to implementation evidence.</h2>
          </div>
          <div class='section-body'>
            <div class='paths'>
              {entries.map(([label, title, copy, href]) => (
                <a class='path-link' href={href}>
                  <open-card class='path-card'>
                    <span class='card-index'>{label}</span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </open-card>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section class='cta'>
          <div>
            <open-badge tone='success'>standards-first</open-badge>
            <h2>Start with the guide, then inspect the contracts.</h2>
            <p>
              The fastest path is a small app: one route, one layout, one island,
              and one API endpoint.
            </p>
          </div>
          <open-button variant='primary' size='lg' href='/guide/getting-started'>Open the guide</open-button>
        </section>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, DocsHome);
}

export default DocsHome;
