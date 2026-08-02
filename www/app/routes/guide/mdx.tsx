export const meta = { section: 'Guide', label: 'MDX', order: 50 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'MDX',
    lede:
      'Documentation content compiles into the same route and component system as authored pages.',
    outline: [
      { id: 'content-source', label: 'Content source', level: 3 },
      { id: 'components', label: 'Components', level: 3 },
      { id: 'build-path', label: 'Build path', level: 3 },
    ],
    previous: { href: '/guide/routing-and-data', label: 'Routing and Data' },
    next: { href: '/guide/api', label: 'API Routes' },
    cards: [
      {
        id: 'content-source',
        title: 'Content source',
        body: 'Keep source content reviewable in the repository.',
      },
      {
        id: 'components',
        title: 'Components',
        body: 'Use shared UI primitives for examples and callouts.',
      },
      {
        id: 'build-path',
        title: 'Build path',
        body: 'Validate generated pages through the normal site build.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: 'MDX',
    lede: '文档内容编译进与手写页面相同的 route 与 component 体系。',
    outline: [
      { id: 'content-source', label: '内容来源', level: 3 },
      { id: 'components', label: '组件', level: 3 },
      { id: 'build-path', label: '构建路径', level: 3 },
    ],
    previous: { href: '/guide/routing-and-data', label: '路由与数据' },
    next: { href: '/guide/api', label: 'API 路由' },
    cards: [
      {
        id: 'content-source',
        title: '内容来源',
        body: '源内容保持在仓库中可审查。',
      },
      {
        id: 'components',
        title: '组件',
        body: '示例与 callouts 使用共享的 UI 原语。',
      },
      {
        id: 'build-path',
        title: '构建路径',
        body: '通过常规站点构建验证生成的页面。',
      },
    ],
  },
};

export class GuideMdxPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

defineCustomElement('guide-mdx-page', GuideMdxPage);
export default GuideMdxPage;
export const tagName = 'guide-mdx-page';
