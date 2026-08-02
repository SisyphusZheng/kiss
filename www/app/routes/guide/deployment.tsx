export const meta = { section: 'Guide', label: 'Deployment', order: 100 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Deployment',
    lede:
      'Deployment is built around generated static output and adapter-specific runtime boundaries.',
    outline: [
      { id: 'build-tasks', label: 'Build, start, preview', level: 3 },
      { id: 'static-output', label: 'Static output', level: 3 },
      { id: 'request-time-server', label: 'Request-time server', level: 3 },
      { id: 'nitro-presets', label: 'Nitro presets', level: 3 },
      { id: 'dev-server', label: 'Dev server', level: 3 },
      { id: 'verification', label: 'Verification', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands and SSR' },
    next: { href: '/guide/testing', label: 'Testing' },
    cards: [
      {
        id: 'build-tasks',
        title: 'Build, start, preview',
        body:
          'A generated project wires three Deno tasks to the adapter CLI subpaths: deno task build runs @openelement/adapter-vite/cli/build; deno task start runs cli/start — one command that serves dist/ statically and, when dist/server/index.js exists, dispatches dynamic routes and mutations to it (port OPEN_ELEMENT_PORT or PORT, default 4173; host OPEN_ELEMENT_HOST). deno task preview is static-only and refuses to run when dist/server exists, pointing at start instead.',
      },
      {
        id: 'static-output',
        title: 'Static output',
        body: 'The docs site is generated through the SSG pipeline.',
      },
      {
        id: 'request-time-server',
        title: 'Request-time server',
        body:
          "When any route declares renderIntent: { mode: 'dynamic' }, the build also emits dist/server/index.js — a Nitro-mountable handler over the same SSR bundle — plus server-manifest.json listing the request-time routes. Pure-static builds emit neither (0.42 line, unfrozen).",
      },
      {
        id: 'nitro-presets',
        title: 'Nitro presets',
        body:
          'Nitro is the first-party production deployment adapter. Bridge the built handler into a Nitro event with createOpenElementNitroHandler from @openelement/adapter-vite/nitro-mount; both supported presets — node-server and cloudflare_module (Workers) — are proven against real Nitro output by the deno task nitro:proof:node / nitro:proof:workers gates.',
      },
      {
        id: 'dev-server',
        title: 'Dev server',
        body:
          'deno task dev runs the Vite dev server; the adapter serves the generated Hono entry through @hono/vite-dev-server, so routes, loaders and actions execute in dev against the same generated entry the build prerenders and serves.',
      },
      {
        id: 'verification',
        title: 'Verification',
        body: 'Build output should be checked before publishing or pushing release changes.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '部署',
    lede: '部署围绕生成的静态输出与 adapter 各自的运行时边界展开。',
    outline: [
      { id: 'build-tasks', label: 'Build、start、preview', level: 3 },
      { id: 'static-output', label: '静态输出', level: 3 },
      { id: 'request-time-server', label: '请求时服务器', level: 3 },
      { id: 'nitro-presets', label: 'Nitro 预设', level: 3 },
      { id: 'dev-server', label: 'Dev 服务器', level: 3 },
      { id: 'verification', label: '验证', level: 3 },
    ],
    previous: { href: '/guide/islands-and-ssr', label: 'Islands 与 SSR' },
    next: { href: '/guide/testing', label: '测试' },
    cards: [
      {
        id: 'build-tasks',
        title: 'Build、start、preview',
        body:
          '脚手架生成的项目把三个 Deno task 接到 adapter CLI 子路径：deno task build 运行 @openelement/adapter-vite/cli/build；deno task start 运行 cli/start——一条命令伺服构建产物：静态文件来自 dist/，当 dist/server/index.js 存在时，dynamic 路由与变更请求分派给它（端口取 OPEN_ELEMENT_PORT 或 PORT，默认 4173；主机取 OPEN_ELEMENT_HOST）。deno task preview 只伺服静态产物，发现 dist/server 时会拒绝运行并指向 start。',
      },
      {
        id: 'static-output',
        title: '静态输出',
        body: 'docs 站点通过 SSG 管线生成。',
      },
      {
        id: 'request-time-server',
        title: '请求时服务器',
        body:
          "当任何路由声明 renderIntent: { mode: 'dynamic' } 时,构建还会产出 dist/server/index.js——挂在同一个 SSR bundle 上、可由 Nitro 挂载的处理器——以及列出请求时路由的 server-manifest.json。纯静态构建两者都不产出(0.42 版本线,未冻结)。",
      },
      {
        id: 'nitro-presets',
        title: 'Nitro 预设',
        body:
          'Nitro 是第一方生产部署 adapter。用 @openelement/adapter-vite/nitro-mount 的 createOpenElementNitroHandler 把构建出的 handler 桥接进 Nitro event；两个受支持的预设——node-server 与 cloudflare_module（Workers）——都由 deno task nitro:proof:node / nitro:proof:workers 门禁对真实 Nitro 产物背书。',
      },
      {
        id: 'dev-server',
        title: 'Dev 服务器',
        body:
          'deno task dev 启动 Vite dev server；adapter 通过 @hono/vite-dev-server 伺服生成的 Hono 入口，routes、loader 与 action 在 dev 下运行在与构建相同的生成入口上。',
      },
      {
        id: 'verification',
        title: '验证',
        body: '发布或推送 release 变更前应检查构建产物。',
      },
    ],
  },
};

export class GuideDeploymentPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };
}

export const tagName = 'guide-deployment-page';
defineCustomElement(tagName, GuideDeploymentPage);
export default GuideDeploymentPage;
