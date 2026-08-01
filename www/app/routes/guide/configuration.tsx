export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Configuration',
    lede: 'Configuration stays close to the route, build or package surface it affects.',
    outline: [
      { id: 'route-config', label: 'Route config', level: 3 },
      { id: 'build-config', label: 'Build config', level: 3 },
      { id: 'package-config', label: 'Package config', level: 3 },
    ],
    previous: { href: '/guide/api', label: 'API Routes' },
    next: { href: '/guide/migration', label: 'Migration' },
    cards: [
      {
        id: 'route-config',
        title: 'Route config',
        body: 'Declare route-facing behavior where the route can be audited.',
      },
      {
        id: 'build-config',
        title: 'Build config',
        body: 'Keep Vite and SSG settings explicit in project tasks.',
      },
      {
        id: 'package-config',
        title: 'Package config',
        body: 'Use package manifests for publish and dependency boundaries.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '配置',
    lede: '配置贴近它所影响的 route、build 或 package 表面。',
    outline: [
      { id: 'route-config', label: 'Route 配置', level: 3 },
      { id: 'build-config', label: 'Build 配置', level: 3 },
      { id: 'package-config', label: 'Package 配置', level: 3 },
    ],
    previous: { href: '/guide/api', label: 'API 路由' },
    next: { href: '/guide/migration', label: '迁移' },
    cards: [
      {
        id: 'route-config',
        title: 'Route 配置',
        body: '在 route 可被审计的位置声明面向路由的行为。',
      },
      {
        id: 'build-config',
        title: 'Build 配置',
        body: 'Vite 与 SSG 设置在项目 tasks 中保持显式。',
      },
      {
        id: 'package-config',
        title: 'Package 配置',
        body: '用 package manifests 表达发布与依赖边界。',
      },
    ],
  },
};

export class GuideConfigurationPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

customElements.define('guide-configuration-page', GuideConfigurationPage);
export default GuideConfigurationPage;
export const tagName = 'guide-configuration-page';
