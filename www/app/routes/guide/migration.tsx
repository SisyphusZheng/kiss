export const meta = { section: 'Guide', label: 'Migration', order: 75 };

import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

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

export class GuideMigrationPage extends GuidePage {
  static override styles = [guideStyles({ columns: 2 })];
  static override guide = { content };

  protected override renderAfterCards(_t: GuideContent): unknown {
    return (
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
    );
  }
}

export default GuideMigrationPage;
