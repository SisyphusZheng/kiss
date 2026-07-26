export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { OPENELEMENT_VERSION } from '../../data/version.ts';
import { pageStyles } from '../../components/page-styles.js';
import { guideSectionStyles } from '@openelement/site-ui/guide-section-styles.ts';
import '@openelement/ui/open-card';

type GuideContent = {
  breadcrumb: string;
  title: string;
  lede: string;
  outline: ReadonlyArray<{ id: string; label: string; level: 2 | 3 }>;
  next?: { href: string; label: string };
  subtitleBefore: string;
  subtitleAfter: string;
  cards: ReadonlyArray<{ id: string; title: string; body: string }>;
};

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Getting Started',
    lede:
      'OpenElement is a Web Components-native, static-first application framework. Start with standard Custom Elements, pages, routes, selective upgrades and deployable Vite/Nitro output.',
    outline: [
      { id: 'install', label: 'Install', level: 3 },
      { id: 'explore', label: 'Explore', level: 3 },
      { id: 'build', label: 'Build', level: 3 },
    ],
    next: { href: '/guide/core-concepts', label: 'Core Concepts' },
    subtitleBefore: 'The current published package line is',
    subtitleAfter:
      'The five-package convergence is published; external adopter pilot #390 remains the primary stability evidence still open.',
    cards: [
      {
        id: 'install',
        title: 'Install',
        body: 'Use the npm-first create surface and Deno tasks for local development.',
      },
      {
        id: 'explore',
        title: 'Explore',
        body: 'Read the docs, API reference, and roadmap as the current product map.',
      },
      {
        id: 'build',
        title: 'Build',
        body: 'Run build, package, docs truth, and visual smoke gates before release.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '快速开始',
    lede:
      'OpenElement 是以 Web Components 为原生契约、static-first 的应用框架。从标准 Custom Elements、pages、routes 与按需升级开始，产出可部署的 Vite/Nitro 输出。',
    outline: [
      { id: 'install', label: '安装', level: 3 },
      { id: 'explore', label: '探索', level: 3 },
      { id: 'build', label: '构建', level: 3 },
    ],
    next: { href: '/guide/core-concepts', label: '核心概念' },
    subtitleBefore: '当前发布的包线为',
    subtitleAfter:
      'five-package convergence 已发布；外部 adopter pilot #390 仍是尚未关闭的主要稳定性证据。',
    cards: [
      {
        id: 'install',
        title: '安装',
        body: '使用 npm-first 的 create 入口与 Deno tasks 进行本地开发。',
      },
      {
        id: 'explore',
        title: '探索',
        body: '阅读 docs、API reference 与 roadmap，了解当前产品全貌。',
      },
      {
        id: 'build',
        title: '构建',
        body: '发布前运行 build、package、docs truth 与 visual smoke 门禁。',
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
        next={t.next?.href}
        next-label={t.next?.label}
      >
        <open-page-rail slot='rail' items={JSON.stringify(t.outline)}></open-page-rail>
        <div class='container guide-sections'>
          <p class='sidenote'>
            {t.subtitleBefore} {OPENELEMENT_VERSION}. {t.subtitleAfter}
          </p>
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

customElements.define('guide-getting-started-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-getting-started-page';
