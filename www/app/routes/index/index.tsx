/**
 * Homepage for the current public product doctrine.
 *
 * Strategic anchors: openElement = Web Components Fullstack Framework + Basic Element.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import '../../islands/home-console.tsx';

export const tagName = 'docs-home';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * { box-sizing: border-box; }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .home {
    min-height: 100%;
    background:
      radial-gradient(circle at 72% 44%, color-mix(in srgb, var(--brand-pale) 42%, transparent), transparent 30%),
      radial-gradient(circle at 18% 32%, color-mix(in srgb, var(--bg-elevated) 82%, transparent), transparent 36%),
      var(--bg-base);
  }

  .draft-stage {
    position: relative;
    min-height: calc(100svh - var(--nav-height));
    overflow: hidden;
    isolation: isolate;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(color-mix(in srgb, var(--border) 72%, transparent) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, color-mix(in srgb, var(--border) 70%, transparent) var(--border-size-1), transparent var(--border-size-1));
    background-size: calc(var(--size-16) * 2) calc(var(--size-16) * 2);
  }

  .swiss-grid {
    background:
      linear-gradient(var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, var(--border) var(--border-size-1), transparent var(--border-size-1));
    background-size: calc(var(--size-16) * 2) calc(var(--size-16) * 2);
  }

  .draft-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(circle at 52% 50%, transparent 0 24%, color-mix(in srgb, var(--brand) 18%, transparent) 24.2% 24.35%, transparent 24.6%),
      radial-gradient(circle at 67% 50%, transparent 0 30%, color-mix(in srgb, var(--text-muted) 28%, transparent) 30.1% 30.25%, transparent 30.4%),
      linear-gradient(118deg, transparent 0 45%, color-mix(in srgb, var(--border) 60%, transparent) 45.1% 45.2%, transparent 45.3%),
      linear-gradient(62deg, transparent 0 62%, color-mix(in srgb, var(--border) 48%, transparent) 62.1% 62.2%, transparent 62.3%);
  }

  .draft-stage::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    height: calc(var(--size-16) * 1.3);
    border-block-start: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-base) 74%, transparent);
  }

  .hero-grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(360px, .44fr) minmax(460px, .56fr);
    align-items: center;
    min-height: calc(100svh - var(--nav-height) - calc(var(--size-16) * 1.3));
    padding: calc(var(--size-16) * 1.35) var(--size-10) var(--size-9);
    gap: var(--size-9);
  }

  .measure {
    position: absolute;
    inset-inline-start: var(--size-8);
    inset-block: 34% auto;
    width: var(--size-9);
    height: 168px;
    border-inline-start: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 42%, transparent);
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
  }

  .measure::before,
  .measure::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    width: var(--size-3);
    border-block-start: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 42%, transparent);
  }

  .measure::before { inset-block-start: 0; }
  .measure::after { inset-block-end: 0; }

  .measure span {
    position: absolute;
    inset-inline-start: var(--size-3);
    inset-block-start: 44%;
    display: grid;
    gap: var(--size-2);
  }

  .copy {
    position: relative;
    z-index: 2;
    display: grid;
    align-content: center;
    gap: var(--size-6);
    padding-inline-start: clamp(var(--size-8), 7vw, calc(var(--size-16) * 2));
  }

  .kicker,
  .micro,
  .panel-title,
  .module-index {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .content {
    display: grid;
    gap: var(--size-10);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding-block: var(--size-10) var(--size-12);
  }

  .section-head {
    display: grid;
    grid-template-columns: minmax(0, .48fr) minmax(0, .52fr);
    gap: var(--size-8);
    align-items: end;
  }

  .section-head h2 {
    margin: var(--size-2) 0 0;
    font-size: var(--font-size-6);
    line-height: .96;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .section-head p,
  .artifact-copy,
  .workflow-copy,
  .surface-card p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
  }

  h1 {
    max-width: 720px;
    margin: 0;
    font-size: clamp(var(--font-size-7), 7.2vw, calc(var(--font-size-8) * 1.22));
    line-height: .92;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .lede {
    max-width: 520px;
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-3);
    line-height: 1.45;
    font-weight: var(--font-weight-4);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-4);
    align-items: center;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 176px;
    min-height: 52px;
    padding-inline: var(--size-5);
    border: var(--border-size-1) solid var(--text-primary);
    border-radius: 0;
    color: var(--text-primary);
    background: transparent;
    text-decoration: none;
    font-weight: var(--font-weight-7);
    transition: transform var(--duration-2) var(--ease-2), border-color var(--duration-2) var(--ease-2);
  }

  .action.primary {
    color: var(--on-brand);
    border-color: var(--brand);
    background: var(--brand);
  }

  .action:hover {
    transform: translateY(calc(var(--border-size-1) * -2));
    border-color: var(--brand);
  }

  .console-line {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--size-3);
    max-width: 520px;
    padding: var(--size-3) var(--size-4);
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand) 36%, var(--border));
    color: var(--brand);
    background: color-mix(in srgb, var(--bg-elevated) 58%, transparent);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
  }

  .terminal {
    background: var(--bg-elevated);
  }

  .console-line small {
    grid-column: 2;
    color: var(--text-muted);
  }

  .art {
    position: relative;
    min-height: 680px;
  }

  .art-note {
    position: absolute;
    inset-block-start: 16%;
    inset-inline-start: 8%;
    display: grid;
    gap: var(--size-2);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    text-transform: uppercase;
  }

  .aperture {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    width: min(680px, 58vw);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-round);
    background:
      radial-gradient(circle at 50% 50%, var(--bg-base) 0 34%, transparent 34.4%),
      conic-gradient(
        from 222deg,
        var(--brand-deep) 0 18%,
        var(--brand) 18% 72%,
        var(--brand-light) 72% 86%,
        transparent 86% 91%,
        var(--brand-deep) 91% 100%
      );
    box-shadow:
      inset 0 0 0 var(--border-size-1) color-mix(in srgb, var(--brand-light) 34%, transparent),
      0 var(--size-8) calc(var(--size-16) * 2) color-mix(in srgb, var(--brand) 13%, transparent);
  }

  .aperture::before {
    content: "";
    position: absolute;
    inset: 13%;
    border: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 30%, transparent);
    border-radius: var(--radius-round);
  }

  .aperture::after {
    content: "";
    position: absolute;
    inset-inline-end: 8%;
    inset-block-start: 7%;
    width: 22%;
    height: 18%;
    border-radius: var(--radius-round);
    background: var(--bg-base);
    transform: rotate(-46deg);
  }

  .axis-x,
  .axis-y,
  .route-axis,
  .origin {
    position: absolute;
    z-index: 2;
    pointer-events: none;
  }

  .axis-x {
    inset-inline: 8% 4%;
    inset-block-start: 50%;
    border-block-start: var(--border-size-1) solid color-mix(in srgb, var(--brand) 54%, var(--border));
  }

  .axis-y {
    inset-block: 8% 7%;
    inset-inline-start: 50%;
    border-inline-start: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 32%, transparent);
  }

  .route-axis {
    inset-inline: 8% 4%;
    inset-block-start: 54%;
    border-block-start: var(--border-size-1) solid color-mix(in srgb, var(--brand) 54%, transparent);
  }

  .origin {
    inset-inline-start: 50%;
    inset-block-end: 8%;
    width: var(--size-2);
    height: var(--size-2);
    border-radius: var(--radius-round);
    background: var(--text-secondary);
    transform: translateX(-50%);
  }

  .dot {
    position: absolute;
    z-index: 3;
    width: var(--size-3);
    height: var(--size-3);
    border: var(--border-size-1) solid var(--brand);
    border-radius: var(--radius-round);
    background: var(--bg-base);
    transform: translate(-50%, -50%);
  }

  .dot.one { inset-inline-start: 42%; inset-block-start: 50%; }
  .dot.two { inset-inline-start: 64%; inset-block-start: 50%; }
  .dot.three { inset-inline-start: 82%; inset-block-start: 50%; }

  .panel {
    position: absolute;
    z-index: 4;
    display: grid;
    gap: var(--size-3);
    width: min(270px, 24vw);
    min-height: 132px;
    padding: var(--size-4);
    border: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 42%, var(--border));
    background: color-mix(in srgb, var(--bg-base) 76%, transparent);
    backdrop-filter: blur(14px);
  }

  .panel p {
    margin: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.9;
  }

  .panel.spec {
    inset-block-start: 13%;
    inset-inline-end: 8%;
  }

  .panel.route {
    inset-block-start: 39%;
    inset-inline-end: 4%;
  }

  .panel.layers {
    inset-block-end: 10%;
    inset-inline-end: 5%;
  }

  .route-drawing,
  .layer-drawing,
  .module-visual {
    width: 100%;
    height: auto;
    color: var(--brand);
  }

  .caption-line {
    position: absolute;
    inset-inline: 21% 14%;
    inset-block-end: var(--size-8);
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    text-transform: uppercase;
  }

  .caption-line::before {
    content: "";
    position: absolute;
    inset-inline: 90px 118px;
    inset-block-start: 50%;
    border-block-start: var(--border-size-1) solid color-mix(in srgb, var(--text-muted) 36%, transparent);
  }

  .modules {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    padding: 0;
    border: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-card) 82%, transparent);
  }

  .module {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    gap: var(--size-6);
    min-height: 190px;
    padding: var(--size-6);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .module:last-child {
    border-inline-end: 0;
  }

  .module h2 {
    margin-block: var(--size-3) var(--size-3);
    font-size: var(--font-size-4);
    line-height: 1;
  }

  .module p {
    max-width: 310px;
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .artifact-section {
    display: grid;
    grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr);
    gap: var(--size-5);
    align-items: stretch;
  }

  .artifact-panel {
    border: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(var(--border) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, var(--border) var(--border-size-1), transparent var(--border-size-1)),
      var(--bg-card);
    background-size: var(--size-12) var(--size-12);
    min-height: 440px;
    padding: var(--size-6);
  }

  .artifact-map {
    display: grid;
    align-items: center;
    height: 100%;
  }

  .artifact-map svg {
    width: 100%;
    height: auto;
    color: var(--brand);
  }

  .artifact-copy {
    display: grid;
    align-content: center;
    gap: var(--size-4);
    padding: var(--size-6);
    border: var(--border-size-1) solid var(--border);
    background: var(--bg-card);
  }

  .artifact-copy h2,
  .workflow h2,
  .surfaces h2 {
    margin: 0;
    font-size: var(--font-size-5);
    line-height: 1;
    letter-spacing: 0;
  }

  .code-spec {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--size-5);
  }

  .spec-block {
    display: grid;
    gap: var(--size-3);
    padding: var(--size-5);
    border: var(--border-size-1) solid var(--code-border);
    background: var(--bg-code);
    color: var(--code-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.7;
    overflow-x: auto;
  }

  .workflow {
    display: grid;
    gap: var(--size-5);
    padding-block: var(--size-4);
  }

  .workflow-rail {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    border: var(--border-size-1) solid var(--border);
    background: var(--bg-card);
  }

  .workflow-step {
    display: grid;
    gap: var(--size-3);
    min-height: 180px;
    padding: var(--size-4);
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .workflow-step:last-child {
    border-inline-end: 0;
  }

  .workflow-step strong {
    color: var(--text-primary);
    font-size: var(--font-size-2);
  }

  .workflow-copy {
    font-size: var(--font-size-0);
  }

  .surfaces {
    display: grid;
    gap: var(--size-5);
  }

  .surface-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .surface-card {
    display: grid;
    gap: var(--size-4);
    min-height: 240px;
    padding: var(--size-5);
    border: var(--border-size-1) solid var(--border);
    background: var(--bg-card);
    color: inherit;
    text-decoration: none;
  }

  .surface-card h3 {
    margin: 0;
    font-size: var(--font-size-3);
  }

  .verification {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: var(--size-8);
    align-items: center;
    padding: var(--size-6);
    border: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-elevated) 44%, var(--bg-base));
  }

  .verification h2 {
    margin-block: var(--size-2);
    font-size: var(--font-size-5);
    line-height: var(--font-lineheight-1);
  }

  .verification p {
    max-width: 580px;
    margin: 0;
    color: var(--text-secondary);
    line-height: var(--font-lineheight-3);
  }

  @media (max-width: 1080px) {
    .hero-grid {
      grid-template-columns: 1fr;
      padding: var(--size-10) var(--size-5) var(--size-8);
    }

    .copy {
      padding-inline-start: 0;
    }

    .measure,
    .art-note,
    .caption-line {
      display: none;
    }

    .art {
      min-height: 520px;
    }

    .aperture {
      width: min(560px, 90vw);
    }

    .panel {
      width: min(260px, 42vw);
    }

    .content {
      width: min(100% - var(--size-8), 1120px);
      padding-block: var(--size-8);
    }

    .section-head,
    .artifact-section,
    .code-spec {
      grid-template-columns: 1fr;
    }

    .modules {
      grid-template-columns: 1fr;
    }

    .verification {
      grid-template-columns: 1fr;
      padding: var(--size-6) var(--size-4);
    }

    .module {
      grid-template-columns: 120px 1fr;
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .workflow-rail,
    .surface-grid {
      grid-template-columns: 1fr;
    }

    .workflow-step {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }
  }

  @media (max-width: 640px) {
    .draft-stage {
      min-height: auto;
    }

    .hero-grid {
      grid-template-columns: minmax(0, 1fr);
      min-height: auto;
      padding: var(--size-8) var(--size-4) var(--size-6);
      gap: var(--size-5);
      overflow: hidden;
    }

    h1 {
      max-width: 100%;
      font-size: clamp(3.1rem, 14vw, var(--font-size-7));
      line-height: .96;
      overflow-wrap: anywhere;
    }

    .lede {
      max-width: 100%;
      font-size: var(--font-size-2);
      overflow-wrap: anywhere;
    }

    .action {
      min-width: 148px;
    }

    .console-line {
      font-size: var(--font-size-00);
    }

    .art {
      min-height: 420px;
    }

    .panel {
      display: none;
    }

    .module {
      grid-template-columns: 1fr;
      gap: var(--size-3);
      padding: var(--size-6) var(--size-3);
    }

    .content {
      width: min(100% - var(--size-6), 1120px);
      gap: var(--size-8);
    }
  }
`);

const modules = [
  {
    index: '01',
    title: 'Fullstack framework',
    copy:
      'Routes, layouts, islands, API paths, assets, deploy targets, and desktop targets owned by OpenElement contracts.',
    visual: 'target',
  },
  {
    index: '02',
    title: 'Basic Element',
    copy:
      'A small native Web Components authoring layer with shadow/DSD default output and explicit light DOM opt-in.',
    visual: 'graph',
  },
  {
    index: '03',
    title: 'Official stack',
    copy:
      'Protocols, UI, Vite, Hono, Nitro, Deno Desktop, Preact islands, and third-party WC compatibility support the two products.',
    visual: 'layers',
  },
] as const;

const workflowSteps = [
  ['01', 'Create', 'Scaffold the app shell and package graph from the public create surface.'],
  ['02', 'Compose', 'Author Basic Element or third-party custom elements.'],
  ['03', 'Route', 'Map pages through OpenElement-owned route graph metadata.'],
  ['04', 'Render', 'Emit platform HTML with Declarative Shadow DOM boundaries.'],
  ['05', 'Hydrate', 'Upgrade islands only where interaction is required.'],
  ['06', 'Ship', 'Publish static output, npm artifacts, and app target evidence.'],
] as const;

const surfaces = [
  ['Docs', '/docs', 'Guides, route concepts, deployment notes, and architecture entry points.'],
  ['API Reference', '/apilist', 'Package surfaces and UI primitives that are actually exported.'],
  ['Roadmap', '/roadmap', 'Alpha.6 architecture, alpha.7 desktop dogfood, beta.1 adoption freeze, and v1.0 direction.'],
] as const;

function moduleVisual(kind: 'target' | 'graph' | 'layers') {
  if (kind === 'target') {
    return (
      <svg class='module-visual' viewBox='0 0 160 140' aria-hidden='true'>
        <circle cx='80' cy='70' r='54' fill='none' stroke='currentColor' stroke-width='1' opacity='.35' />
        <circle cx='80' cy='70' r='31' fill='none' stroke='currentColor' stroke-width='1' opacity='.42' />
        <path d='M80 12v116M22 70h116' stroke='currentColor' stroke-width='1' opacity='.32' />
        <rect x='66' y='56' width='28' height='28' fill='currentColor' opacity='.72' />
        <circle cx='121' cy='59' r='4' fill='currentColor' />
      </svg>
    );
  }
  if (kind === 'graph') {
    return (
      <svg class='module-visual' viewBox='0 0 160 140' aria-hidden='true'>
        <path d='M30 92 76 52 128 30M44 31l42 62 43-42M30 92l70 12 28-74' fill='none' stroke='currentColor' stroke-width='1' opacity='.44' />
        <path d='M30 112c22-30 42-43 60-38 14 4 21 18 44-16' fill='none' stroke='currentColor' stroke-width='2' />
        <g fill='var(--bg-base)' stroke='currentColor' stroke-width='2'>
          <circle cx='30' cy='112' r='6' /><circle cx='90' cy='74' r='7' /><circle cx='134' cy='58' r='6' />
        </g>
      </svg>
    );
  }
  return (
    <svg class='module-visual' viewBox='0 0 160 140' aria-hidden='true'>
      <path d='M80 18 132 42 80 66 28 42zM80 46l52 24-52 24-52-24zM80 74l52 24-52 24-52-24z' fill='none' stroke='currentColor' stroke-width='1' />
      <path d='M80 18 132 42 80 66 28 42z' fill='currentColor' opacity='.12' />
    </svg>
  );
}

export class DocsHome extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    return (
      <main class='home'>
        <section class='draft-stage swiss-grid'>
          <div class='measure'><span>OE<br />01</span></div>
          <div class='hero-grid'>
            <div class='copy'>
              <p class='kicker'>Standards-first Web Components</p>
              <h1>Ship real web apps on native Web Components.</h1>
              <p class='lede'>
                openElement gives you full-stack routing, SSR, islands, and
                desktop targets without a virtual DOM or vendor lock-in —
                your components stay portable, inspectable, and standards-based.
              </p>
              <p class='lede'>
                Current package line: {OPENELEMENT_VERSION}. Active plan:
                v0.41.0-alpha.6 architecture hardening, v0.41.0-alpha.7
                desktop dogfood, and v0.41.0-beta.1 adoption freeze.
              </p>
              <div class='actions'>
                <a class='action primary' href='/guide/getting-started'>Get Started -&gt;</a>
                <a class='action' href='/apilist'>View API</a>
              </div>
              <div class='console-line terminal' aria-label='Install command'>
                <span>$</span>
                <span>deno run -A npm:@openelement/create my-app</span>
                <small>Scaffolding your project...</small>
              </div>
            </div>

            <div class='art' aria-hidden='true'>
              <div class='art-note'>
                <span>&lt;open/&gt;</span>
                <span>App contract<br />&amp; DSD output</span>
              </div>
              <div class='aperture'></div>
              <span class='axis-x'></span>
              <span class='axis-y'></span>
              <span class='route-axis'></span>
              <span class='origin'></span>
              <span class='dot one'></span>
              <span class='dot two'></span>
              <span class='dot three'></span>

              <div class='panel spec'>
                <span class='panel-title'>Element</span>
                <p>APP: &lt;oe-app&gt;<br />ROUTE: /about<br />ISLANDS: 3<br />TARGET: desktop</p>
              </div>
              <div class='panel route'>
                <span class='panel-title'>Route graph</span>
                <svg class='route-drawing' viewBox='0 0 220 84'>
                  <path d='M12 38c32-28 58 22 92-2 28-20 54-8 94-28' fill='none' stroke='currentColor' stroke-width='2' />
                  <path d='M12 38h54l36 28 42-26 54 24' fill='none' stroke='currentColor' stroke-width='1' opacity='.45' />
                  <g fill='var(--bg-base)' stroke='currentColor' stroke-width='2'>
                    <circle cx='12' cy='38' r='6' /><circle cx='66' cy='38' r='6' /><circle cx='102' cy='66' r='6' /><circle cx='144' cy='40' r='6' /><circle cx='198' cy='8' r='6' />
                  </g>
                </svg>
                <p>o /<br />o /about<br />o /docs<br />o /blog</p>
              </div>
              <div class='panel layers'>
                <span class='panel-title'>Package protocol layers</span>
                <svg class='layer-drawing' viewBox='0 0 220 84'>
                  <path d='M18 20h80M18 42h80M18 64h80' stroke='currentColor' stroke-width='1' opacity='.42' />
                  <ellipse cx='150' cy='20' rx='46' ry='10' fill='none' stroke='currentColor' />
                  <ellipse cx='150' cy='42' rx='46' ry='10' fill='none' stroke='currentColor' opacity='.7' />
                  <ellipse cx='150' cy='64' rx='46' ry='10' fill='none' stroke='currentColor' opacity='.45' />
                </svg>
              </div>
            </div>
          </div>
          <div class='caption-line'>
            <span>DSD boundary</span>
            <span>Route graph</span>
          </div>
        </section>

        <div class='content'>
          <section class='section-head' aria-labelledby='standards-heading'>
            <div>
              <p class='kicker'>Standards become an interface</p>
              <h2 id='standards-heading'>The app model and element model share one contract.</h2>
            </div>
            <p>
              openElement is presented as a standards-first WC fullstack
              surface: native components, generated route metadata, DSD output,
              and package boundaries stay inspectable.
            </p>
          </section>

          <section class='modules' aria-label='Product modules'>
            {modules.map((module) => (
              <article class='module'>
                {moduleVisual(module.visual)}
                <div>
                  <span class='module-index'>{module.index}</span>
                  <h2>{module.title}</h2>
                  <p>{module.copy}</p>
                </div>
              </article>
            ))}
          </section>

          <section class='artifact-section' aria-label='System model'>
            <div class='artifact-panel'>
              <div class='artifact-map'>
                <svg viewBox='0 0 720 420' aria-hidden='true'>
                  <path d='M82 88h156l84 88h156l112 118' fill='none' stroke='currentColor' stroke-width='3' />
                  <path d='M82 294h170l76-76h144l118-128' fill='none' stroke='currentColor' stroke-width='2' opacity='.48' />
                  <path d='M96 90v208M252 90v208M408 176v118M576 90v210' stroke='currentColor' stroke-width='1' opacity='.28' />
                  <g fill='var(--bg-base)' stroke='currentColor' stroke-width='3'>
                    <circle cx='82' cy='88' r='12' /><circle cx='238' cy='88' r='12' />
                    <circle cx='322' cy='176' r='12' /><circle cx='478' cy='176' r='12' />
                    <circle cx='590' cy='294' r='12' /><circle cx='82' cy='294' r='12' />
                    <circle cx='328' cy='218' r='12' /><circle cx='590' cy='90' r='12' />
                  </g>
                  <text x='82' y='44' fill='currentColor' font-size='16'>DOM TREE</text>
                  <text x='312' y='144' fill='currentColor' font-size='16'>ROUTE GRAPH</text>
                  <text x='452' y='344' fill='currentColor' font-size='16'>PACKAGE GRAPH</text>
                </svg>
              </div>
            </div>
            <div class='artifact-copy'>
              <p class='kicker'>System model</p>
              <h2>DOM tree, route graph, island hydration, package graph.</h2>
              <p>
                The page language uses real project boundaries: route metadata
                from the app, DSD as render output, hydrated islands for
                interaction, and package contracts as the reference surface.
              </p>
            </div>
          </section>

          <section class='code-spec' aria-label='Build path'>
            <pre class='spec-block'><code>deno run -A npm:@openelement/create my-app
deno task dev
deno task build</code></pre>
            <pre class='spec-block'><code>{`<open-layout>
  <docs-home></docs-home>
</open-layout>`}</code></pre>
          </section>

          <section class='workflow' aria-labelledby='workflow-heading'>
            <div class='section-head'>
              <div>
                <p class='kicker'>Developer workflow</p>
                <h2 id='workflow-heading'>Create, compose, route, render, hydrate, ship.</h2>
              </div>
              <p>
                The homepage middle section is no longer a sparse card strip.
                It explains the actual work path a developer follows through the
                framework.
              </p>
            </div>
            <div class='workflow-rail'>
              {workflowSteps.map(([index, title, copy]) => (
                <article class='workflow-step'>
                  <span class='module-index'>{index}</span>
                  <strong>{title}</strong>
                  <span class='workflow-copy'>{copy}</span>
                </article>
              ))}
            </div>
          </section>

          <section class='surfaces' aria-labelledby='surfaces-heading'>
            <div class='section-head'>
              <div>
                <p class='kicker'>Reference surfaces</p>
                <h2 id='surfaces-heading'>Follow the docs, API, and roadmap truth.</h2>
              </div>
              <p>
                The site keeps content grounded in generated routes, package
                surfaces, and current roadmap anchors instead of invented
                marketing copy.
              </p>
            </div>
            <div class='surface-grid'>
              {surfaces.map(([title, href, copy]) => (
                <a class='surface-card' href={href}>
                  <span class='module-index'>{href}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </a>
              ))}
            </div>
          </section>

          <section class='verification' aria-label='Live verification'>
            <div>
              <p class='kicker'>Island hydration smoke line</p>
              <h2>Native components stay inspectable.</h2>
              <p>
                The same composed surface hydrates as a real custom element, with
                shadow DOM boundaries and signal updates preserved after static generation.
              </p>
            </div>
            <home-console></home-console>
          </section>
        </div>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, DocsHome);
}

export default DocsHome;
