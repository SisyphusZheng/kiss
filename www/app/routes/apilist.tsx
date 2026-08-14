/** WWW supported API reference page. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { OPENELEMENT_VERSION } from '../data/version.ts';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host { display: block; color: var(--text-primary); }
  * { box-sizing: border-box; }
  p { margin: 0; }

  /* registry table: hairline rows, display-grade package names */
  .registry { border-block-start: var(--border-size-1) solid var(--border); }
  .registry-head, .pkg-row {
    display: grid;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1fr) auto;
    gap: clamp(1rem, 4vw, 3rem);
    align-items: start;
  }
  .registry-head {
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
    color: var(--text-muted);
    font-size: var(--font-size-micro);
    font-weight: var(--font-weight-7);
    letter-spacing: .18em;
    text-transform: uppercase;
  }
  .pkg-row { padding-block: var(--size-6); border-block-end: var(--border-size-1) solid var(--border); }
  .pkg-name {
    display: block;
    color: var(--violet-8);
    font-size: clamp(1.7rem, 2.8vw, 2.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.03em;
  }
  .pkg-row[data-kind='optional'] .pkg-name { color: var(--text-secondary); }
  .pkg-path { display: block; margin-block-start: var(--size-2); color: var(--text-muted); font-size: var(--font-size-00); }
  .pkg-copy { margin-block-start: var(--size-3); color: var(--text-secondary); font-size: var(--font-size-0); line-height: var(--font-lineheight-3); }
  .pkg-note { display: block; margin-block-start: var(--size-2); color: var(--text-muted); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); }
  .pkg-chips { display: flex; flex-wrap: wrap; gap: var(--size-2); }
  .chip {
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    background: var(--violet-2);
    color: var(--violet-8);
    font-size: var(--font-size-00);
  }
  .kind {
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .kind-core { background: var(--brand); color: var(--on-brand); }
  .kind-build {
    background: var(--violet-2);
    color: var(--violet-8);
    box-shadow: inset 0 0 0 var(--border-size-1) color-mix(in srgb, var(--violet-5) 55%, transparent);
  }
  .kind-optional {
    border: var(--border-size-1) dashed color-mix(in srgb, var(--violet-5) 65%, transparent);
    color: var(--text-secondary);
  }
  .footnote { padding-block-start: var(--size-6); color: var(--text-muted); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); }
  .footnote p + p { margin-block-start: var(--size-3); }
  .footnote code { color: var(--violet-8); }

  @media (max-width: 860px) {
    .registry-head { display: none; }
    .pkg-row { grid-template-columns: 1fr; gap: var(--size-3); }
    .kind { justify-self: start; }
  }
