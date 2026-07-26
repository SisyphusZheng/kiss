export const meta = { section: 'Guide', label: 'Testing', order: 110 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import { guideSectionStyles } from '@openelement/site-ui/guide-section-styles.ts';
import '@openelement/ui/open-card';

type GuideContent = {
  breadcrumb: string;
  title: string;
  lede: string;
  outline: ReadonlyArray<{ id: string; label: string; level: 2 | 3 }>;
  previous?: { href: string; label: string };
  next?: { href: string; label: string };
  cards: ReadonlyArray<{ id: string; title: string; body: string }>;
};

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

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + guideSectionStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

export class GuideGuidePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
    return (
      <open-reading-shell
        rail
        footer
        metadata={JSON.stringify({ breadcrumb: t.breadcrumb, title: t.title, lede: t.lede })}
        previous={t.previous?.href}
        previous-label={t.previous?.label}
        next={t.next?.href}
        next-label={t.next?.label}
      >
        <open-page-rail slot='rail' items={JSON.stringify(t.outline)}></open-page-rail>
        <div class='container guide-sections'>
          <div class='guide-grid'>
            {t.cards.map((card) => (
              <open-card>
                <h3 id={card.id}>{card.title}</h3>
                <p>{card.body}</p>
              </open-card>
            ))}
          </div>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define('guide-testing-page', GuideGuidePage);
export default GuideGuidePage;
export const tagName = 'guide-testing-page';
