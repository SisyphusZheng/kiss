export const meta = { section: 'Core', label: 'API Routes', order: 60 };

import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'API Routes',
    lede:
      'API routes use platform request and response primitives. Keep route handlers explicit, typed, and close to the app boundary.',
    outline: [
      { id: 'request-boundary', label: 'Request boundary', level: 3 },
      { id: 'handler-shape', label: 'Handler shape', level: 3 },
      { id: 'runtime-fit', label: 'Runtime fit', level: 3 },
    ],
    previous: { href: '/guide/mdx', label: 'MDX' },
    next: { href: '/guide/configuration', label: 'Configuration' },
    cards: [
      {
        id: 'request-boundary',
        title: 'Request boundary',
        body: 'Use Web Request and Response objects at the edge of the API contract.',
      },
      {
        id: 'handler-shape',
        title: 'Handler shape',
        body: 'Keep input parsing, validation, and response serialization visible in the route.',
      },
      {
        id: 'runtime-fit',
        title: 'Runtime fit',
        body: 'Use Deno-first tasks and avoid Node-only assumptions in docs examples.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'API 路由',
    lede:
      'API routes 使用平台 request 与 response 原语。Route handlers 保持显式、有类型，并贴近应用边界。',
    outline: [
      { id: 'request-boundary', label: 'Request 边界', level: 3 },
      { id: 'handler-shape', label: 'Handler 形态', level: 3 },
      { id: 'runtime-fit', label: '运行时适配', level: 3 },
    ],
    previous: { href: '/guide/mdx', label: 'MDX' },
    next: { href: '/guide/configuration', label: '配置' },
    cards: [
      {
        id: 'request-boundary',
        title: 'Request 边界',
        body: '在 API 契约边界使用 Web Request 与 Response 对象。',
      },
      {
        id: 'handler-shape',
        title: 'Handler 形态',
        body: '输入解析、校验与响应序列化在 route 中保持可见。',
      },
      {
        id: 'runtime-fit',
        title: '运行时适配',
        body: '使用 Deno-first 的 tasks，文档示例避免仅 Node 的假设。',
      },
    ],
  },
};

export class GuideApiPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

customElements.define('guide-api-page', GuideApiPage);
export default GuideApiPage;
export const tagName = 'guide-api-page';
