export const meta = { section: 'Guide', label: 'Comparison', order: 25 };

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
  whenToChooseTitle: string;
  whenToChoose: ReadonlyArray<string>;
};

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'How OpenElement compares',
    lede:
      'OpenElement is a Web Components-native application framework with a JSX-first authoring layer; adjacent tools solve different slices.',
    outline: [
      { id: 'lit', label: 'Lit', level: 3 },
      { id: 'stencil', label: 'Stencil', level: 3 },
      { id: 'enhance', label: 'Enhance', level: 3 },
      { id: 'astro-fresh', label: 'Astro / Fresh', level: 3 },
      { id: 'when-to-choose', label: 'When to choose openElement', level: 2 },
    ],
    previous: { href: '/guide/architecture', label: 'Architecture' },
    next: { href: '/guide/routing-and-data', label: 'Routing and Data' },
    cards: [
      {
        id: 'lit',
        title: 'Lit',
        body:
          'A Web Components authoring library. Use Lit when you need standalone components; use openElement when you need a fullstack app lifecycle around those components.',
      },
      {
        id: 'stencil',
        title: 'Stencil',
        body:
          'A compiler and design-system production tool. Use Stencil to ship a component library; use openElement to build the application that consumes it.',
      },
      {
        id: 'enhance',
        title: 'Enhance',
        body:
          'The closest fullstack Web Components peer, but HTML-first. Choose Enhance if you prefer HTML templates; choose openElement if you prefer JSX and islands-driven hydration.',
      },
      {
        id: 'astro-fresh',
        title: 'Astro / Fresh',
        body:
          'Adjacent app frameworks. Astro is content-first and treats Web Components as one integration; Fresh is Preact-first. Choose openElement when Web Components are the primary app primitive.',
      },
    ],
    whenToChooseTitle: 'When to choose openElement',
    whenToChoose: [
      'You want DSD-native SSR out of the box, not an opt-in rendering mode.',
      'You want JSX authoring that compiles to standards-based Custom Elements.',
      'You need file-based routing, API routes, and islands in the same framework.',
      'You are targeting Deno Desktop or edge runtimes with the same component model.',
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'OpenElement 与其他工具的对比',
    lede:
      'OpenElement 是 Web Components 原生的应用框架，带有 JSX-first 编写层；相邻工具解决的是不同的切片。',
    outline: [
      { id: 'lit', label: 'Lit', level: 3 },
      { id: 'stencil', label: 'Stencil', level: 3 },
      { id: 'enhance', label: 'Enhance', level: 3 },
      { id: 'astro-fresh', label: 'Astro / Fresh', level: 3 },
      { id: 'when-to-choose', label: '何时选择 openElement', level: 2 },
    ],
    previous: { href: '/guide/architecture', label: '架构' },
    next: { href: '/guide/routing-and-data', label: '路由与数据' },
    cards: [
      {
        id: 'lit',
        title: 'Lit',
        body:
          'Web Components 编写库。需要独立组件时用 Lit；需要围绕这些组件的 fullstack 应用生命周期时用 openElement。',
      },
      {
        id: 'stencil',
        title: 'Stencil',
        body:
          '编译器与 design-system 生产工具。用 Stencil 交付组件库；用 openElement 构建消费组件库的应用。',
      },
      {
        id: 'enhance',
        title: 'Enhance',
        body:
          '最接近的 fullstack Web Components 同类，但走 HTML-first。偏好 HTML 模板选 Enhance；偏好 JSX 与 islands 驱动的 hydration 选 openElement。',
      },
      {
        id: 'astro-fresh',
        title: 'Astro / Fresh',
        body:
          '相邻的应用框架。Astro 是 content-first，把 Web Components 当作一种集成；Fresh 是 Preact-first。当 Web Components 是主要应用原语时选 openElement。',
      },
    ],
    whenToChooseTitle: '何时选择 openElement',
    whenToChoose: [
      '希望开箱即有 DSD 原生 SSR，而不是可选的渲染模式。',
      '希望用 JSX 编写并编译为基于标准的 Custom Elements。',
      '需要在同一个框架内使用 file-based routing、API routes 与 islands。',
      '希望用同一组件模型面向 Deno Desktop 或 edge runtimes。',
    ],
  },
};

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + guideSectionStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }

    .when-to-choose {
      margin-top: var(--size-8);
    }
  `,
);

export class GuideComparisonPage extends OpenElement {
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
          <div class='when-to-choose'>
            <h2 id='when-to-choose'>{t.whenToChooseTitle}</h2>
            <ul>
              {t.whenToChoose.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define('guide-comparison-page', GuideComparisonPage);
export default GuideComparisonPage;
export const tagName = 'guide-comparison-page';
