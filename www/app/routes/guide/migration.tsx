export const meta = { section: 'Guide', label: 'Migration', order: 75 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import { guideSectionStyles } from '@openelement/site-ui/guide-section-styles.ts';
import '@openelement/ui/open-card';
import '@openelement/ui/open-code-block';

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
    title: 'Migrating to 0.41.0',
    lede: 'Every breaking change since 0.40.x, grouped by the version that shipped it.',
    outline: [
      { id: 'collapse', label: 'From 0.40.x', level: 3 },
      { id: 'alpha-17-19', label: 'Alpha.17–19', level: 3 },
      { id: 'freeze', label: 'The 0.41.0 freeze', level: 3 },
      { id: 'verify', label: 'Verify after upgrading', level: 3 },
    ],
    previous: { href: '/guide/configuration', label: 'Configuration' },
    next: { href: '/guide/error-handling', label: 'Error Handling' },
    cards: [
      {
        id: 'collapse',
        title: 'From 0.40.x',
        body:
          'The consumer graph is five packages; core/signal/router/protocol/content/ssg are retired. Author with defineElement/definePage/defineApp and build with buildApp(). defineLayout is removed; distribution is npm-first.',
      },
      {
        id: 'alpha-17-19',
        title: 'Alpha.17–19',
        body:
          'Build helpers moved to element/build-utils; router types left the app root; renderIntent.streaming was removed; dynamic 500s fail builds by default; star-seam types (SafeHtml/UnsafeHtml/StyleSheetRule) left the element root; ui controls are squared (radius-1).',
      },
      {
        id: 'freeze',
        title: 'The 0.41.0 freeze',
        body:
          'Adapter-vite internal subpaths (app-vite, build-context, head-injection, i18n-plugin, plugin, generated-data-resolver, plugin-mdx, route-manifest, cli/build-client, cli/build-ssg) were pruned. Use the root, nitro-mount, cli/build and sitemap.',
      },
      {
        id: 'verify',
        title: 'Verify after upgrading',
        body:
          'Reinstall frozen, rebuild, and grep for removed imports: renderIntent.streaming, open-element-render, open-element-hydration, app-vite, SafeHtml, *TagName. Re-record visual baselines after the ui geometry change.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '迁移到 0.41.0',
    lede: '自 0.40.x 以来的全部 breaking change，按发布版本分组。',
    outline: [
      { id: 'collapse', label: '从 0.40.x 升级', level: 3 },
      { id: 'alpha-17-19', label: 'Alpha.17–19', level: 3 },
      { id: 'freeze', label: '0.41.0 冻结', level: 3 },
      { id: 'verify', label: '升级后验证', level: 3 },
    ],
    previous: { href: '/guide/configuration', label: '配置' },
    next: { href: '/guide/error-handling', label: '错误处理' },
    cards: [
      {
        id: 'collapse',
        title: '从 0.40.x 升级',
        body:
          '消费包图收敛为五包；core/signal/router/protocol/content/ssg 已退役。用 defineElement/definePage/defineApp 创作、buildApp() 构建。defineLayout 已删除；分发改为 npm-first。',
      },
      {
        id: 'alpha-17-19',
        title: 'Alpha.17–19',
        body:
          '构建助手移至 element/build-utils；router 类型离开 app 根；renderIntent.streaming 删除；动态路由 500 默认 fail build；星型缝类型（SafeHtml/UnsafeHtml/StyleSheetRule）离开 element 根；ui 控件改为方形（radius-1）。',
      },
      {
        id: 'freeze',
        title: '0.41.0 冻结',
        body:
          'adapter-vite 内部子路径（app-vite、build-context、head-injection、i18n-plugin、plugin、generated-data-resolver、plugin-mdx、route-manifest、cli/build-client、cli/build-ssg）已修剪。请改用 root、nitro-mount、cli/build 与 sitemap。',
      },
      {
        id: 'verify',
        title: '升级后验证',
        body:
          '冻结重装依赖、重新构建，并 grep 已删除导入：renderIntent.streaming、open-element-render、open-element-hydration、app-vite、SafeHtml、*TagName。ui 几何变更后请重录视觉基线。',
      },
    ],
  },
};

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + guideSectionStyles + `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }
    @media (max-width: 860px) {
      .guide-grid { grid-template-columns: 1fr; }
    }
    .full-guide { margin-block-start: var(--size-6); color: var(--text-secondary); font-size: var(--font-size-00); }
    .full-guide a { color: var(--violet-8); }
  `,
);

export class GuideMigrationPage extends OpenElement {
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
          <p class='full-guide'>
            {this._getLocale('en') === 'zh'
              ? (
                <>
                  完整的逐条迁移指南（含 before/after 导入对照）见仓库
                  <a href='https://github.com/open-element/openelement/blob/main/docs/release/v0.41.0-migration.md'>
                    docs/release/v0.41.0-migration.md
                  </a>。
                </>
              )
              : (
                <>
                  The complete entry-by-entry guide with before/after imports lives in
                  <a href='https://github.com/open-element/openelement/blob/main/docs/release/v0.41.0-migration.md'>
                    docs/release/v0.41.0-migration.md
                  </a>.
                </>
              )}
          </p>
        </div>
      </open-reading-shell>
    );
  }
}

export default GuideMigrationPage;
