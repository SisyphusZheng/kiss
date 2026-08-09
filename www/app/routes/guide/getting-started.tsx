export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { OPENELEMENT_VERSION } from '../../data/version.ts';
import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

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
    subtitleBefore: 'The current source line is',
    subtitleAfter:
      'The published npm line is the same 0.42 alpha track (dist-tag alpha; latest remains 0.41.x); 0.41.x stable already shipped under the ADR-0119 freeze, and the 0.42.0 freeze proposal is ADR-0122 (PROPOSED).',
    cards: [
      {
        id: 'install',
        title: 'Install',
        body:
          "Three commands to a running app: deno run -A --minimum-dependency-age 0 npm:@openelement/create@alpha my-app, then cd my-app, then deno task dev. The @alpha dist-tag pins the 0.42 alpha line, and --minimum-dependency-age 0 is needed because Deno's default minimumDependencyAge (~24h) refuses packages published within the last day.",
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
    subtitleBefore: '当前源码线为',
    subtitleAfter:
      'npm 发布线同属 0.42 alpha 轨（dist-tag 为 alpha；latest 仍是 0.41.x）；0.41.x stable 已在 ADR-0119 冻结下发布，0.42.0 冻结提案为 ADR-0122（PROPOSED）。',
    cards: [
      {
        id: 'install',
        title: '安装',
        body:
          '三条命令跑起应用：deno run -A --minimum-dependency-age 0 npm:@openelement/create@alpha my-app，然后 cd my-app，再 deno task dev。@alpha dist-tag 锁定 0.42 alpha 线；--minimum-dependency-age 0 是必须的，因为 Deno 默认的 minimumDependencyAge（约 24h）会拒绝发布未满一天的包。',
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

export class GuideGettingStartedPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderBeforeCards(t: GuideContent): unknown {
    return (
      <p class='sidenote'>
        {t.subtitleBefore} {OPENELEMENT_VERSION}. {t.subtitleAfter}
      </p>
    );
  }
}

export const tagName = 'guide-getting-started-page';
defineCustomElement(tagName, GuideGettingStartedPage);
export default GuideGettingStartedPage;