`);

type Locale = 'en' | 'zh';

type ApiPackage = {
  id: string;
  name: string;
  copy: Record<Locale, string>;
  importPath: string;
  exports: string[];
  /** Subpaths importable for tooling but carrying no compatibility promise (marked ※). */
  internalExports?: string[];
  notes: Record<Locale, string[]>;
  kind: 'core' | 'build' | 'optional';
};

const kindLabels = {
  en: { core: 'CORE', build: 'BUILD', optional: 'OPTIONAL' },
  zh: { core: '核心', build: '构建', optional: '可选' },
} as const;

const packages: ApiPackage[] = [
  {
    id: 'element',
    name: 'element',
    copy: {
      en:
        'The supported Custom Element authoring surface for JSX, DSD, hydration, signals and styles.',
      zh: '受支持的 Custom Element 创作面，覆盖 JSX、DSD、hydration、signals 与样式。',
    },
    importPath: '@openelement/element',
    exports: ['root', 'jsx-runtime', 'jsx-dev-runtime', 'build-utils', 'sanitize'],
    notes: {
      en: [
        'Start here for standalone element authoring.',
        'Use `defineElement`, `OpenElement`, `StyleSheet` and signal helpers without importing renderer internals.',
        'Keyed lists: `<For each={items} key={fn}>{(item) => ...}</For>` is exported from the root.',
      ],
      zh: [
        '独立的元素创作从这里开始。',
        '直接使用 `defineElement`、`OpenElement`、`StyleSheet` 与 signal 辅助函数，无需引入 renderer 内部实现。',
        '键控列表：`<For each={items} key={fn}>{(item) => ...}</For>` 从包根导出。',
      ],
    },
    kind: 'core',
  },
  {
    id: 'app',
    name: 'app',
    copy: {
      en: 'The application surface for pages, routes, islands and request/render semantics.',
      zh: '面向页面、路由、island 与请求/渲染语义的应用创作面。',
    },
    importPath: '@openelement/app',
    exports: ['root', 'model', 'spa', 'i18n', 'preact'],
    internalExports: ['i18n'],
    notes: {
      en: [
        'Use `definePage`, `defineIsland` and `defineApp` for application authoring.',
        'The router and request-driver implementation are internal product knowledge.',
      ],
      zh: [
        '用 `definePage`、`defineIsland` 与 `defineApp` 进行应用创作。',
        'router 与请求驱动的实现属于产品内部知识。',
      ],
    },
    kind: 'core',
  },
  {
    id: 'adapter-vite',
    name: 'adapter-vite',
    copy: {
      en: 'The official Vite, content, static-build and Nitro output adapter.',
      zh: '官方的 Vite、内容、静态构建与 Nitro 输出 adapter。',
    },
    importPath: '@openelement/adapter-vite',
    exports: ['root', 'nitro-mount', 'cli/build', 'cli/start', 'sitemap'],
    notes: {
      en: [
        'Use `buildApp()` or the generated build task.',
        'Plugin ordering, manifests and content scans are adapter implementation details.',
      ],
      zh: [
        '使用 `buildApp()` 或生成的构建任务。',
        '插件顺序、manifest 与内容扫描属于 adapter 的实现细节。',
      ],
    },
    kind: 'build',
  },
  {
    id: 'create',
    name: 'create',
    copy: {
      en: 'The installed starter and zero-context consumer entrypoint.',
      zh: '安装即用的 starter，零上下文的使用者入口。',
    },
    importPath: 'npm:@openelement/create',
    exports: ['root', 'CLI only'],
    notes: {
      en: [
        'Generated projects expose `dev`, `check`, `test`, `build`, `start` and `preview`.',
        'The starter imports product packages only.',
      ],
      zh: [
        '生成的项目暴露 `dev`、`check`、`test`、`build`、`start` 与 `preview`。',
        'starter 只导入产品包。',
      ],
    },
    kind: 'build',
  },
  {
    id: 'ui',
    name: 'ui',
    copy: {
      en: 'Optional primitives retained only when they have demonstrated reusable behavior.',
      zh: '可选原语，仅在已证明行为可复用时保留。',
    },
    importPath: '@openelement/ui',
    exports: ['root', 'retained primitive subpaths'],
    notes: {
      en: [
        'UI is not required to use OpenElement.',
        'Website-specific brand, hero, lab and layout artifacts are not UI package contracts.',
      ],
      zh: [
        '使用 OpenElement 不依赖 UI 包。',
        '网站特有的品牌、hero、lab 与布局工件不属于 UI 包的契约。',
      ],
    },
    kind: 'optional',
  },
];

const content = {
  en: {
    eyebrow: 'API Reference — surface registry',
    title: 'FIVE-PACKAGE',
    titleAccent: 'surface.',
    lede: (v: string) =>
      `The ${v} current line documents only the five consumer packages. Retired alpha packages and internal subpaths are not authoring surfaces.`,
    artifactLabel: 'five-package surface',
    artifactCopy:
      'Element, App and Build interfaces stay small so authors do not need renderer, protocol, router or build-phase internals.',
    startBuilding: 'Start building',
    s1Index: '01 / interface rule',
    s1Title: 'Authoring starts at product packages.',
    s1Copy:
      'Current documentation, starters and dogfood use the five supported interfaces. Load, action, form and revalidation capabilities are frozen at 0.42.0 (ADR-0122) — session, cache and streaming remain 0.43/0.44 roadmap work.',
    s2Index: '02 / supported surface',
    s2Title: 'Five products, one application path.',
    s2Copy:
      'Each package owns a distinct consumer decision; absorbed implementation packages remain private.',
    headPackage: 'Package',
    headSubpaths: 'Supported subpaths',
    headKind: 'Kind',
    footnote: (v: string) =>
      `※ Internal subpaths (app/i18n, adapter-vite build pipeline, element hydration modules) stay importable for tooling but carry no compatibility promise. The public type surface is explicit — no export-star seams on the ${v} line.`,
    footnoteCheckPre: "Machine-checked against each package's exports map by ",
    footnoteCheckPost: '.',
  },
  zh: {
    eyebrow: 'API 参考 —— 产品面注册表',
    title: '五包',
    titleAccent: '产品面。',
    lede: (v: string) =>
      `${v} 当前线只记录五个面向使用者的包。已退役的 alpha 包与内部子路径都不是创作面。`,
    artifactLabel: '五包产品面',
    artifactCopy:
      'Element、App 与 Build 的接口保持小巧，作者无需了解 renderer、protocol、router 或构建阶段的内部实现。',
    startBuilding: '开始构建',
    s1Index: '01 / 接口规则',
    s1Title: '创作从产品包开始。',
    s1Copy:
      '当前文档、starter 与 dogfood 都使用这五个受支持的接口。Load、action、表单与 revalidation 能力已在 0.42.0 冻结（ADR-0122）——session、cache 与 streaming 仍是 0.43/0.44 的 roadmap 工作。',
    s2Index: '02 / 受支持的产品面',
    s2Title: '五个产品，一条应用路径。',
    s2Copy: '每个包对应一个明确的使用者决策；被吸收的实现包保持私有。',
    headPackage: '包',
    headSubpaths: '受支持的子路径',
    headKind: '类别',
    footnote: (v: string) =>
      `※ 内部子路径（app/i18n、adapter-vite 构建管线、element hydration 模块）仍可被工具导入，但不携带兼容性承诺。公开类型面是显式的——${v} 线上没有 export-star 缝隙。`,
    footnoteCheckPre: '由 ',
    footnoteCheckPost: ' 对照每个包的 exports map 做机器校验。',
  },
} as const;

export class ApiCorePage extends OpenElement {
  static override styles = [routeSheet];
  override render() {
    const locale: Locale = contentLocale(this._getLocale('en'));
    const t = content[locale];
    const kinds = kindLabels[locale];
    return (
      <main>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>{t.eyebrow}</span>
          <span slot='title'>{t.title}</span>
          <span slot='title-accent'>{t.titleAccent}</span>
          <span slot='lede'>{t.lede(OPENELEMENT_VERSION)}</span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>{t.artifactLabel}</span>
            <span slot='meta'>{OPENELEMENT_VERSION}</span>
            <p>{t.artifactCopy}</p>
            <open-button href='/guide/getting-started'>{t.startBuilding}</open-button>
          </open-artifact-panel>
        </open-page-hero>
        <open-section-frame>
          <span slot='index'>{t.s1Index}</span>
          <span slot='title'>{t.s1Title}</span>
          <span slot='copy'>{t.s1Copy}</span>
        </open-section-frame>
        <open-section-frame>
          <span slot='index'>{t.s2Index}</span>
          <span slot='title'>{t.s2Title}</span>
          <span slot='copy'>{t.s2Copy}</span>
          <div class='registry'>
            <div class='registry-head' aria-hidden='true'>
              <span>{t.headPackage}</span>
              <span>{t.headSubpaths}</span>
              <span>{t.headKind}</span>
            </div>
            {packages.map((pkg) => (
              <div class='pkg-row' id={pkg.id} data-kind={pkg.kind}>
                <div>
                  <span class='pkg-name'>{pkg.name}</span>
                  <span class='pkg-path'>{pkg.importPath}</span>
                  <p class='pkg-copy'>{pkg.copy[locale]}</p>
                  {pkg.notes[locale].map((note) => <span class='pkg-note' key={note}>{note}</span>)}
                </div>
                <div class='pkg-chips'>
                  {pkg.exports.map((entry) => (
                    <span class='chip' key={entry}>
                      {entry}
                      {pkg.internalExports?.includes(entry) ? '※' : ''}
                    </span>
                  ))}
                </div>
                <span class={`kind kind-${pkg.kind}`}>{kinds[pkg.kind]}</span>
              </div>
            ))}
            <footer class='footnote'>
              <p>{t.footnote(OPENELEMENT_VERSION)}</p>
              <p>
                {t.footnoteCheckPre}
                <code>deno task package-surface:check</code>
                {t.footnoteCheckPost}
              </p>
            </footer>
          </div>
        </open-section-frame>
      </main>
    );
  }
}

defineCustomElement(tagName, ApiCorePage);
export default ApiCorePage;
