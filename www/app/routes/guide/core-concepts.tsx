export const meta = { section: 'Guide', label: 'Core Concepts', order: 10 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

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

export class GuideCoreConceptsPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

export const tagName = 'guide-core-concepts-page';
defineCustomElement(tagName, GuideCoreConceptsPage);
export default GuideCoreConceptsPage;
