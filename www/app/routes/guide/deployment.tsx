export const meta = { section: 'Guide', label: 'Deployment', order: 100 };

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
    title: 'Deployment',
    lede:
      'Deployment is built around generated static output and adapter-specific runtime boundaries.',
    outline: [
      { id: 'static-output', label: 'Static output', level: 3 },
      { id: 'request-time-server', label: 'Request-time server', level: 3 },
      { id: 'adapters', label: 'Adapters', level: 3 },
      { id: 'verification', label: 'Verification', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    next: { href: '/guide/testing', label: 'Testing' },
    cards: [
      {
        id: 'static-output',
        title: 'Static output',
        body: 'The docs site is generated through the SSG pipeline.',
      },
      {
        id: 'request-time-server',
        title: 'Request-time server',
        body:
          "When any route declares renderIntent: { mode: 'dynamic' }, the build also emits dist/server/index.js — a Nitro-mountable handler over the same SSR bundle — plus server-manifest.json listing the request-time routes. Pure-static builds emit neither (0.42 line, unfrozen).",
      },
      {
        id: 'adapters',
        title: 'Adapters',
        body: 'Runtime adapters remain separate from the core packages.',
      },
      {
        id: 'verification',
        title: 'Verification',
        body: 'Build output should be checked before publishing or pushing release changes.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '部署',
    lede: '部署围绕生成的静态输出与 adapter 各自的运行时边界展开。',
    outline: [
      { id: 'static-output', label: '静态输出', level: 3 },
      { id: 'request-time-server', label: '请求时服务器', level: 3 },
      { id: 'adapters', label: 'Adapters', level: 3 },
      { id: 'verification', label: '验证', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    next: { href: '/guide/testing', label: '测试' },
    cards: [
      {
        id: 'static-output',
        title: '静态输出',
        body: 'docs 站点通过 SSG 管线生成。',
      },
      {
        id: 'request-time-server',
        title: '请求时服务器',
        body:
          "当任何路由声明 renderIntent: { mode: 'dynamic' } 时,构建还会产出 dist/server/index.js——挂在同一个 SSR bundle 上、可由 Nitro 挂载的处理器——以及列出请求时路由的 server-manifest.json。纯静态构建两者都不产出(0.42 版本线,未冻结)。",
      },
      {
        id: 'adapters',
        title: 'Adapters',
        body: 'Runtime adapters 与核心包保持分离。',
      },
      {
        id: 'verification',
        title: '验证',
        body: '发布或推送 release 变更前应检查构建产物。',
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

customElements.define('guide-deployment-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-deployment-page';
