/**
 * Docs landing page - v4 manual index: serif/mono masthead and four
 * outlined-number entrance rows.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import { mastheadStyles } from '../../components/page-styles.js';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  p {
    margin: 0;
  }

  /* ── masthead: serif "Read the" + mono "MANUAL." ── */
  ${mastheadStyles}

  .masthead-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--size-4);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--violet-8);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.29em;
    text-transform: uppercase;
  }

  .eyebrow::before {
    content: "";
    width: 2rem;
    height: 2px;
    background: var(--brand);
  }

  .stamp {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin-block-start: clamp(1.5rem, 4vh, 3rem);
    line-height: 0.92;
  }

  h1 .serif-line {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(3.4rem, 9vw, 8rem);
    letter-spacing: -0.02em;
    color: var(--violet-8);
  }

  h1 .mono-line {
    display: block;
    font-family: var(--font-mono);
    font-weight: 800;
    font-size: clamp(3rem, 8vw, 7rem);
    letter-spacing: -0.05em;
    color: var(--text-primary);
  }

  .lede {
    margin-block-start: clamp(1.25rem, 3vh, 2rem);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: clamp(1rem, 1.2vw, 1.1rem);
    line-height: 1.75;
  }

  .sidenote {
    position: absolute;
    inset-inline-end: clamp(0.5rem, 1.5vw, 1.5rem);
    inset-block-start: 55%;
    writing-mode: vertical-rl;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-micro);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    user-select: none;
  }

  /* ── entrance rows: outlined numbers, hairlines, hover ── */
  .entrances {
    display: grid;
    border-block-start: 1px solid var(--border);
  }

  .entrance {
    display: grid;
    grid-template-columns: minmax(5rem, 0.16fr) minmax(0, 1fr) auto;
    gap: clamp(1rem, 4vw, 4rem);
    align-items: center;
    padding: clamp(1.25rem, 3.5vh, 2.5rem) clamp(1.5rem, 5vw, 4.5rem);
    border-block-end: 1px solid var(--border);
    color: inherit;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .entrance:hover {
    background: linear-gradient(90deg, color-mix(in srgb, var(--brand) 8%, transparent), transparent);
  }

  .entrance-index {
    font-family: var(--font-mono);
    font-size: clamp(3rem, 7vw, 6rem);
    font-weight: 800;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
    transition: -webkit-text-stroke-color 0.15s ease;
  }

  .entrance:hover .entrance-index {
    -webkit-text-stroke-color: var(--violet-8);
  }

  .entrance-title {
    display: block;
    font-family: var(--font-mono);
    font-size: clamp(1.5rem, 2.8vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--text-primary);
    transition: color 0.15s ease;
  }

  .entrance:hover .entrance-title {
    color: var(--violet-8);
  }

  .entrance-copy {
    margin-block-start: var(--size-2);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.6;
  }

  .entrance-arrow {
    font-family: var(--font-mono);
    font-size: var(--font-size-5);
    color: var(--violet-5);
    transition: transform 0.15s ease, color 0.15s ease;
  }

  .entrance:hover .entrance-arrow {
    color: var(--violet-8);
    transform: translateX(var(--size-2));
  }

  @media (max-width: 720px) {
    .sidenote {
      display: none;
    }

    .entrance {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .entrance-index {
      display: none;
    }
  }
`);

const entrances = [
  [
    '01',
    { en: 'Get started', zh: '快速开始' },
    {
      en: 'Zero to a running application in three commands.',
      zh: '三条命令，从零到可运行的应用。',
    },
    '/guide/getting-started',
  ],
  [
    '02',
    { en: 'API reference', zh: 'API 参考' },
    { en: 'The five-package surface, export by export.', zh: '五个包的接口面，逐个 export 列出。' },
    '/apilist',
  ],
  [
    '03',
    { en: 'Architecture', zh: '架构' },
    { en: 'Who owns what, and why the boundaries hold.', zh: '谁负责什么，以及边界为何成立。' },
    '/architecture/architecture',
  ],
  [
    '04',
    { en: 'Roadmap', zh: '路线图' },
    { en: 'Where the stable line goes next.', zh: 'stable 线的下一步走向。' },
    '/roadmap',
  ],
] as const;

const content = {
  en: {
    sidenote: 'Spec-042 · Docs index',
    eyebrow: 'Docs — The manual',
    serifLine: 'Read the',
    monoLine: 'MANUAL.',
    lede: 'Four entrances. Everything else is a footnote.',
    navLabel: 'Documentation entrances',
  },
  zh: {
    sidenote: 'Spec-042 · 文档索引',
    eyebrow: 'Docs — 手册',
    serifLine: '通读',
    monoLine: '手册。',
    lede: '四个入口。其余皆是注脚。',
    navLabel: '文档入口',
  },
} as const;

export class DocsPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    const locale = contentLocale(this._getLocale('en'));
    const t = content[locale];
    return (
      <main class='manual'>
        <header class='masthead'>
          <span class='sidenote' aria-hidden='true'>{t.sidenote}</span>
          <div class='masthead-top'>
            <p class='eyebrow'>{t.eyebrow}</p>
            <span class='stamp'>{OPENELEMENT_VERSION}</span>
          </div>
          <h1>
            <span class='serif-line'>{t.serifLine}</span>
            <span class='mono-line'>{t.monoLine}</span>
          </h1>
          <p class='lede'>{t.lede}</p>
        </header>

        <nav class='entrances' aria-label={t.navLabel}>
          {entrances.map(([index, title, copy, href]) => (
            <a class='entrance' href={localizePath(href, locale)}>
              <span class='entrance-index' aria-hidden='true'>{index}</span>
              <div>
                <span class='entrance-title'>{title[locale]}</span>
                <p class='entrance-copy'>{copy[locale]}</p>
              </div>
              <span class='entrance-arrow' aria-hidden='true'>→</span>
            </a>
          ))}
        </nav>
      </main>
    );
  }
}

defineCustomElement(tagName, DocsPage);

export default DocsPage;
