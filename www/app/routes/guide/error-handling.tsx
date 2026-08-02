export const meta = { section: 'Guide', label: 'Error Handling', order: 80 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Error Handling',
    lede: 'Error handling preserves platform semantics and keeps route failures visible.',
    outline: [
      { id: 'route-errors', label: 'Route errors', level: 3 },
      { id: 'component-errors', label: 'Component errors', level: 3 },
      { id: 'build-errors', label: 'Build errors', level: 3 },
    ],
    previous: { href: '/guide/migration', label: 'Migration' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    cards: [
      {
        id: 'route-errors',
        title: 'Route errors',
        body: 'Return clear status codes and response bodies from API boundaries.',
      },
      {
        id: 'component-errors',
        title: 'Component errors',
        body: 'Keep component fallback states local and inspectable.',
      },
      {
        id: 'build-errors',
        title: 'Build errors',
        body: 'Treat generation failures as release blockers, not cosmetic warnings.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '错误处理',
    lede: '错误处理保留平台语义，并让 route 失败保持可见。',
    outline: [
      { id: 'route-errors', label: 'Route 错误', level: 3 },
      { id: 'component-errors', label: '组件错误', level: 3 },
      { id: 'build-errors', label: '构建错误', level: 3 },
    ],
    previous: { href: '/guide/migration', label: '迁移' },
    next: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    cards: [
      {
        id: 'route-errors',
        title: 'Route 错误',
        body: '从 API 边界返回明确的状态码与响应体。',
      },
      {
        id: 'component-errors',
        title: '组件错误',
        body: '组件 fallback 状态保持局部且可检查。',
      },
      {
        id: 'build-errors',
        title: '构建错误',
        body: '把生成失败视为发布阻断项，而不是装饰性警告。',
      },
    ],
  },
};

export class GuideErrorHandlingPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

defineCustomElement('guide-error-handling-page', GuideErrorHandlingPage);
export default GuideErrorHandlingPage;
export const tagName = 'guide-error-handling-page';
