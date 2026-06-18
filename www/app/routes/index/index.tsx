/**
 * Homepage - Monet Protocol Lab.
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
    display: grid;
    min-height: calc(100svh - var(--nav-height));
    overflow: hidden;
    isolation: isolate;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(116deg, var(--violet-2), transparent 52%),
      linear-gradient(180deg, var(--bg-base), var(--bg-base));
  }

  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(color-mix(in srgb, var(--brand) 18%, transparent) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, color-mix(in srgb, var(--brand) 14%, transparent) var(--border-size-1), transparent var(--border-size-1));
    background-size: 220px 128px;
    mask-image: linear-gradient(90deg, transparent, black 12%, black 92%, transparent);
  }

  .hero::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    height: 42%;
    z-index: -1;
    background:
      repeating-linear-gradient(
        176deg,
        color-mix(in srgb, var(--brand-light) 22%, transparent) 0 1px,
        transparent 1px 18px
      );
    opacity: .62;
  }

  .hero-stage {
    position: relative;
    display: grid;
    align-content: center;
    width: 100%;
    min-height: inherit;
    padding: var(--size-16) var(--size-8) var(--size-12);
  }

  .hero-copy {
    position: relative;
    z-index: 1;
    display: grid;
    gap: var(--size-8);
    max-width: 880px;
  }

  .hero-meta,
  .section-kicker,
  .card-index,
  .matrix-key,
  .artifact-tag {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
  }

  .hero-meta span {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 var(--size-3);
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand) 24%, var(--border));
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 70%, transparent);
  }

  h1 {
    max-width: 860px;
    margin: 0;
    font-size: var(--font-size-8);
    line-height: .88;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .lede {
    max-width: 720px;
    margin-block: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-3);
    line-height: 1.18;
    font-weight: var(--font-weight-5);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
  }

  .hero-art {
    position: absolute;
    z-index: 0;
    inset-inline-end: var(--size-8);
    inset-block: 50% auto;
    width: min(620px, 44vw);
    aspect-ratio: 1;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .monet-lens {
    position: absolute;
    inset: 0;
    border: var(--size-8) solid transparent;
    border-radius: var(--radius-round);
    background:
      linear-gradient(var(--bg-base), var(--bg-base)) padding-box,
      conic-gradient(from 212deg, var(--brand-deep), var(--brand), var(--brand-light), var(--brand-deep)) border-box;
    box-shadow:
      inset 0 0 0 var(--border-size-1) color-mix(in srgb, var(--brand-light) 42%, transparent),
      0 var(--size-12) var(--size-16) var(--brand-glow);
    opacity: .94;
  }

  .monet-lens::before {
    content: "";
    position: absolute;
    inset: 18%;
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand-light) 52%, var(--bg-base));
    border-radius: var(--radius-round);
    transform: rotate(-16deg);
  }

  .monet-lens::after {
    content: "";
    position: absolute;
    inset-inline: 19%;
    inset-block: 47%;
    height: var(--size-12);
    border-block: var(--border-size-2) solid var(--brand-deep);
    opacity: .72;
  }

  .hero-art-label {
    position: absolute;
    inset-inline-end: 8%;
    inset-block-end: 16%;
    color: var(--brand-deep);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .surface-band {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, .58fr);
    gap: var(--size-5);
    padding: var(--size-5);
    border-block-end: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
  }

  .terminal {
    display: grid;
    gap: var(--size-4);
    min-height: 240px;
    padding: var(--size-6);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background-color: var(--bg-elevated);
    background-image:
      linear-gradient(135deg, color-mix(in srgb, var(--violet-1) 28%, transparent), transparent 46%);
    color: var(--text-primary);
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
    min-height: 240px;
  }

  .product-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .strip-item {
    display: grid;
    gap: var(--size-3);
    min-height: 154px;
    padding: var(--size-6);
    border-inline-end: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-card) 72%, transparent);
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
    grid-template-columns: minmax(300px, .42fr) minmax(0, 1fr);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section-head,
  .section-body {
    padding: var(--size-8);
  }

  .section-head {
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .section-title {
    margin-block-start: var(--size-4);
    max-width: 620px;
    font-size: var(--font-size-6);
    line-height: .98;
    font-weight: var(--font-weight-9);
  }

  .section-copy,
  .path-card p,
  .workflow p,
  .matrix-value {
    color: var(--text-secondary);
    font-size: var(--font-size-1);
    line-height: 1.42;
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
    gap: var(--size-4);
  }

  .path-link {
    color: inherit;
    text-decoration: none;
  }

  .path-card,
  .workflow {
    min-height: 270px;
    background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  }

  .path-card h3,
  .workflow h3 {
    margin-block: var(--size-5) var(--size-3);
    font-size: var(--font-size-3);
    line-height: 1.08;
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
    padding: var(--size-8);
    background:
      linear-gradient(135deg, var(--brand-deep), var(--brand));
    color: var(--on-brand);
  }

  .cta h2 {
    margin-block: var(--size-3) 0;
    font-size: var(--font-size-5);
    line-height: 1;
  }

  .cta p {
    max-width: 680px;
    margin-block-end: 0;
    color: color-mix(in srgb, var(--on-brand) 82%, transparent);
    font-size: var(--font-size-1);
    line-height: 1.42;
  }

  .cta open-button[variant="primary"] {
    --brand: var(--bg-base);
    --brand-hover: var(--bg-base);
    --brand-light: var(--violet-1);
    --on-brand: var(--brand-deep);
  }

  @media (max-width: 1080px) {
    .hero-art {
      opacity: .34;
      width: 520px;
    }

    .surface-band,
    .section,
    .visual,
    .cta {
      grid-template-columns: 1fr;
    }

    .section-head {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .product-strip,
    .paths,
    .workflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .hero-stage,
    .section-head,
    .section-body,
    .cta {
      padding: var(--size-5) var(--size-4);
    }

    h1 {
      font-size: var(--font-size-6);
      line-height: .94;
    }

    .lede {
      font-size: var(--font-size-1);
      line-height: 1.3;
    }

    .hero-art {
      inset-inline-end: calc(var(--size-16) * -1);
      width: 360px;
      opacity: .16;
    }

    .hero-art-label {
      display: none;
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
  ['02 UI', 'Tokenized interface system'],
  ['03 Framework', 'DSD routes and islands'],
  ['04 Protocols', 'Package and release truth'],
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
          <div class='hero-stage'>
            <div class='hero-copy'>
              <div class='hero-meta' aria-label='Product status'>
                <span>Monet Protocol Lab</span>
                <span>v0.40.7</span>
                <span>Open Web Components</span>
              </div>
              <h1>Web standards, held in an open aperture.</h1>
              <p class='lede'>
                A refined system for Elements, UI, Framework, and Protocols:
                platform-native, inspectable, and designed like a product.
              </p>
              <div class='actions'>
                <open-button variant='primary' size='lg' href='/guide/getting-started'>Start building</open-button>
                <open-button class='secondary-action' size='lg' href='/architecture/architecture'>View architecture</open-button>
              </div>
            </div>
            <div class='hero-art' aria-hidden='true'>
              <div class='monet-lens'></div>
              <span class='hero-art-label'>shadow DOM / route graph / package truth</span>
            </div>
          </div>
        </section>

        <section class='surface-band'>
          <div class='terminal'>
            <strong class='artifact-tag'>DSD workbench</strong>
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
            <h2 class='section-title'>One luminous surface across app, UI, docs, and package contracts.</h2>
          </div>
          <div class='section-body'>
            <p class='section-copy'>
              The site reads as a product artifact: fewer walls, clearer rhythm,
              and every visual block tied to something users can inspect in the framework.
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
