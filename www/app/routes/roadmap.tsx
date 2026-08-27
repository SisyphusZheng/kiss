export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// Strategic anchors: Web Components-native, static-first application framework.

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { PUBLISHED_PACKAGE_VERSION, PUBLISHED_STABLE_VERSION } from '../data/version.ts';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/site-ui/open-standards-visual.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .now-callout {
    margin: var(--size-5) 0 var(--size-6);
    padding: var(--size-4) var(--size-5);
    border: var(--border-size-1) solid var(--border);
    border-inline-start: var(--size-1) solid var(--brand);
    border-radius: var(--radius-2);
  }

  .now-callout .now-title {
    margin: var(--size-3) 0 var(--size-2);
    color: var(--text-primary);
    font-weight: var(--font-weight-7);
    line-height: 1.3;
  }

  .now-callout .now-copy {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .metric-label,
  .rule-label,
  .rule-title {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .now p,
  .tl-copy,
  .truth p,
  .truth li,
  .rule-copy,
  .rule-text,
  .matrix-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  /* vertical timeline: square nodes, evidence-first versions */
  .roadmap-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, .38fr);
    gap: clamp(2rem, 6vw, 5rem);
    align-items: start;
  }

  .timeline {
    position: relative;
    display: grid;
  }

  .timeline::before {
    content: "";
    position: absolute;
    inset-block: var(--size-2);
    inset-inline-start: calc(var(--size-2) / 2);
    width: var(--border-size-1);
    background: var(--border);
  }

  .tl-row {
    position: relative;
    padding: var(--size-5) 0 var(--size-5) var(--size-8);
  }

  .tl-node {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: calc(var(--size-5) + var(--size-3));
    width: var(--size-2);
    height: var(--size-2);
  }

  .tl-stable .tl-node {
    background: var(--brand);
  }

  .tl-next .tl-node {
    border: var(--border-size-2) solid var(--violet-8);
    background: var(--bg-base);
  }

  .tl-next .tl-node::after {
    content: "";
    position: absolute;
    inset: var(--size-1);
    background: var(--violet-8);
  }

  .tl-planned .tl-node {
    border: var(--border-size-2) solid color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .tl-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--size-3) var(--size-4);
  }

  .tl-version {
    color: var(--text-primary);
    font-size: clamp(2rem, 4.2vw, 3.6rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.03em;
  }

  .tl-next .tl-version {
    color: var(--violet-8);
  }

  .tl-planned .tl-version {
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .tl-theme {
    color: var(--violet-8);
    font-family: var(--font-serif);
    font-size: clamp(1.25rem, 1.9vw, 1.7rem);
    font-style: italic;
    font-weight: 400;
  }

  .tl-planned .tl-theme {
    color: var(--violet-5);
  }

  .stamp {
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .stamp-current {
    background: var(--brand);
    color: var(--on-brand);
  }

  .stamp-next {
    border: var(--border-size-1) solid var(--violet-8);
    color: var(--violet-8);
  }

  .tl-status {
    color: var(--text-muted);
    font-size: var(--font-size-00);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .tl-copy {
    max-width: 560px;
    margin-block: var(--size-3) 0;
  }

  .rule-callout {
    position: sticky;
    top: calc(var(--nav-height) + var(--size-6));
    padding: var(--size-5);
    border: var(--border-size-1) solid color-mix(in srgb, var(--violet-5) 45%, transparent);
    border-radius: var(--radius-2);
    background: var(--violet-0);
    box-shadow: inset var(--size-1) 0 0 var(--brand);
  }

  .rule-title {
    margin-block-end: var(--size-3);
    color: var(--violet-8);
  }

  .rule-text {
    margin-block-end: 0;
  }

  .truth-grid {
    display: grid;
    grid-template-columns: minmax(0, .95fr) minmax(0, .95fr) minmax(0, .72fr);
    gap: var(--size-5);
  }

  .truth h2 {
    margin-block: 0 var(--size-4);
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .truth ul {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .matrix {
    display: grid;
    border-block-start: var(--border-size-1) solid var(--border);
  }

  .matrix-row {
    display: grid;
    grid-template-columns: minmax(132px, .28fr) minmax(0, 1fr);
    gap: var(--size-5);
    padding-block: var(--size-5);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .matrix-row:last-child {
    border-block-end: 0;
  }

  .visual-grid {
    display: grid;
    grid-template-columns: minmax(0, .88fr) minmax(0, 1fr);
    gap: var(--size-5);
  }

  .rule-list {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rule-list li {
    display: grid;
    grid-template-columns: minmax(110px, .32fr) minmax(0, 1fr);
    gap: var(--size-4);
    padding-block: var(--size-4);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .rule-list li:last-child {
    border-block-end: 0;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    width: min(1180px, calc(100% - 3rem));
    margin: clamp(4rem, 10vh, 8rem) auto 0;
    padding-block-end: clamp(3rem, 8vh, 6rem);
  }

  @media (max-width: 1120px) {
    .roadmap-grid,
    .truth-grid,
    .visual-grid {
      grid-template-columns: 1fr;
    }

    .rule-callout {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .matrix-row,
    .rule-list li {
      grid-template-columns: 1fr;
      gap: var(--size-2);
    }

    .tl-row {
      padding-inline-start: var(--size-6);
    }
  }
`);

type TimelineEntry = {
  version: string;
  theme: string;
  copy: string;
  state: 'stable' | 'next' | 'planned';
  stamp?: 'CURRENT' | 'NEXT';
  status?: string;
};

const entries: Record<'en' | 'zh', TimelineEntry[]> = {
  en: [
    {
      version: 'v0.43.3',
      theme: 'renderer-owned light DOM hydration — robustness audit closure',
      copy:
        'The published stable line remains available while 0.44 is prerelease. It proves Universal WC SSR, in-place light-DOM activation and the application delivery baseline that the compiled architecture must preserve.',
      state: 'stable',
      stamp: 'CURRENT',
    },
    {
      version: 'v0.44 alpha',
      theme: 'compiled OpenElement foundations',
      copy:
        'Architecture constitution, governance offload, unified Content Graph and a production-shaped TSX-to-Part Program compiler spike.',
      state: 'next',
      stamp: 'NEXT',
      status: 'active',
    },
    {
      version: 'compiler → claim',
      theme: 'Element, Parts and claim',
      copy:
        'Standard decorators, the OpenElement kernel, replaceable Signals, fixed Parts, dynamic Regions, DSD serialization and existing-DOM claim converge on one program.',
      state: 'planned',
      status: 'planned sequence',
    },
    {
      version: 'delivery → qualification',
      theme: 'delivery, migration and qualification',
      copy:
        'Zero-runtime static output, generated Island delivery, App/build convergence, old-path removal, ecosystem interop and real-application qualification.',
      state: 'planned',
      status: 'planned sequence',
    },
    {
      version: 'v0.44 release candidate',
      theme: 'frozen candidate',
      copy:
        'Entered only after the complete architecture, correctness, delivery, portability, documentation, governance and real-application gate passes. Any public or architecture change returns to alpha.',
      state: 'planned',
      status: 'gated',
    },
    {
      version: 'v1.0.0',
      theme: 'stable five-package product',
      copy:
        'Release only after external production users prove that the Element, App and Build interfaces need no further architecture change.',
      state: 'planned',
      status: 'direction',
    },
  ],
  zh: [
    {
      version: 'v0.43.3',
      theme: '渲染方所有的 light DOM 水合 — 鲁棒性审计闭环',
      copy:
        '已发布稳定线会在 0.44 预发布期间继续可用。它证明了 Universal WC SSR、light DOM 原地激活与应用交付基线；新的编译架构必须保持这些能力。',
      state: 'stable',
      stamp: 'CURRENT',
    },
    {
      version: 'v0.44 alpha',
      theme: '编译型 OpenElement 地基',
      copy:
        '冻结架构宪法、治理减负、统一 Content Graph，并完成具备生产形态的 TSX 到 Part Program 编译器纵切。',
      state: 'next',
      stamp: 'NEXT',
      status: '执行中',
    },
    {
      version: '编译器 → claim',
      theme: 'Element、Parts 与 claim',
      copy:
        '标准装饰器、OpenElement 内核、可替换 Signal、固定 Part、动态 Region、DSD 序列化与已有 DOM claim 收束到同一程序。',
      state: 'planned',
      status: '规划序列',
    },
    {
      version: '交付 → 资格验证',
      theme: '交付、迁移与验证',
      copy:
        '零运行时静态输出、生成式 Island 交付、App/构建收束、旧路径删除、生态互操作与真实应用验证。',
      state: 'planned',
      status: '规划序列',
    },
    {
      version: 'v0.44 发布候选',
      theme: '冻结候选',
      copy:
        '只有架构、正确性、交付、可移植性、文档、治理与真实应用门禁全部通过才可进入；任何公开面或架构变化都会退回 alpha。',
      state: 'planned',
      status: '受门禁约束',
    },
    {
      version: 'v1.0.0',
      theme: '稳定的五包产品',
      copy: '只有当外部生产用户证明 Element、App 与 Build 接口不再需要架构变更时，才发布。',
      state: 'planned',
      status: '方向',
    },
  ],
};

const content = {
  en: {
    pageTitle: 'Roadmap',
    heroLede:
      'OpenElement roadmap labels describe the public product surface, tied to package truth, docs truth and CI evidence rather than a wish list.',
    railItems:
      '[{"id":"release-line","label":"Release line"},{"id":"product-boundary","label":"Product boundary"},{"id":"decision-matrix","label":"Decision matrix"},{"id":"system-visual","label":"System visual"}]',
    architecture: 'Architecture',
    freezeBadge: 'ADR-0143 — v0.44 alpha active',
    nowTitle: '0.43.3 remains stable while the compiled OpenElement train begins.',
    nowCopy: (version: string) =>
      `${version} is the published stable maintenance line. ADR-0143 explicitly opens the 0.44 alpha line for the compiled Element architecture; the Version Plan owns every numbered alpha and the RC gate.`,
    releaseLineIndex: '01 / release line',
    releaseLineTitle: 'From shipped evidence to v1.0 freeze.',
    releaseLineCopy:
      'The line is deliberately narrow: only claims that can survive docs, package exports and build validation stay visible.',
    timelineAria: 'Roadmap release line',
    stamps: { CURRENT: 'CURRENT', NEXT: 'NEXT' } as Record<'CURRENT' | 'NEXT', string>,
    designRuleTitle: 'Design rule',
    designRuleText:
      'No new package is created by default. Auth, ORM and storage remain recipes — openElement owns the application contract, not service products.',
    boundaryIndex: '02 / product boundary',
    boundaryTitle: 'Scope is explicit.',
    boundaryCopy:
      'Current capability, excluded promises and the visual contract are kept separate.',
    inProductLabel: 'in product',
    inProductTitle: 'In product',
    inProductItems: [
      'JSX-first application API',
      'Declarative Shadow DOM rendering',
      'Routes, layouts, content, islands, and i18n',
      'Loaders and actions with progressive-enhancement forms',
      'CSRF floor on the action surface',
      'Nitro server output (Node + Workers) and SPA mode',
      'Preact adapter and Hono API routes via adapter-vite',
      'Verified package and release boundaries',
    ],
    outScopeLabel: 'out of current scope',
    outScopeTitle: 'Out of current scope',
    outScopeItems: [
      'Hub product language',
      'Registry Hub as a current product promise',
      'RPC, CEM, and interop adapter package promises',
      'Generic auth, ORM, or database platform claims',
      'Old package-count public graph language',
    ],
    siteRuleLabel: 'design rule',
    siteRuleTitle: 'Design rule',
    siteRuleText:
      'The public website should read like a Web Standards Lab: dark-first, diagrammatic, useful, and grounded in artifacts users can inspect.',
    matrixIndex: '03 / decision matrix',
    matrixTitle: 'Roadmap language stays inside the product boundary.',
    matrixCopy: 'Ship, prove and freeze are evidence states rather than marketing labels.',
    shipLabel: 'Ship',
    shipCopy: 'Only public contracts reflected in docs, generated pages, and package surfaces.',
    proveLabel: 'Prove',
    proveCopy: 'Use CI, build checks, and docs scans as release evidence before expanding claims.',
    freezeLabel: 'Freeze',
    freezeCopy:
      'Move toward v1.0 after the WC fullstack framework and Basic Element line is stable, readable, and boring to verify.',
    visualIndex: '04 / system visual',
    visualTitle: 'The package graph is part of the release artifact.',
    visualCopy:
      'Published package ownership and the public architecture must remain mechanically identical.',
    packageMatrixLabel: 'package matrix',
    productBoundaryMeta: 'product boundary',
    releaseDisciplineLabel: 'release discipline',
    v10PostureMeta: 'v1.0 posture',
    noDriftLabel: 'No drift',
    noDriftCopy: 'Marketing language, docs, package exports, and CI gates must agree.',
    noGhostsLabel: 'No ghosts',
    noGhostsCopy:
      'Archived Hub-era promises and No webpack-era shortcuts stay out of the current public product line.',
    noFogLabel: 'No fog',
    noFogCopy:
      'Users should understand what is shipped, current, planned, and explicitly out of scope.',
    changelog: 'Changelog',
    deployment: 'Deployment',
  },
  zh: {
    pageTitle: 'Roadmap',
    heroLede:
      'OpenElement 的 roadmap 标签描述的是公开产品面，锚定包真相、文档真相与 CI 证据，而不是愿望清单。',
    railItems:
      '[{"id":"release-line","label":"发布线"},{"id":"product-boundary","label":"产品边界"},{"id":"decision-matrix","label":"决策矩阵"},{"id":"system-visual","label":"系统图示"}]',
    architecture: '架构',
    freezeBadge: 'ADR-0143 — v0.44 alpha 执行中',
    nowTitle: '0.43.3 保持稳定，编译型 OpenElement 列车已经启动。',
    nowCopy: (version: string) =>
      `${version} 是已发布的稳定维护线。ADR-0143 已明确开启 0.44 alpha 编译型 Element 架构列车；每个编号 alpha 与 RC 门禁均以 Version Plan 为准。`,
    releaseLineIndex: '01 / 发布线',
    releaseLineTitle: '从已交付证据，到 v1.0 冻结。',
    releaseLineCopy: '这条线刻意收窄：只有经得起文档、包导出与构建验证检验的表述，才会留在这里。',
    timelineAria: 'Roadmap 发布线',
    stamps: { CURRENT: '当前', NEXT: '下一个' } as Record<'CURRENT' | 'NEXT', string>,
    designRuleTitle: '设计规则',
    designRuleText:
      '默认不新增包。Auth、ORM 与存储保持为配方——openElement 拥有的是应用契约，不是服务产品。',
    boundaryIndex: '02 / 产品边界',
    boundaryTitle: '范围是明确的。',
    boundaryCopy: '当前能力、被排除的承诺与视觉契约，分开陈述。',
    inProductLabel: '产品内',
    inProductTitle: '产品内',
    inProductItems: [
      'JSX 优先的应用 API',
      'Declarative Shadow DOM 渲染',
      '路由、布局、内容、island 与 i18n',
      'loader 与 action，配合渐进增强表单',
      'action 面的 CSRF 地板',
      'Nitro 服务端输出（Node + Workers）与 SPA 模式',
      'Preact adapter，以及经 adapter-vite 提供的 Hono API 路由',
      '经过验证的包与发布边界',
    ],
    outScopeLabel: '当前范围外',
    outScopeTitle: '当前范围之外',
    outScopeItems: [
      'Hub 产品话术',
      'Registry Hub 作为当前产品承诺',
      'RPC、CEM 与互操作 adapter 包的承诺',
      '通用的 auth、ORM 或数据库平台宣称',
      '旧的包数量公开图谱话术',
    ],
    siteRuleLabel: '设计规则',
    siteRuleTitle: '设计规则',
    siteRuleText:
      '公开网站应读起来像一间 Web Standards Lab：深色优先、图示化、有用，并立足于用户可以检查的真实产物。',
    matrixIndex: '03 / 决策矩阵',
    matrixTitle: 'Roadmap 语言不越过产品边界。',
    matrixCopy: 'Ship、prove 与 freeze 是证据状态，不是营销标签。',
    shipLabel: 'Ship',
    shipCopy: '只有反映在文档、生成页面与包能力面上的公开契约。',
    proveLabel: 'Prove',
    proveCopy: '在扩大宣称之前，以 CI、构建检查与文档扫描作为发布证据。',
    freezeLabel: 'Freeze',
    freezeCopy: '当 WC 全栈框架与 Basic Element 线稳定、可读、验证起来平淡无奇之后，再迈向 v1.0。',
    visualIndex: '04 / 系统图示',
    visualTitle: '包图是发布产物的一部分。',
    visualCopy: '已发布的包归属与公开架构必须保持机械一致。',
    packageMatrixLabel: '包矩阵',
    productBoundaryMeta: '产品边界',
    releaseDisciplineLabel: '发布纪律',
    v10PostureMeta: 'v1.0 姿态',
    noDriftLabel: '不漂移',
    noDriftCopy: '营销语言、文档、包导出与 CI 门禁必须一致。',
    noGhostsLabel: '无幽灵',
    noGhostsCopy: '已归档的 Hub 时代承诺与 webpack 时代的捷径，一律留在当前公开产品线之外。',
    noFogLabel: '无迷雾',
    noFogCopy: '用户应能看懂什么是已发布、当前、规划中，以及明确排除在范围之外的。',
    changelog: '更新日志',
    deployment: '部署',
  },
};

export class RoadmapPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    const locale = contentLocale(this._getLocale('en'));
    const t = content[locale];
    const timeline = entries[locale];
    return (
      <main>
        <open-reading-shell
          rail
          footer
          metadata={JSON.stringify({
            breadcrumb: 'Project',
            title: t.pageTitle,
            lede: t.heroLede,
          })}
        >
          <open-page-rail slot='rail' items={t.railItems}></open-page-rail>

          <section id='release-line'>
            <open-section-frame>
              <span slot='index'>{t.releaseLineIndex}</span>
              <span slot='title'>{t.releaseLineTitle}</span>
              <span slot='copy'>
                {t.releaseLineCopy}
              </span>
              <div class='now-callout'>
                <open-badge tone='warning'>{t.freezeBadge}</open-badge>
                <p class='now-title'>
                  {t.nowTitle}
                </p>
                <p class='now-copy'>
                  {t.nowCopy(PUBLISHED_STABLE_VERSION)}
                </p>
              </div>
              <div class='roadmap-grid'>
                <div class='timeline' aria-label={t.timelineAria}>
                  {timeline.map((phase) => {
                    // The current-line stamp follows the bump-maintained anchor
                    // (PUBLISHED_PACKAGE_VERSION) so a release bump re-marks the
                    // timeline without manual edits.
                    const stamp = phase.version === PUBLISHED_PACKAGE_VERSION
                      ? 'CURRENT'
                      : phase.stamp;
                    return (
                      <div class={`tl-row tl-${phase.state}`}>
                        <span class='tl-node' aria-hidden='true'></span>
                        <div class='tl-head'>
                          <span class='tl-version'>{phase.version}</span>
                          {stamp
                            ? (
                              <span class={`stamp stamp-${stamp.toLowerCase()}`}>
                                {t.stamps[stamp]}
                              </span>
                            )
                            : null}
                          <span class='tl-theme'>{phase.theme}</span>
                        </div>
                        <p class='tl-copy'>{phase.copy}</p>
                        {phase.status ? <span class='tl-status'>{phase.status}</span> : null}
                      </div>
                    );
                  })}
                </div>
                <aside class='rule-callout'>
                  <p class='rule-title'>{t.designRuleTitle}</p>
                  <p class='rule-text'>
                    {t.designRuleText}
                  </p>
                </aside>
              </div>
            </open-section-frame>
          </section>

          <section id='product-boundary'>
            <open-section-frame>
              <span slot='index'>{t.boundaryIndex}</span>
              <span slot='title'>{t.boundaryTitle}</span>
              <span slot='copy'>
                {t.boundaryCopy}
              </span>
              <div class='truth-grid'>
                <open-artifact-panel class='truth'>
                  <span slot='label'>{t.inProductLabel}</span>
                  <h2>{t.inProductTitle}</h2>
                  <ul>
                    {t.inProductItems.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </open-artifact-panel>

                <open-artifact-panel class='truth'>
                  <span slot='label'>{t.outScopeLabel}</span>
                  <h2>{t.outScopeTitle}</h2>
                  <ul>
                    {t.outScopeItems.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </open-artifact-panel>

                <open-artifact-panel class='truth'>
                  <span slot='label'>{t.siteRuleLabel}</span>
                  <h2>{t.siteRuleTitle}</h2>
                  <p>
                    {t.siteRuleText}
                  </p>
                </open-artifact-panel>
              </div>
            </open-section-frame>
          </section>

          <section id='decision-matrix'>
            <open-section-frame>
              <span slot='index'>{t.matrixIndex}</span>
              <span slot='title'>{t.matrixTitle}</span>
              <span slot='copy'>
                {t.matrixCopy}
              </span>
              <div class='matrix'>
                <div class='matrix-row'>
                  <span class='metric-label'>{t.shipLabel}</span>
                  <span class='matrix-copy'>
                    {t.shipCopy}
                  </span>
                </div>
                <div class='matrix-row'>
                  <span class='metric-label'>{t.proveLabel}</span>
                  <span class='matrix-copy'>
                    {t.proveCopy}
                  </span>
                </div>
                <div class='matrix-row'>
                  <span class='metric-label'>{t.freezeLabel}</span>
                  <span class='matrix-copy'>
                    {t.freezeCopy}
                  </span>
                </div>
              </div>
            </open-section-frame>
          </section>

          <section id='system-visual'>
            <open-section-frame>
              <span slot='index'>{t.visualIndex}</span>
              <span slot='title'>{t.visualTitle}</span>
              <span slot='copy'>
                {t.visualCopy}
              </span>
              <div class='visual-grid'>
                <open-artifact-panel>
                  <span slot='label'>{t.packageMatrixLabel}</span>
                  <span slot='meta'>{t.productBoundaryMeta}</span>
                  <open-standards-visual variant='packages' emphasis='high' motion='auto'>
                  </open-standards-visual>
                </open-artifact-panel>
                <open-artifact-panel>
                  <span slot='label'>{t.releaseDisciplineLabel}</span>
                  <span slot='meta'>{t.v10PostureMeta}</span>
                  <ul class='rule-list'>
                    <li>
                      <strong class='rule-label'>{t.noDriftLabel}</strong>
                      <span class='rule-copy'>
                        {t.noDriftCopy}
                      </span>
                    </li>
                    <li>
                      <strong class='rule-label'>{t.noGhostsLabel}</strong>
                      <span class='rule-copy'>
                        {t.noGhostsCopy}
                      </span>
                    </li>
                    <li>
                      <strong class='rule-label'>{t.noFogLabel}</strong>
                      <span class='rule-copy'>
                        {t.noFogCopy}
                      </span>
                    </li>
                  </ul>
                </open-artifact-panel>
              </div>
            </open-section-frame>
          </section>

          <nav class='nav-row' slot='footer'>
            <open-button href='/architecture/architecture'>{t.architecture}</open-button>
            <open-button href='/changelog'>{t.changelog}</open-button>
            <open-button href='/guide/deployment'>{t.deployment}</open-button>
          </nav>
        </open-reading-shell>
      </main>
    );
  }
}

defineCustomElement(tagName, RoadmapPage);

export default RoadmapPage;
