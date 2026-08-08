export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
export const tagName = 'engine-architecture';

import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-card';
import { OPENELEMENT_VERSION, PUBLISHED_PACKAGE_VERSION } from '../../data/version.ts';
import '@openelement/site-ui/open-section-frame.tsx';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host { display: block; }
  * { box-sizing:border-box; }
  .eyebrow { display: flex; flex-wrap: wrap; gap: var(--size-2); margin-bottom: 20px; }
  h1 { margin:0; max-width:760px; color:var(--text); font-size:clamp(3.5rem,7vw,7rem); line-height:.88; letter-spacing:-.07em; }
  h2 { margin: 0; color: var(--text); font-size: var(--font-size-display-md); line-height: 1.12; letter-spacing: 0; }
  h3 { margin: 0 0 var(--size-2); color: var(--text); }
  p { color: var(--text-secondary); line-height: var(--line-height-relaxed); }
  .lede { margin: 20px 0 0; font-size: var(--font-size-subhead); max-width: 650px; }
  .artifact, .layer-map { border:1px solid color-mix(in srgb,var(--color-border) 72%,var(--brand)); border-radius:var(--radius-2); overflow:hidden; background:color-mix(in srgb,var(--surface-1) 82%,transparent); box-shadow:inset 0 1px 0 var(--edge-highlight),0 28px 90px color-mix(in srgb,var(--violet-10) 24%,transparent); backdrop-filter:blur(18px); }
  .artifact-head { display: flex; justify-content: space-between; gap: var(--size-3); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-0); color: var(--text-muted); }
  code { font-family: var(--font-mono); }
  /* package graph: SSR node-edge diagram, no client script */
  .pkg-graph { display: grid; gap: var(--size-6); font-family: var(--font-mono); }
  .graph-note { margin: 0; color: var(--text-muted); font-size: var(--font-size-micro); font-weight: var(--font-weight-7); letter-spacing: .14em; text-transform: uppercase; }
  .graph-main { display: flex; align-items: center; gap: var(--size-2); }
  .node { padding: var(--size-2) var(--size-3); border: var(--border-size-1) solid color-mix(in srgb,var(--violet-6) 65%,transparent); border-radius: var(--radius-1); background: color-mix(in srgb,var(--violet-2) 30%,var(--bg-elevated)); }
  .node strong { display: block; color: var(--text-primary); font-size: var(--font-size-0); font-weight: var(--font-weight-8); letter-spacing: -.01em; }
  .node small { display: block; margin-block-start: var(--size-1); color: var(--text-muted); font-size: var(--font-size-micro); line-height: 1.4; }
  .node.core { border-color: var(--violet-8); background: color-mix(in srgb,var(--violet-6) 42%,var(--bg-elevated)); box-shadow: inset 0 1px 0 var(--edge-highlight), 0 12px 40px color-mix(in srgb,var(--violet-8) 28%,transparent); }
  .node.optional { border-style: dashed; background: transparent; box-shadow: none; }
  .edge { position: relative; flex: 1 1 var(--size-8); min-width: var(--size-7); height: var(--border-size-1); background: color-mix(in srgb,var(--violet-6) 80%,transparent); }
  .edge i { position: absolute; inset-block-end: var(--size-2); left: 50%; transform: translateX(-50%); color: var(--violet-8); font-size: var(--font-size-micro); font-style: normal; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
  .graph-subs { display: flex; align-items: flex-end; gap: var(--size-6); }
  .sub { display: flex; flex-direction: column; align-items: center; }
  .v-edge { position: relative; width: 0; height: var(--size-6); border-inline-start: var(--border-size-1) dashed color-mix(in srgb,var(--violet-6) 80%,transparent); }
  .v-edge i { position: absolute; inset-inline-start: var(--size-2); top: 50%; transform: translateY(-50%); color: var(--violet-8); font-size: var(--font-size-micro); font-style: normal; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
  .retired { margin: 0 0 0 auto; align-self: center; color: var(--text-muted); font-size: var(--font-size-micro); letter-spacing: .04em; }
  .layer { display: grid; grid-template-columns: auto 150px 1fr 180px; gap: var(--size-4); padding: 14px var(--size-4); border-bottom: 1px solid var(--color-border); align-items: start; }
  .clause-num { font-family: var(--font-mono); font-size: clamp(1.8rem,3vw,3rem); font-weight: var(--font-weight-8); line-height: 1; color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb,var(--violet-5) 55%,transparent); user-select: none; }
  .layer:last-child { border-bottom: 0; }
  .layer strong { color: var(--text); font-size: var(--font-size-1); }
  .layer span, .layer p { margin: 0; color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .cards, .gate-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--size-3); }
  .gate-grid { grid-template-columns: 1fr 1fr; }
  .gate { display: grid; grid-template-columns: 120px 1fr; gap: var(--size-3); align-items: start; padding: var(--size-4); border: 1px solid var(--color-border); border-radius: var(--radius-1); background: var(--surface-1); }
  .gate strong { color: var(--color-brand); font-size: var(--font-size-1); }
  .gate span { color: var(--text-secondary); font-size: var(--font-size-0); line-height: 1.55; }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; width:min(1180px,calc(100% - 4rem)); margin:var(--size-8) auto 0; }
  @media (max-width: 900px) { .cards, .gate-grid { grid-template-columns: 1fr; } .layer { grid-template-columns: 1fr; gap: var(--size-2); } h1 { font-size: var(--font-size-display-lg); line-height: 1.06; } h2 { font-size: var(--font-size-display-sm); } }
  @media (max-width: 640px) { .graph-main { flex-direction: column; align-items: stretch; } .edge { flex: none; align-self: center; width: 0; min-width: 0; height: var(--size-7); background: transparent; border-inline-start: var(--border-size-1) solid color-mix(in srgb,var(--violet-6) 80%,transparent); } .edge i { inset-block-end: auto; top: 50%; left: var(--size-2); transform: translateY(-50%); } .graph-subs { flex-direction: column; align-items: stretch; gap: var(--size-5); } .sub { align-items: center; } .retired { margin: 0; } }
  @media (max-width: 560px) { .nav-row{width:calc(100% - 2rem)} .gate { grid-template-columns: 1fr; display: grid; } }
