export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

// Guide card, not a second copy: the full architecture page lives under
// /architecture/architecture and is the single source of truth (#749).
const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Architecture Guide',
    lede:
      'The short orientation: how OpenElement is organized, and where the full architecture page lives.',
    outline: [
      { id: 'layers', label: 'Layers', level: 3 },
      { id: 'direction', label: 'Strategic direction', level: 3 },
      { id: 'gates', label: 'Release gates', level: 3 },
    ],
    previous: { href: '/guide/core-concepts', label: 'Core Concepts' },
    next: { href: '/guide/comparison', label: 'Comparison' },
    cards: [
      {
        id: 'layers',
        title: 'Layers',
        body:
          'The consumer graph is five packages: element (one authoring surface), app (pages, routes, islands), adapter-vite (the only host side), create (the starter), and optional ui. Deep modules hide implementation complexity.',
      },
      {
        id: 'direction',
        title: 'Strategic direction',
        body:
          'Web Components are the application architecture: WC SSR, a complete application loop, and portable output — not a growing package count.',
      },
      {
        id: 'gates',
        title: 'Release gates',
        body:
          'Current truth is checked mechanically: package surface, docs truth, artifacts, and browser tests reject a return to the retired product graph.',
      },
    ],
    fullPage: {
      href: '/architecture/architecture',
      label: 'Current Architecture',
      note: 'The full page with the package graph and layer map lives in the Architecture section:',
    },
  },
  zh: {
    breadcrumb: '指南',
    title: '架构指南',
    lede: '导读：OpenElement 的组织方式，以及完整架构页的位置。',
    outline: [
      { id: 'layers', label: '分层', level: 3 },
      { id: 'direction', label: '战略方向', level: 3 },
      { id: 'gates', label: '发布门禁', level: 3 },
    ],
    previous: { href: '/guide/core-concepts', label: '核心概念' },
    next: { href: '/guide/comparison', label: '对比' },
    cards: [
      {
        id: 'layers',
        title: '分层',
        body:
          '消费包图为五包：element（统一编写表面）、app（pages、routes、islands）、adapter-vite（唯一宿主侧）、create（starter）与可选 ui。Deep modules 隐藏实现复杂度。',
      },
      {
        id: 'direction',
        title: '战略方向',
        body:
          'Web Components 即应用架构：WC SSR、完整的 application loop 与可移植输出——而不是包数量的增长。',
      },
      {
        id: 'gates',
        title: '发布门禁',
        body:
          '当前事实由机械化检查保障：package surface、docs truth、artifacts 与浏览器测试拒绝退回已退役的包图。',
      },
    ],
    fullPage: {
      href: '/architecture/architecture',
      label: 'Current Architecture',
      note: '含 package graph 与 layer map 的完整页见架构栏：',
    },
  },
};

export class GuideArchitecturePage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

defineCustomElement('guide-architecture-page', GuideArchitecturePage);
export default GuideArchitecturePage;
export const tagName = 'guide-architecture-page';
