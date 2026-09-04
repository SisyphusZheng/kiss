/** WWW supported API reference page. */
import { definePage } from '@openelement/app';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { OPENELEMENT_VERSION } from '../data/version.ts';
import { apiReference } from '../data/_generated-api-reference.ts';
import ApiCorePage, { type ApiPackageItem } from '../components/page-apilist.tsx';

export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

type Locale = 'en' | 'zh';

/**
 * Authored bilingual presentation copy, keyed by generated package id. The
 * inventory itself (packages, subpaths, exports, anchors) is generated from
 * repository truth by tools/generate-api-reference.ts (#1158) — only prose
 * lives here, and the fail-closed projection below refuses a stale key.
 */
type AuthoredPackageCopy = {
  copy: Record<Locale, string>;
  notes: Record<Locale, string[]>;
  kind: 'core' | 'build' | 'optional';
};

const authoredCopy: Record<string, AuthoredPackageCopy> = {
  element: {
    copy: {
      en:
        'The supported Custom Element authoring surface for JSX, DSD, hydration, signals and styles.',
      zh: '受支持的 Custom Element 创作面，覆盖 JSX、DSD、hydration、signals 与样式。',
    },
    notes: {
      en: [
        'Start here for standalone element authoring.',
        'Author compiled elements as `@element`-decorated `OpenElement` classes with `@property` state; `StyleSheet` and signal helpers come from the same root.',
        '@experimental additions: the `element`/`property` decorator intrinsics (#1209) and the dangerous-key guards `isDangerousKey`, `injectPropsSafe`, `DANGEROUS_KEYS` (#1214).',
      ],
      zh: [
        '独立的元素创作从这里开始。',
        '以 `@element` 装饰的 `OpenElement` 类和 `@property` 状态创作编译元素；`StyleSheet` 与 signal 辅助函数同出包根。',
        '@experimental 新增：`element`/`property` 装饰器内在量（#1209）与危险键守卫 `isDangerousKey`、`injectPropsSafe`、`DANGEROUS_KEYS`（#1214）。',
      ],
    },
    kind: 'core',
  },
  app: {
    copy: {
      en: 'The application surface for pages, routes, islands and request/render semantics.',
      zh: '面向页面、路由、island 与请求/渲染语义的应用创作面。',
    },
    notes: {
      en: [
        'Use `definePage`, `defineIslandConfig` and `defineApp` for application authoring.',
        'The router and request-driver implementation are internal product knowledge.',
      ],
      zh: [
        '用 `definePage`、`defineIslandConfig` 与 `defineApp` 进行应用创作。',
        'router 与请求驱动的实现属于产品内部知识。',
      ],
    },
    kind: 'core',
  },
  'adapter-vite': {
    copy: {
      en: 'The official Vite, content, static-build and Nitro output adapter.',
      zh: '官方的 Vite、内容、静态构建与 Nitro 输出 adapter。',
    },
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
  create: {
    copy: {
      en: 'The installed starter and zero-context consumer entrypoint.',
      zh: '安装即用的 starter，零上下文的使用者入口。',
    },
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
  ui: {
    copy: {
      en: 'Optional primitives retained only when they have demonstrated reusable behavior.',
      zh: '可选原语，仅在已证明行为可复用时保留。',
    },
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
};

/**
 * Project the generated inventory against the authored copy. A package with
 * no authored copy — or authored copy for a package the truth no longer
 * lists — fails the build instead of silently drifting (#1158).
 */
function projectPackages(): Array<{
  id: string;
  name: string;
  importPath: string;
  supportedSubpaths: readonly string[];
  internalSubpaths: readonly string[];
  authored: AuthoredPackageCopy;
}> {
  const generatedIds = new Set<string>();
  const projected = apiReference.packages.map((pkg) => {
    generatedIds.add(pkg.id);
    const authored = authoredCopy[pkg.id];
    if (!authored) {
      throw new Error(
        `apilist: generated package '${pkg.id}' has no authored bilingual copy in www/app/routes/apilist.tsx`,
      );
    }
    return {
      id: pkg.id,
      name: pkg.name,
      importPath: pkg.importPath,
      supportedSubpaths: pkg.supportedSubpaths,
      internalSubpaths: pkg.internalSubpaths,
      authored,
    };
  });
  for (const id of Object.keys(authoredCopy)) {
    if (!generatedIds.has(id)) {
      throw new Error(
        `apilist: authored copy for '${id}' has no generated package — remove the stale entry`,
      );
    }
  }
  return projected;
}

const kindLabels = {
  en: { core: 'CORE', build: 'BUILD', optional: 'OPTIONAL' },
  zh: { core: '核心', build: '构建', optional: '可选' },
} as const;

/** Subpath display labels projected into the fixed chip grammar (5 slots). */
function subpathChips(supportedSubpaths: readonly string[]): string[] {
  const labels = supportedSubpaths.map((subpath) => subpath === '.' ? 'root' : subpath);
  if (labels.length <= 5) return labels;
  return [...labels.slice(0, 4), `+${labels.length - 4} more`];
}

const content = {
  en: {
    pageTitle: 'API Reference',
    lede: (v: string) =>
      `The ${v} current line documents only the five consumer packages. Retired alpha packages and internal subpaths are not authoring surfaces.`,
    s1Index: '01 / interface rule',
    s1Title: 'Authoring starts at product packages.',
    s1Copy:
      'Current documentation, starters and dogfood use the five supported interfaces. Loader, action and form semantics are frozen at 0.42.0 (ADR-0122); framework session, active cache and streaming are outside the current contract and have no assigned version.',
    s2Index: '02 / supported surface',
    s2Title: 'Five products, one application path.',
    s2Copy:
      'Each package owns a distinct consumer decision; absorbed implementation packages remain private.',
    headPackage: 'Package',
    headSubpaths: 'Supported subpaths',
    headKind: 'Kind',
    footnote: (v: string) =>
      `※ Internal subpaths (app/i18n, adapter-vite build pipeline, element hydration modules) stay importable for tooling but carry no compatibility promise. The public type surface is explicit — no export-star seams on the ${v} line.`,
    footnoteCheckPre: 'Generated from repository truth by ',
    footnoteCheckPost: " and machine-checked against each package's exports map.",
  },
  zh: {
    pageTitle: 'API 参考',
    lede: (v: string) =>
      `${v} 当前线只记录五个面向使用者的包。已退役的 alpha 包与内部子路径都不是创作面。`,
    s1Index: '01 / 接口规则',
    s1Title: '创作从产品包开始。',
    s1Copy:
      '当前文档、starter 与 dogfood 都使用这五个受支持的接口。Loader、action 与表单语义已在 0.42.0 冻结（ADR-0122）；框架 session、active cache 与 streaming 不在当前契约内，且尚未分配版本。',
    s2Index: '02 / 受支持的产品面',
    s2Title: '五个产品，一条应用路径。',
    s2Copy: '每个包对应一个明确的使用者决策；被吸收的实现包保持私有。',
    headPackage: '包',
    headSubpaths: '受支持的子路径',
    headKind: '类别',
    footnote: (v: string) =>
      `※ 内部子路径（app/i18n、adapter-vite 构建管线、element hydration 模块）仍可被工具导入，但不携带兼容性承诺。公开类型面是显式的——${v} 线上没有 export-star 缝隙。`,
    footnoteCheckPre: '由 ',
    footnoteCheckPost: ' 从仓库真值生成，并对照每个包的 exports map 做机器校验。',
  },
} as const;

export default definePage(ApiCorePage, {
  props({ locale }) {
    const resolved: Locale = contentLocale(locale ?? 'en');
    const t = content[resolved];
    const kinds = kindLabels[resolved];
    const packages = projectPackages();
    const projectPackage = (pkg: (typeof packages)[number]): ApiPackageItem => {
      const chips = subpathChips(pkg.supportedSubpaths);
      const internal = new Set(pkg.internalSubpaths);
      const chip = (index: number): string => {
        const label = chips[index] ?? '';
        return label && internal.has(label === 'root' ? '.' : label) ? `${label}※` : label;
      };
      return {
        id: pkg.id,
        name: pkg.name,
        importPath: pkg.importPath,
        copy: pkg.authored.copy[resolved],
        note1: pkg.authored.notes[resolved][0] ?? '',
        note2: pkg.authored.notes[resolved][1] ?? '',
        note3: pkg.authored.notes[resolved][2] ?? '',
        export1: chip(0),
        export2: chip(1),
        export3: chip(2),
        export4: chip(3),
        export5: chip(4),
        kind: pkg.authored.kind,
        kindClass: `kind kind-${pkg.authored.kind}`,
        kindLabel: kinds[pkg.authored.kind],
      };
    };
    return {
      metadata: {
        breadcrumb: 'Reference',
        title: t.pageTitle,
        lede: t.lede(OPENELEMENT_VERSION),
      },
      railItems: packages.map((pkg) => ({
        id: pkg.id,
        href: `#${pkg.id}`,
        label: pkg.name,
        depth: '3',
      })),
      s1Index: t.s1Index,
      s1Title: t.s1Title,
      s1Copy: t.s1Copy,
      s2Index: t.s2Index,
      s2Title: t.s2Title,
      s2Copy: t.s2Copy,
      headPackage: t.headPackage,
      headSubpaths: t.headSubpaths,
      headKind: t.headKind,
      footnote: t.footnote(OPENELEMENT_VERSION),
      footnoteCheckPre: t.footnoteCheckPre,
      footnoteCheckPost: t.footnoteCheckPost,
      packages: packages.map(projectPackage),
    };
  },
});
