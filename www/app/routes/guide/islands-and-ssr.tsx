export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Islands and SSR',
    lede:
      'SSR and DSD provide the document baseline. Islands add client behavior at declared boundaries.',
    outline: [
      { id: 'server-first', label: 'Server first', level: 3 },
      { id: 'declared-islands', label: 'Declared islands', level: 3 },
      { id: 'small-runtime', label: 'Small runtime', level: 3 },
    ],
    previous: { href: '/guide/error-handling', label: 'Error Handling' },
    next: { href: '/guide/deployment', label: 'Deployment' },
    cards: [
      {
        id: 'server-first',
        title: 'Server first',
        body: 'Render useful HTML before client modules run.',
      },
      {
        id: 'declared-islands',
        title: 'Declared islands',
        body: 'Hydration should be visible from route metadata.',
      },
      {
        id: 'small-runtime',
        title: 'Small runtime',
        body: 'Keep browser JavaScript scoped to interactive surfaces.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'Islands 与 SSR',
    lede: 'SSR 与 DSD 提供文档基线。Islands 在声明的边界上添加客户端行为。',
    outline: [
      { id: 'server-first', label: 'Server first', level: 3 },
      { id: 'declared-islands', label: '声明式 islands', level: 3 },
      { id: 'small-runtime', label: '小运行时', level: 3 },
    ],
    previous: { href: '/guide/error-handling', label: '错误处理' },
    next: { href: '/guide/deployment', label: '部署' },
    cards: [
      {
        id: 'server-first',
        title: 'Server first',
        body: '在客户端模块运行之前渲染可用的 HTML。',
      },
      {
        id: 'declared-islands',
        title: '声明式 islands',
        body: 'Hydration 应当能从 route metadata 中看出。',
      },
      {
        id: 'small-runtime',
        title: '小运行时',
        body: '浏览器 JavaScript 限制在交互表面内。',
      },
    ],
  },
};

export class GuideIslandsAndSsrPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

export const tagName = 'guide-islands-and-ssr-page';
defineCustomElement(tagName, GuideIslandsAndSsrPage);
export default GuideIslandsAndSsrPage;
