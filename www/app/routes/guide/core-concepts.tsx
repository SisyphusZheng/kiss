export const meta = { section: 'Guide', label: 'Core Concepts', order: 10 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import { guideSectionStyles } from '@openelement/site-ui/guide-section-styles.ts';
import '@openelement/ui/open-card';

type GuideContent = {
  breadcrumb: string;
  title: string;
  lede: string;
  outline: ReadonlyArray<{ id: string; label: string; level: 2 | 3 }>;
  previous?: { href: string; label: string };
  next?: { href: string; label: string };
  cards: ReadonlyArray<{ id: string; title: string; body: string }>;
};

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Core Concepts',
    lede:
      'The core model is standards-first: authored elements, declarative rendering, file routes and optional islands.',
    outline: [
      { id: 'openelement', label: 'OpenElement', level: 3 },
      { id: 'dsd', label: 'DSD', level: 3 },
      { id: 'islands', label: 'Islands', level: 3 },
    ],
    previous: { href: '/guide/getting-started', label: 'Getting Started' },
    next: { href: '/guide/architecture', label: 'Architecture' },
    cards: [
      {
        id: 'openelement',
        title: 'OpenElement',
        body: 'The base element class provides the component authoring surface.',
      },
      {
        id: 'dsd',
        title: 'DSD',
        body: 'Declarative Shadow DOM carries server-rendered shadow roots in HTML.',
      },
      {
        id: 'islands',
        title: 'Islands',
        body: 'Hydrate only the components that need browser runtime behavior.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '核心概念',
    lede:
      '核心模型是 standards-first：authored elements、declarative rendering、file routes 与可选 islands。',
    outline: [
      { id: 'openelement', label: 'OpenElement', level: 3 },
      { id: 'dsd', label: 'DSD', level: 3 },
      { id: 'islands', label: 'Islands', level: 3 },
    ],
    previous: { href: '/guide/getting-started', label: '快速开始' },
    next: { href: '/guide/architecture', label: '架构' },
    cards: [
      {
        id: 'openelement',
        title: 'OpenElement',
        body: 'base element class 提供组件编写表面。',
      },
      {
        id: 'dsd',
        title: 'DSD',
        body: 'Declarative Shadow DOM 在 HTML 中携带 server-rendered shadow roots。',
      },
      {
        id: 'islands',
        title: 'Islands',
        body: '只 hydrate 需要浏览器运行时行为的组件。',
      },
    ],
  },
};

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + guideSectionStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class GuideGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
    return (
      <open-reading-shell
        rail
        footer
        metadata={JSON.stringify({ breadcrumb: t.breadcrumb, title: t.title, lede: t.lede })}
        previous={t.previous?.href}
        previous-label={t.previous?.label}
        next={t.next?.href}
        next-label={t.next?.label}
      >
        <open-page-rail slot='rail' items={JSON.stringify(t.outline)}></open-page-rail>
        <div class='container guide-sections'>
          <div class='guide-grid'>
            {t.cards.map((card) => (
              <open-card>
                <h3 id={card.id}>{card.title}</h3>
                <p>{card.body}</p>
              </open-card>
            ))}
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define('guide-core-concepts-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-core-concepts-page';
