/**
 * WWW comparison page: openElement vs alternatives.
 *
 * Honest, benchmark-free comparison of openElement against the frameworks
 * teams commonly evaluate. Each card covers architecture, rendering model,
 * developer experience, and lock-in. No invented performance numbers.
 */

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-artifact-panel.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

export const tagName = 'comparison-page';
export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    open-card {
      min-height: 100%;
    }

    open-card[variant='artifact'] {
      border-color: var(--brand);
    }

    .label {
      color: var(--brand);
      font-family: var(--font-mono);
      font-size: var(--font-size-0);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    h3 {
      margin: var(--size-2) 0 var(--size-3);
      font-size: var(--font-size-3);
    }

    p,
    li {
      color: var(--text-secondary);
      line-height: var(--font-lineheight-4);
    }

    .dim {
      margin: var(--size-1) 0;
      font-size: var(--font-size-1);
    }

    .dim .k {
      display: inline-block;
      min-width: 5.5em;
      color: var(--text-primary);
      font-weight: 600;
    }

    ul {
      padding-left: var(--size-4);
    }

    @media (max-width: 860px) {
      .comparison-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

const content = {
  en: {
    railItems:
      '[{"id":"how-to-read","label":"How to read this"},{"id":"differentiators","label":"Differentiators"},{"id":"decision-criteria","label":"Decision criteria"},{"id":"composition-path","label":"Composition path"},{"id":"evidence","label":"Evidence"},{"id":"sources","label":"Sources and review scope"}]',
    titleAccent: 'vs Alternatives',
    subtitle:
      'A conservative comparison of product direction. This page describes what each framework optimizes for; it does not invent benchmark claims. Use it to understand fit, not to rank speed.',
    panelLabel: 'framework decision surface',
    panelMeta: 'reviewed 2026-08-16',
    cards: [
      {
        label: 'openElement',
        artifact: true,
        title: 'WC-native application framework',
        rows: [
          {
            k: 'Architecture',
            v: 'Custom Elements + Declarative Shadow DOM are first-class; standard Custom Elements remain the application contract; App owns routes and rendering; Vite and Nitro are the official build path.',
          },
          {
            k: 'Rendering',
            v: 'SSG by default, DSD/shadow default, selective element upgrades, and static output with no framework JavaScript when interaction is unnecessary.',
          },
          {
            k: 'DX',
            v: 'JSX + Basic Element, defineElement / definePage / defineApp / buildApp.',
          },
          {
            k: 'Fit',
            v: 'The Web Components-native, static-first application framework for delivering DSD-first applications on a standard Custom Element contract; current scope is static-first, not generic fullstack parity with Next.js, Nuxt or SvelteKit.',
          },
          {
            k: 'Fullstack path',
            v: 'OpenElement × Supabase × Cloudflare: OpenElement owns the application UX, Supabase owns data/Auth/RLS/Storage/Realtime, Cloudflare owns edge/security/cache/async. Providers, never built-in framework features.',
          },
        ],
      },
      {
        label: 'Next.js',
        artifact: false,
        title: 'React meta-framework',
        rows: [
          {
            k: 'Architecture',
            v: 'File-based routing, React Server Components, app router, server actions.',
          },
          {
            k: 'Rendering',
            v: 'SSR / SSG / ISR, RSC streaming, client components hydrated on the client.',
          },
          { k: 'DX', v: 'React/JSX, large ecosystem, first-class on Vercel.' },
          {
            k: 'Lock-in',
            v: 'React runtime plus Next.js abstractions; platform affinity with Vercel.',
          },
        ],
      },
      {
        label: 'Nuxt',
        artifact: false,
        title: 'Vue meta-framework',
        rows: [
          {
            k: 'Architecture',
            v: 'File routing, Vue Single-File Components, Nitro server engine.',
          },
          { k: 'Rendering', v: 'SSR / SSG / ISR, hybrid rendering, client hydration.' },
          { k: 'DX', v: 'Vue SFCs, auto-imports, convention-driven.' },
          { k: 'Lock-in', v: 'Vue runtime plus Nuxt and Nitro conventions.' },
        ],
      },
      {
        label: 'SvelteKit',
        artifact: false,
        title: 'Svelte meta-framework',
        rows: [
          {
            k: 'Architecture',
            v: 'File routing, Svelte components, Vite, adapter-based deployment.',
          },
          { k: 'Rendering', v: 'SSR / SSG / CSR, progressive hydration, no virtual DOM.' },
          { k: 'DX', v: 'Svelte compiler, concise syntax, small runtime.' },
          {
            k: 'Lock-in',
            v: 'Svelte compiler/runtime; deploy adapters are swappable (lower lock-in than Next.js).',
          },
        ],
      },
      {
        label: 'Astro',
        artifact: false,
        title: 'Islands / content engine',
        rows: [
          {
            k: 'Architecture',
            v: 'File routing, multi-framework islands, content collections.',
          },
          {
            k: 'Rendering',
            v: 'Static-first, island hydration, server islands, View Transitions.',
          },
          {
            k: 'DX',
            v: '.astro components, framework-agnostic islands, Markdown/MDX.',
          },
          {
            k: 'Lock-in',
            v: 'Low — islands can be any framework; some Astro-specific component syntax.',
          },
        ],
      },
      {
        label: 'Fresh',
        artifact: false,
        title: 'Deno + Preact',
        rows: [
          {
            k: 'Architecture',
            v: 'File routing, Preact islands, Deno-native, zero build step.',
          },
          {
            k: 'Rendering',
            v: 'SSR with Preact islands; minimal client JavaScript by default.',
          },
          { k: 'DX', v: 'Preact/TypeScript, Deno runtime, no bundler config.' },
          { k: 'Lock-in', v: 'Deno runtime plus Preact; islands are Preact components.' },
        ],
      },
      {
        label: 'Lit',
        artifact: false,
        title: 'Web Components base',
        rows: [
          {
            k: 'Architecture',
            v: 'Base class for Custom Elements with reactive properties; application routing is deliberately outside its component model.',
          },
          {
            k: 'Rendering',
            v: 'Lit provides SSR tooling with server-specific authoring constraints.',
          },
          { k: 'DX', v: 'TypeScript, decorators, tagged-template rendering.' },
          {
            k: 'Lock-in',
            v: 'Low — pure standards Web Components; no framework of its own.',
          },
        ],
      },
      {
        label: 'Enhance',
        artifact: false,
        title: 'HTML-first Web Components fullstack',
        rows: [
          {
            k: 'Architecture',
            v: 'Custom Elements, file-based routes and server-side Custom Elements.',
          },
          {
            k: 'Rendering',
            v: 'SSR to Web Components, zero-JS by default, progressive enhancement.',
          },
          { k: 'DX', v: 'HTML-first, single-file components, minimal abstraction.' },
          {
            k: 'Lock-in',
            v: 'Low — standards Web Components; Enhance adds helpers, not a runtime.',
          },
        ],
      },
      {
        label: 'Stencil',
        artifact: false,
        title: 'Web Components compiler',
        rows: [
          {
            k: 'Architecture',
            v: 'Compiler that outputs standards Web Components; framework-agnostic output.',
          },
          {
            k: 'Rendering',
            v: 'Client Web Components with prerendering, lazy loading, internal virtual DOM.',
          },
          { k: 'DX', v: 'TSX, decorators, design-system oriented tooling.' },
          {
            k: 'Lock-in',
            v: 'Output is lock-in-free Web Components; authoring uses the Stencil toolchain.',
          },
        ],
      },
      {
        label: 'FAST / Web Awesome',
        artifact: false,
        title: 'Component systems',
        rows: [
          {
            k: 'Architecture',
            v: 'FAST provides Web Component authoring foundations; Web Awesome distributes a component library and design assets.',
          },
          {
            k: 'Fit',
            v: 'Choose either when your primary need is a component system. OpenElement does not replace an established design system and should be evaluated as an app framework around components.',
          },
        ],
      },
    ],
    howToRead: {
      title: 'How to read this',
      items: [
        {
          term: 'Architecture',
          body: ' — how routing, components, and the server are composed.',
        },
        {
          term: 'Rendering',
          body: ' — SSR/SSG/CSR defaults, hydration, and island strategy.',
        },
        { term: 'DX', body: ' — language, tooling, and learning curve.' },
        {
          term: 'Lock-in',
          body: ' — how tied you are to a proprietary runtime or platform versus open standards.',
        },
      ],
    },
    differentiators: {
      title: 'Three groups, three different questions',
      items: [
        {
          name: 'Lit / FAST / Stencil',
          body:
            'are component layers, not the same application contract. They author or compile Custom Elements and deliberately leave routing, data and the application loop outside their model; openElement builds its application contract on the same standard, so these compose with it rather than compete.',
        },
        {
          name: 'Astro / Fresh / Enhance',
          body:
            'are static-first or HTML-first baselines with a different durable component model — framework-specific component formats or framework-tied islands. In openElement the durable model is the standard Custom Element itself, with DSD as the default server representation.',
        },
        {
          name: 'Next / Remix / Nuxt / SvelteKit',
          body:
            'are broader framework-specific fullstack ecosystems. openElement does not claim generic parity with them; its fullstack story is an explicit, evidence-backed composition with external providers.',
        },
      ],
    },
    decision: {
      title: 'Decision criteria',
      items: [
        {
          lead: 'Choose',
          name: 'openElement',
          body:
            'when Web Components are the public integration surface and SSR output should preserve browser-native component boundaries.',
        },
        {
          lead: 'Choose',
          name: 'Astro / Enhance / Lit / Stencil',
          body:
            'when a standards-first Web Components story matters and you want to avoid a heavy application runtime.',
        },
        {
          lead: 'Choose',
          name: 'Next.js / Nuxt / SvelteKit',
          body:
            'when your product is intentionally built around a React, Vue, or Svelte application model.',
        },
        {
          lead: 'Choose',
          name: 'Fresh',
          body: 'when you want a Deno-native, near-zero-build Preact island experience.',
        },
        {
          lead: 'Do not choose',
          name: 'openElement',
          body:
            'when a mature ecosystem, a framework-specific UI runtime, or a ready-made enterprise design system is the main requirement. Alpha releases also require teams to validate the documented starter and deployment path themselves.',
        },
      ],
    },
    composition: {
      title: 'The official composition path',
      body:
        'OpenElement × Supabase × Cloudflare is the verified fullstack delivery path, with explicit ownership boundaries: OpenElement owns the application UX; Supabase owns data, Auth, RLS, Storage and Realtime; Cloudflare owns edge delivery, security, cache and async execution. Supabase and Cloudflare are composed providers — never built-in framework features — and a tier-1 boundary gate keeps provider code out of the framework packages.',
      scope:
        'Delivered in the 0.43 line together with Universal WC SSR; production-runtime recovery and cache semantics remain 0.44 work.',
      links: [
        {
          href:
            'https://github.com/open-element/openelement/blob/main/docs/integrations/supabase.md',
          text: 'Supabase recipe',
        },
        {
          href:
            'https://github.com/open-element/openelement/tree/main/examples/supabase-cloudflare-starter',
          text: 'Verified reference app',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/.github/workflows/supabase-project-smoke.yml',
          text: 'Real-project qualification workflow',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/.github/workflows/fullstack-deploy-smoke.yml',
          text: 'Real Workers deploy smoke (green run 31925944647)',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/tools/check-fullstack-boundary.ts',
          text: 'Tier-1 boundary gate',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/docs/adr/ADR-0129-response-header-channel.md',
          text: 'ADR-0129 response-header channel',
        },
      ],
    },
    evidence: {
      title: 'Evidence behind the position',
      items: [
        {
          body:
            'Custom Elements as the durable application contract — the static surface froze under ADR-0119 and the request-time application loop under ADR-0122.',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/adr/ADR-0122-0-42-0-stable-scope-freeze.md',
          text: 'ADR-0119 / ADR-0122 freezes',
        },
        {
          body:
            'DSD-first SSR with selective upgrade, and explicit foreign-WC admission — the corpus pins the observed SSR form and admission of each third-party library kind as machine-readable evidence.',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/evidence/third-party-wc-ssr-corpus.json',
          text: 'Third-party WC SSR corpus',
        },
        {
          body:
            'Browser and packaged-artifact qualification — candidate releases prove Chromium, Firefox and WebKit, and consumers build from packed public artifacts.',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/current/STACK_CONTRACT.md',
          text: 'Stack contract',
        },
        {
          body:
            'A composable provider stack instead of framework-owned Auth or database packages — verified end to end by the reference app and its real-provider smokes.',
          href:
            'https://github.com/open-element/openelement/tree/main/examples/supabase-cloudflare-starter',
          text: 'Supabase × Cloudflare reference app',
        },
      ],
    },
    sources: {
      title: 'Sources and review scope',
      body:
        'Reviewed 2026-08-16 against primary project documentation. This is a decision guide, not a benchmark or compatibility certification.',
      links: [
        { href: 'https://lit.dev/docs/', text: 'Lit documentation' },
        { href: 'https://stenciljs.com/docs/introduction', text: 'Stencil documentation' },
        {
          href: 'https://www.fast.design/docs/fast-element/getting-started',
          text: 'FAST documentation',
        },
        { href: 'https://enhance.dev/docs/', text: 'Enhance documentation' },
        {
          href: 'https://docs.astro.build/en/concepts/islands/',
          text: 'Astro islands documentation',
        },
        { href: 'https://docs.deno.com/runtime/frameworks/fresh/', text: 'Fresh documentation' },
        { href: 'https://webawesome.com/docs/', text: 'Web Awesome documentation' },
      ],
    },
  },
  zh: {
    railItems:
      '[{"id":"how-to-read","label":"如何阅读本页"},{"id":"differentiators","label":"差异点"},{"id":"decision-criteria","label":"决策标准"},{"id":"composition-path","label":"组合路径"},{"id":"evidence","label":"证据"},{"id":"sources","label":"来源与评审范围"}]',
    titleAccent: '对比主流框架',
    subtitle:
      '一份保守的产品方向对比。本页描述每个框架的优化目标，不编造 benchmark 数据。用它判断适配度，而不是给速度排名。',
    panelLabel: '框架决策面',
    panelMeta: '评审于 2026-08-16',
    cards: [
      {
        label: 'openElement',
        artifact: true,
        title: 'WC 原生应用框架',
        rows: [
          {
            k: '架构',
            v: 'Custom Elements + Declarative Shadow DOM 是一等公民；标准 Custom Elements 即应用契约；App 掌管路由与渲染；Vite 和 Nitro 是官方构建路径。',
          },
          {
            k: '渲染',
            v: '默认 SSG、默认 DSD/shadow、按需升级元素；无需交互时输出不含任何框架 JavaScript 的纯静态内容。',
          },
          {
            k: 'DX',
            v: 'JSX + Basic Element，defineElement / definePage / defineApp / buildApp。',
          },
          {
            k: '适用',
            v: '以 Web Components 为原生组件契约、static-first 的应用框架，用于以标准 Custom Element 契约交付 DSD-first 应用；当前范围是 static-first，而非与 Next.js、Nuxt 或 SvelteKit 的泛全栈对齐。',
          },
          {
            k: '全栈路径',
            v: 'OpenElement × Supabase × Cloudflare：OpenElement 负责应用 UX，Supabase 负责数据/Auth/RLS/Storage/Realtime，Cloudflare 负责边缘/安全/缓存/异步执行。它们是服务提供方，绝不是框架内建功能。',
          },
        ],
      },
      {
        label: 'Next.js',
        artifact: false,
        title: 'React 元框架',
        rows: [
          {
            k: '架构',
            v: '文件路由、React Server Components、app router、server action。',
          },
          {
            k: '渲染',
            v: 'SSR / SSG / ISR、RSC 流式渲染，client component 在客户端 hydration。',
          },
          { k: 'DX', v: 'React/JSX，生态庞大，在 Vercel 上是一等公民。' },
          {
            k: '锁定',
            v: 'React 运行时加 Next.js 抽象；与 Vercel 平台亲和。',
          },
        ],
      },
      {
        label: 'Nuxt',
        artifact: false,
        title: 'Vue 元框架',
        rows: [
          {
            k: '架构',
            v: '文件路由、Vue 单文件组件、Nitro 服务端引擎。',
          },
          { k: '渲染', v: 'SSR / SSG / ISR、混合渲染、客户端 hydration。' },
          { k: 'DX', v: 'Vue SFC、自动导入、约定驱动。' },
          { k: '锁定', v: 'Vue 运行时加 Nuxt 与 Nitro 约定。' },
        ],
      },
      {
        label: 'SvelteKit',
        artifact: false,
        title: 'Svelte 元框架',
        rows: [
          {
            k: '架构',
            v: '文件路由、Svelte 组件、Vite、基于 adapter 的部署。',
          },
          { k: '渲染', v: 'SSR / SSG / CSR、渐进 hydration、无虚拟 DOM。' },
          { k: 'DX', v: 'Svelte 编译器、语法简洁、运行时小。' },
          {
            k: '锁定',
            v: 'Svelte 编译器/运行时；部署 adapter 可替换（锁定程度低于 Next.js）。',
          },
        ],
      },
      {
        label: 'Astro',
        artifact: false,
        title: 'Islands / 内容引擎',
        rows: [
          {
            k: '架构',
            v: '文件路由、多框架 island、内容集合。',
          },
          {
            k: '渲染',
            v: 'Static-first、island hydration、server island、View Transitions。',
          },
          {
            k: 'DX',
            v: '.astro 组件、框架无关的 island、Markdown/MDX。',
          },
          {
            k: '锁定',
            v: '低——island 可以用任何框架；有少量 Astro 特有的组件语法。',
          },
        ],
      },
      {
        label: 'Fresh',
        artifact: false,
        title: 'Deno + Preact',
        rows: [
          {
            k: '架构',
            v: '文件路由、Preact island、Deno 原生、零构建步骤。',
          },
          {
            k: '渲染',
            v: 'SSR 加 Preact island；默认客户端 JavaScript 极少。',
          },
          { k: 'DX', v: 'Preact/TypeScript、Deno 运行时、无需配置 bundler。' },
          { k: '锁定', v: 'Deno 运行时加 Preact；island 即 Preact 组件。' },
        ],
      },
      {
        label: 'Lit',
        artifact: false,
        title: 'Web Components 基座',
        rows: [
          {
            k: '架构',
            v: '带响应式属性的 Custom Elements 基类；应用路由被刻意留在组件模型之外。',
          },
          {
            k: '渲染',
            v: 'Lit 提供 SSR 工具链，但有服务端特有的编写约束。',
          },
          { k: 'DX', v: 'TypeScript、decorator、tagged-template 渲染。' },
          {
            k: '锁定',
            v: '低——纯标准 Web Components；自身不带框架。',
          },
        ],
      },
      {
        label: 'Enhance',
        artifact: false,
        title: 'HTML-first 的 Web Components 全栈',
        rows: [
          {
            k: '架构',
            v: 'Custom Elements、文件路由与服务端 Custom Elements。',
          },
          {
            k: '渲染',
            v: 'SSR 输出 Web Components、默认零 JS、渐进增强。',
          },
          { k: 'DX', v: 'HTML-first、单文件组件、抽象极少。' },
          {
            k: '锁定',
            v: '低——标准 Web Components；Enhance 只加 helper，不加运行时。',
          },
        ],
      },
      {
        label: 'Stencil',
        artifact: false,
        title: 'Web Components 编译器',
        rows: [
          {
            k: '架构',
            v: '输出标准 Web Components 的编译器；产物框架无关。',
          },
          {
            k: '渲染',
            v: '客户端 Web Components，带预渲染、懒加载和内部虚拟 DOM。',
          },
          { k: 'DX', v: 'TSX、decorator、面向设计系统的工具链。' },
          {
            k: '锁定',
            v: '产物是无锁定的 Web Components；编写时使用 Stencil 工具链。',
          },
        ],
      },
      {
        label: 'FAST / Web Awesome',
        artifact: false,
        title: '组件体系',
        rows: [
          {
            k: '架构',
            v: 'FAST 提供 Web Component 编写基础设施；Web Awesome 分发组件库与设计资产。',
          },
          {
            k: '适用',
            v: '当你的首要需求是组件体系时任选其一。openElement 并不替代成熟的设计系统，应作为围绕组件的应用框架来评估。',
          },
        ],
      },
    ],
    howToRead: {
      title: '如何阅读本页',
      items: [
        { term: '架构', body: '——路由、组件与服务端如何组合。' },
        { term: '渲染', body: '——SSR/SSG/CSR 默认值、hydration 与 island 策略。' },
        { term: 'DX', body: '——语言、工具链与学习曲线。' },
        {
          term: '锁定',
          body: '——你与专有运行时或平台的绑定程度，对照开放标准。',
        },
      ],
    },
    differentiators: {
      title: '三组框架，三个不同的问题',
      items: [
        {
          name: 'Lit / FAST / Stencil',
          body:
            '是组件层，而不是同一个应用契约。它们编写或编译 Custom Elements，并刻意把路由、数据与应用闭环留在自身模型之外；openElement 在同一个标准之上构建应用契约，因此它们与之组合，而非竞争。',
        },
        {
          name: 'Astro / Fresh / Enhance',
          body:
            '是 static-first 或 HTML-first 的基线，但持久组件模型不同——框架专有的组件格式或绑定框架的 island。在 openElement 中，持久模型就是标准 Custom Element 本身，DSD 是默认服务端表示。',
        },
        {
          name: 'Next / Remix / Nuxt / SvelteKit',
          body:
            '是更宽泛的、框架专有的全栈生态。openElement 不宣称与它们的泛全栈对等；它的全栈故事是与外部服务提供方显式、有证据支撑的组合。',
        },
      ],
    },
    decision: {
      title: '决策标准',
      items: [
        {
          lead: '选择',
          name: 'openElement',
          body: '当 Web Components 是对外集成面，且 SSR 输出需要保留浏览器原生的组件边界时。',
        },
        {
          lead: '选择',
          name: 'Astro / Enhance / Lit / Stencil',
          body: '当标准优先的 Web Components 方案很重要，且想避开沉重的应用运行时时。',
        },
        {
          lead: '选择',
          name: 'Next.js / Nuxt / SvelteKit',
          body: '当你的产品明确围绕 React、Vue 或 Svelte 应用模型构建时。',
        },
        {
          lead: '选择',
          name: 'Fresh',
          body: '当你想要 Deno 原生、近乎零构建的 Preact island 体验时。',
        },
        {
          lead: '不要选择',
          name: 'openElement',
          body:
            '当主要诉求是成熟生态、框架专属 UI 运行时或现成的企业级设计系统时。Alpha 版本还要求团队自行验证文档中的 starter 与部署路径。',
        },
      ],
    },
    composition: {
      title: '官方组合路径',
      body:
        'OpenElement × Supabase × Cloudflare 是经过验证的全栈交付路径，所有权边界明确：OpenElement 负责应用 UX；Supabase 负责数据、Auth、RLS、Storage 与 Realtime；Cloudflare 负责边缘交付、安全、缓存与异步执行。Supabase 与 Cloudflare 是被组合的服务提供方——绝不是框架内建功能——tier-1 边界门禁保证服务提供方代码不进入框架包。',
      scope: '随 0.43 线与 Universal WC SSR 一同交付；生产运行时恢复与缓存语义仍是 0.44 的工作。',
      links: [
        {
          href:
            'https://github.com/open-element/openelement/blob/main/docs/integrations/supabase.md',
          text: 'Supabase 配方',
        },
        {
          href:
            'https://github.com/open-element/openelement/tree/main/examples/supabase-cloudflare-starter',
          text: '已验证的参考应用',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/.github/workflows/supabase-project-smoke.yml',
          text: '真实项目验证工作流',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/.github/workflows/fullstack-deploy-smoke.yml',
          text: '真实 Workers 部署冒烟（绿色运行 31925944647）',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/tools/check-fullstack-boundary.ts',
          text: 'tier-1 边界门禁',
        },
        {
          href:
            'https://github.com/open-element/openelement/blob/main/docs/adr/ADR-0129-response-header-channel.md',
          text: 'ADR-0129 响应头通道',
        },
      ],
    },
    evidence: {
      title: '定位背后的证据',
      items: [
        {
          body:
            'Custom Elements 作为持久的应用契约——静态面在 ADR-0119 下冻结，请求时应用闭环在 ADR-0122 下冻结。',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/adr/ADR-0122-0-42-0-stable-scope-freeze.md',
          text: 'ADR-0119 / ADR-0122 冻结',
        },
        {
          body:
            'DSD-first SSR 与选择性升级，以及显式的外来 WC 准入——语料库把每个第三方库形态的观测 SSR 输出与准入钉为机器可读证据。',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/evidence/third-party-wc-ssr-corpus.json',
          text: '第三方 WC SSR 语料库',
        },
        {
          body:
            '浏览器与打包产物验证——候选版本需要 Chromium、Firefox 与 WebKit 证明，消费方从打包的公开产物构建。',
          href:
            'https://github.com/open-element/openelement/blob/main/docs/current/STACK_CONTRACT.md',
          text: '栈契约',
        },
        {
          body:
            '可组合的服务提供方栈，而不是框架自有的 Auth 或数据库包——由参考应用与真实提供方冒烟端到端验证。',
          href:
            'https://github.com/open-element/openelement/tree/main/examples/supabase-cloudflare-starter',
          text: 'Supabase × Cloudflare 参考应用',
        },
      ],
    },
    sources: {
      title: '来源与评审范围',
      body: '2026-08-16 依据各项目一手文档评审。这是一份决策指南，不是基准测试，也不是兼容性认证。',
      links: [
        { href: 'https://lit.dev/docs/', text: 'Lit 文档' },
        { href: 'https://stenciljs.com/docs/introduction', text: 'Stencil 文档' },
        {
          href: 'https://www.fast.design/docs/fast-element/getting-started',
          text: 'FAST 文档',
        },
        { href: 'https://enhance.dev/docs/', text: 'Enhance 文档' },
        {
          href: 'https://docs.astro.build/en/concepts/islands/',
          text: 'Astro islands 文档',
        },
        { href: 'https://docs.deno.com/runtime/frameworks/fresh/', text: 'Fresh 文档' },
        { href: 'https://webawesome.com/docs/', text: 'Web Awesome 文档' },
      ],
    },
  },
} as const;

export default class ComparisonPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[contentLocale(this._getLocale('en'))];
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items={t.railItems}
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            openElement<span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>{t.subtitle}</p>

          <open-artifact-panel>
            <span slot='label'>{t.panelLabel}</span>
            <span slot='meta'>{t.panelMeta}</span>
            <div class='comparison-grid'>
              {t.cards.map((card) => (
                <open-card {...(card.artifact ? { variant: 'artifact' } : {})}>
                  <span class='label'>{card.label}</span>
                  <h3>{card.title}</h3>
                  {card.rows.map((row) => (
                    <p class='dim'>
                      <span class='k'>{row.k}</span> {row.v}
                    </p>
                  ))}
                </open-card>
              ))}
            </div>
          </open-artifact-panel>

          <h2 id='how-to-read'>{t.howToRead.title}</h2>
          <ul>
            {t.howToRead.items.map((item) => (
              <li>
                <strong>{item.term}</strong>
                {item.body}
              </li>
            ))}
          </ul>

          <h2 id='differentiators'>{t.differentiators.title}</h2>
          <ul>
            {t.differentiators.items.map((item) => (
              <li>
                <strong>{item.name}</strong> {item.body}
              </li>
            ))}
          </ul>

          <h2 id='decision-criteria'>{t.decision.title}</h2>
          <ul>
            {t.decision.items.map((item) => (
              <li>
                {item.lead} <strong>{item.name}</strong> {item.body}
              </li>
            ))}
          </ul>

          <h2 id='composition-path'>{t.composition.title}</h2>
          <p>{t.composition.body}</p>
          <p>{t.composition.scope}</p>
          <ul>
            {t.composition.links.map((link) => (
              <li>
                <a href={link.href}>{link.text}</a>
              </li>
            ))}
          </ul>

          <h2 id='evidence'>{t.evidence.title}</h2>
          <ul>
            {t.evidence.items.map((item) => (
              <li>
                {item.body} <a href={item.href}>{item.text}</a>
              </li>
            ))}
          </ul>

          <h2 id='sources'>{t.sources.title}</h2>
          <p>{t.sources.body}</p>
          <ul>
            {t.sources.links.map((link) => (
              <li>
                <a href={link.href}>{link.text}</a>
              </li>
            ))}
          </ul>
        </div>
      </open-reading-shell>
    );
  }
}

defineCustomElement(tagName, ComparisonPage);
