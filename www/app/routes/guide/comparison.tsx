export const meta = { section: 'Guide', label: 'Comparison', order: 25 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

// Guide card, not a second copy: the full, dated comparison lives under
// /architecture/comparison and is the single source of truth (#749).
const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'How OpenElement compares',
    lede:
      'The short orientation: what openElement optimizes for, and where the full reviewed comparison lives.',
    outline: [
      { id: 'positioning', label: 'Positioning', level: 3 },
      { id: 'how-to-read', label: 'How to read the comparison', level: 3 },
      { id: 'decision-criteria', label: 'Decision criteria', level: 3 },
    ],
    previous: { href: '/guide/architecture', label: 'Architecture' },
    next: { href: '/guide/routing-and-data', label: 'Routing and Data' },
    cards: [
      {
        id: 'positioning',
        title: 'Positioning',
        body:
          'openElement is a Web Components-native application framework: Custom Elements and DSD are first-class, SSG is the default, and Vite/Nitro is the official build path. Adjacent tools solve different slices — Lit and Stencil author components, Enhance is HTML-first, Astro and Fresh are content- or Preact-first.',
      },
      {
        id: 'how-to-read',
        title: 'How to read the comparison',
        body:
          'The full page describes what each framework optimizes for; it does not invent benchmark numbers. Use it to understand fit, not to rank speed.',
      },
      {
        id: 'decision-criteria',
        title: 'Decision criteria',
        body:
          'Compare on architecture, rendering model, developer experience, and lock-in — the same axes the full review applies to every candidate.',
      },
    ],
    fullPage: {
      href: '/architecture/comparison',
      label: 'openElement vs Alternatives',
      note:
        'The complete, dated comparison with sources and review scope lives in the Architecture section:',
    },
  },
  zh: {
    breadcrumb: '指南',
    title: 'OpenElement 与其他工具的对比',
    lede: '导读：openElement 优化的方向，以及完整对比页的位置。',
    outline: [
      { id: 'positioning', label: '定位', level: 3 },
      { id: 'how-to-read', label: '如何阅读对比', level: 3 },
      { id: 'decision-criteria', label: '决策标准', level: 3 },
    ],
    previous: { href: '/guide/architecture', label: '架构' },
    next: { href: '/guide/routing-and-data', label: '路由与数据' },
    cards: [
      {
        id: 'positioning',
        title: '定位',
        body:
          'openElement 是 Web Components 原生的应用框架：Custom Elements 与 DSD 是一等公民，默认 SSG，Vite/Nitro 是官方构建路径。相邻工具解决不同的切片——Lit 与 Stencil 编写组件，Enhance 是 HTML-first，Astro 与 Fresh 分别是 content-first 与 Preact-first。',
      },
      {
        id: 'how-to-read',
        title: '如何阅读对比',
        body:
          '完整页描述每个框架优化的方向，不编造 benchmark 数字。用它判断是否契合，而不是给速度排名。',
      },
      {
        id: 'decision-criteria',
        title: '决策标准',
        body: '按架构、渲染模型、开发者体验与锁定风险比较——完整评审对每个候选都使用同样的维度。',
      },
    ],
    fullPage: {
      href: '/architecture/comparison',
      label: 'openElement vs Alternatives',
      note: '完整对比（含来源与评审范围）见架构栏：',
    },
  },
};

export class GuideComparisonPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

export const tagName = 'guide-comparison-page';
defineCustomElement(tagName, GuideComparisonPage);
export default GuideComparisonPage;
