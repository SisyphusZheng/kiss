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
      'The five-package convergence is published; the stable 0.41.0 freeze plan is active under ADR-0119.',
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
    subtitleAfter: 'five-package convergence 已发布；0.41.0 stable 冻结计划已在 ADR-0119 下启动。',
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

defineCustomElement('guide-getting-started-page', GuideGettingStartedPage);
export default GuideGettingStartedPage;
export const tagName = 'guide-getting-started-page';