`);

const content = {
  en: {
    heroTitle: 'Current',
    heroTitleAccent: 'Architecture',
    lede:
      'OpenElement is a Web Components-native, static-first application framework. Custom Elements are the durable component contract; JSX and Basic Element are authoring modes; Vite and Nitro are the official build and output path.',
    artifactLabel: 'package graph',
    artifactMeta: 'published line',
    graphAriaLabel:
      'Package graph: app uses element, adapter-vite builds on app, ui is optional, create ships the starter; core, signal, router, protocol, content and ssg are retired.',
    graphNote: 'Dependency direction — consumers point at what they use',
    nodeElement: 'runtime · zero framework deps',
    nodeApp: 'pages · routing',
    nodeAdapter: 'the only host side',
    edgeUses: 'uses',
    edgeBuildsOn: 'builds on',
    edgeOptional: 'optional',
    nodeUi: 'optional primitives',
    nodeCreate: 'starter · build time',
    retired: 'retired: core · signal · router · protocol · content · ssg',
    s1Index: '01 / ownership',
    s1Title: 'Deep modules hide implementation complexity.',
    s1Copy:
      'Authors use product interfaces. Renderer, router, signal, content and build-phase details stay internal until real variation proves a public seam.',
    layer1: 'One authoring surface for Custom Elements, JSX, DSD, hydration and signals.',
    layer2: 'Pages, routes, islands and render semantics for complete applications.',
    layer3:
      'Vite integration, content, static generation and deployable Nitro output behind one build boundary.',
    layer4:
      'Starter-first adoption and optional primitives; neither exposes retired implementation packages.',
    s2Index: '02 / strategic direction',
    s2Title: 'Web Components are the application architecture.',
    s2Copy:
      'The roadmap earns WC fullstack leadership through compatibility evidence, complete application loops and portable operations—not a growing package count.',
    card1Title: 'WC SSR',
    card1Body:
      'Builds will classify standard, Lit, FAST and Stencil elements for DSD, light DOM or client-only rendering with actionable diagnostics.',
    card2Title: 'Application loop',
    card2Body:
      'Routes, data, progressive forms, actions, redirects and revalidation form one deep App interface rather than separate shallow packages.',
    card3Title: 'Portable output',
    card3Body:
      'Node and Workers output is verified from packed public artifacts; cache intent and deployment diagnostics follow with the 0.43/0.44 line.',
    s3Index: '03 / release gates',
    s3Title: 'Current truth is checked mechanically.',
    s3Copy:
      'Package surface, docs truth, artifacts, critical paths and browser tests reject a return to the retired product graph.',
    gate1Strong: '5 packages',
    gate1Span: 'Current consumer surface, starter and docs agree.',
    gate2Strong: 'ADR-0122',
    gate2Span: '0.42.0 freeze proposal filed (PROPOSED); 0.41.x stays frozen under ADR-0119.',
    gate3Strong: '3 browsers',
    gate3Span: 'Candidate releases require Chromium, Firefox and WebKit proof.',
    gate4Strong: 'packed proof',
    gate4Span: 'Consumers build from public artifacts, not workspace aliases.',
    navRoadmap: 'Roadmap truth',
    navApi: 'Supported interfaces',
    navStart: 'Start building',
  },
  zh: {
    heroTitle: '当前',
    heroTitleAccent: '架构',
    lede:
      'openElement 是一个 Web Components 原生、static-first 的应用框架。Custom Elements 是持久的组件契约；JSX 与 Basic Element 是创作模式；Vite 与 Nitro 是官方构建与输出路径。',
    artifactLabel: '包依赖图',
    artifactMeta: '发布线',
    graphAriaLabel:
      '包依赖图：app 使用 element，adapter-vite 构建于 app 之上，ui 为可选，create 提供 starter；core、signal、router、protocol、content 与 ssg 已退役。',
    graphNote: '依赖方向——使用方指向其依赖',
    nodeElement: '运行时 · 零框架依赖',
    nodeApp: '页面 · 路由',
    nodeAdapter: '唯一的宿主侧',
    edgeUses: '使用',
    edgeBuildsOn: '构建于',
    edgeOptional: '可选',
    nodeUi: '可选原语',
    nodeCreate: 'starter · 构建期',
    retired: '已退役：core · signal · router · protocol · content · ssg',
    s1Index: '01 / 归属',
    s1Title: '深模块隐藏实现复杂度。',
    s1Copy:
      '作者使用产品接口。renderer、router、signal、content 与构建期细节保持内部化，直到真实的变体需求证明需要公开接缝。',
    layer1: 'Custom Elements、JSX、DSD、hydration 与 signals 的统一创作界面。',
    layer2: '面向完整应用的页面、路由、islands 与渲染语义。',
    layer3: 'Vite 集成、content、静态生成与可部署的 Nitro 输出，收敛在一个构建边界之内。',
    layer4: '以 starter 为先的采用路径与可选原语；两者都不暴露已退役的实现包。',
    s2Index: '02 / 战略方向',
    s2Title: 'Web Components 就是应用架构。',
    s2Copy:
      '路线图以兼容性证据、完整的应用闭环与可移植的运维能力赢得 WC 全栈领导地位——而不是靠不断增长的包数量。',
    card1Title: 'WC SSR',
    card1Body:
      '构建将把标准、Lit、FAST 与 Stencil 元素分类为 DSD、light DOM 或仅客户端渲染，并给出可操作的诊断。',
    card2Title: '应用闭环',
    card2Body:
      '路由、数据、渐进式表单、action、重定向与重新校验构成一个深的 App 接口，而不是一堆浅包。',
    card3Title: '可移植输出',
    card3Body:
      'Node 与 Workers 输出从打包后的公开产物验证；缓存意图与部署诊断随 0.43/0.44 线跟进。',
    s3Index: '03 / 发布门禁',
    s3Title: '当前真相由机器校验。',
    s3Copy: '包表面、文档真相、产物、关键路径与浏览器测试，共同拒绝退回已退役的产品图。',
    gate1Strong: '5 个包',
    gate1Span: '当前消费面、starter 与文档保持一致。',
    gate2Strong: 'ADR-0122',
    gate2Span: '0.42.0 冻结提案已提交（PROPOSED）；0.41.x 在 ADR-0119 下保持冻结。',
    gate3Strong: '3 个浏览器',
    gate3Span: '候选版本发布需要 Chromium、Firefox 与 WebKit 的验证。',
    gate4Strong: '打包产物验证',
    gate4Span: '消费方从公开产物构建，而不是 workspace 别名。',
    navRoadmap: '路线图真相',
    navApi: '受支持的接口',
    navStart: '开始构建',
  },
} as const;

export class ArchitecturePage extends OpenElement {
  declare locale?: string;
  static override styles = [pageSheet];

  override render() {
    const t = content[contentLocale(this._getLocale('en'))];
    return (
      <main>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>ADR-0113 / {OPENELEMENT_VERSION}</span>
          <span slot='title'>{t.heroTitle}</span>
          <span slot='title-accent'>{t.heroTitleAccent}</span>
          <span slot='lede'>{t.lede}</span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>{t.artifactLabel}</span>
            <span slot='meta'>
              {PUBLISHED_PACKAGE_VERSION} {t.artifactMeta}
            </span>
            <div
              class='pkg-graph'
              role='img'
              aria-label={t.graphAriaLabel}
            >
              <p class='graph-note' aria-hidden='true'>
                {t.graphNote}
              </p>
              <div class='graph-main' aria-hidden='true'>
                <div class='node core'>
                  <strong>element</strong>
                  <small>{t.nodeElement}</small>
                </div>
                <span class='edge'>
                  <i>{t.edgeUses}</i>
                </span>
                <div class='node'>
                  <strong>app</strong>
                  <small>{t.nodeApp}</small>
                </div>
                <span class='edge'>
                  <i>{t.edgeBuildsOn}</i>
                </span>
                <div class='node'>
                  <strong>adapter-vite</strong>
                  <small>{t.nodeAdapter}</small>
                </div>
              </div>
              <div class='graph-subs' aria-hidden='true'>
                <div class='sub'>
                  <span class='v-edge'>
                    <i>{t.edgeOptional}</i>
                  </span>
                  <div class='node optional'>
                    <strong>ui</strong>
                    <small>{t.nodeUi}</small>
                  </div>
                </div>
                <div class='sub'>
                  <span class='v-edge'></span>
                  <div class='node'>
                    <strong>create</strong>
                    <small>{t.nodeCreate}</small>
                  </div>
                </div>
                <p class='retired'>{t.retired}</p>
              </div>
            </div>
          </open-artifact-panel>
        </open-page-hero>

        <open-section-frame>
          <span slot='index'>{t.s1Index}</span>
          <span slot='title'>{t.s1Title}</span>
          <span slot='copy'>{t.s1Copy}</span>
          <div class='layer-map'>
            <div class='layer'>
              <span class='clause-num' aria-hidden='true'>§1</span>
              <strong>element</strong>
              <span>@openelement/element</span>
              <p>{t.layer1}</p>
            </div>
            <div class='layer'>
              <span class='clause-num' aria-hidden='true'>§2</span>
              <strong>application</strong>
              <span>@openelement/app</span>
              <p>{t.layer2}</p>
            </div>
            <div class='layer'>
              <span class='clause-num' aria-hidden='true'>§3</span>
              <strong>build</strong>
              <span>@openelement/adapter-vite</span>
              <p>{t.layer3}</p>
            </div>
            <div class='layer'>
              <span class='clause-num' aria-hidden='true'>§4</span>
              <strong>adoption</strong>
              <span>@openelement/create, optional ui</span>
              <p>{t.layer4}</p>
            </div>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>{t.s2Index}</span>
          <span slot='title'>{t.s2Title}</span>
          <span slot='copy'>{t.s2Copy}</span>
          <div class='cards'>
            <open-card>
              <h3 slot='header'>{t.card1Title}</h3>
              <p>{t.card1Body}</p>
            </open-card>
            <open-card>
              <h3 slot='header'>{t.card2Title}</h3>
              <p>{t.card2Body}</p>
            </open-card>
            <open-card>
              <h3 slot='header'>{t.card3Title}</h3>
              <p>{t.card3Body}</p>
            </open-card>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>{t.s3Index}</span>
          <span slot='title'>{t.s3Title}</span>
          <span slot='copy'>{t.s3Copy}</span>
          <div class='gate-grid'>
            <div class='gate'>
              <strong>{t.gate1Strong}</strong>
              <span>{t.gate1Span}</span>
            </div>
            <div class='gate'>
              <strong>{t.gate2Strong}</strong>
              <span>{t.gate2Span}</span>
            </div>
            <div class='gate'>
              <strong>{t.gate3Strong}</strong>
              <span>{t.gate3Span}</span>
            </div>
            <div class='gate'>
              <strong>{t.gate4Strong}</strong>
              <span>{t.gate4Span}</span>
            </div>
          </div>
        </open-section-frame>

        <nav class='nav-row'>
          <a
            style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            href='/roadmap'
          >
            {t.navRoadmap} {'->'}
          </a>
          <a
            style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            href='/apilist'
          >
            {t.navApi} {'->'}
          </a>
          <a
            style='color:var(--text-secondary);text-decoration:none;font-size:var(--font-size-1)'
            href='/guide/getting-started'
          >
            {t.navStart} {'->'}
          </a>
        </nav>
      </main>
    );
  }
}

defineCustomElement(tagName, ArchitecturePage);
export default ArchitecturePage;
