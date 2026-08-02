export const meta = { section: 'Guide', label: 'Testing', order: 110 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Testing',
    lede:
      'Use checks that match the changed surface: type checks for routes, build checks for generated output and visual checks for design changes.',
    outline: [
      { id: 'type-checks', label: 'Type checks', level: 3 },
      { id: 'build-checks', label: 'Build checks', level: 3 },
      { id: 'visual-checks', label: 'Visual checks', level: 3 },
    ],
    previous: { href: '/guide/deployment', label: 'Deployment' },
    cards: [
      {
        id: 'type-checks',
        title: 'Type checks',
        body: 'Run Deno checks on changed route and component files.',
      },
      {
        id: 'build-checks',
        title: 'Build checks',
        body: 'Use the site build to catch generation regressions.',
      },
      {
        id: 'visual-checks',
        title: 'Visual checks',
        body: 'Capture desktop and mobile states for layout-sensitive work.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '测试',
    lede:
      '使用与变更表面匹配的检查：routes 用 type checks，生成产物用 build checks，设计变更用 visual checks。',
    outline: [
      { id: 'type-checks', label: '类型检查', level: 3 },
      { id: 'build-checks', label: '构建检查', level: 3 },
      { id: 'visual-checks', label: '视觉检查', level: 3 },
    ],
    previous: { href: '/guide/deployment', label: '部署' },
    cards: [
      {
        id: 'type-checks',
        title: '类型检查',
        body: '对变更的 route 与 component 文件运行 Deno checks。',
      },
      {
        id: 'build-checks',
        title: '构建检查',
        body: '用站点构建捕获生成回归。',
      },
      {
        id: 'visual-checks',
        title: '视觉检查',
        body: '对布局敏感的工作截取 desktop 与 mobile 状态。',
      },
    ],
  },
};

export class GuideTestingPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

defineCustomElement('guide-testing-page', GuideTestingPage);
export default GuideTestingPage;
export const tagName = 'guide-testing-page';
