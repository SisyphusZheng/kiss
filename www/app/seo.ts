/**
 * Authored bilingual SEO copy for route-level (non-collection) pages (#1307).
 *
 * Content routes (guide/architecture/blog) derive their head metadata from
 * the drift-gated content graph; the pages below have no collection entry,
 * so their title/description are authored here and applied to the built
 * shell by tools/apply-www-seo.ts (fail-closed: a built page without an
 * entry — or an entry without a built page — fails the build).
 */

export interface RouteSeoCopy {
  title: string;
  description: string;
}

export const routeSeo: Record<string, Record<'en' | 'zh', RouteSeoCopy>> = {
  '/': {
    en: {
      title: 'openElement — The Web, composed.',
      description:
        'OpenElement is a Web Components-native, static-first application framework built on Custom Elements, Declarative Shadow DOM and selective islands.',
    },
    zh: {
      title: 'openElement — 组合而生的 Web。',
      description:
        'openElement 是一个 Web Components 原生、静态优先的应用框架，构建于 Custom Elements、Declarative Shadow DOM 与按需 islands 之上。',
    },
  },
  '/docs': {
    en: {
      title: 'Documentation',
      description:
        'openElement documentation: guides, architecture notes and the supported public surface of the five consumer packages.',
    },
    zh: {
      title: '文档',
      description: 'openElement 文档：指南、架构说明，以及五个面向使用者包的受支持公开面。',
    },
  },
  '/apilist': {
    en: {
      title: 'API Reference',
      description:
        'The supported openElement API surface: five consumer packages, every documented export and every custom element, generated from repository truth.',
    },
    zh: {
      title: 'API 参考',
      description:
        'openElement 受支持的 API 面：五个产品包、全部记录在案的导出与 Custom Element，由仓库真值生成。',
    },
  },
  '/blog': {
    en: {
      title: 'Blog — Dispatches',
      description:
        'The openElement public audit trail: releases, architecture decisions and standards notes, published in their original language.',
    },
    zh: {
      title: '博客 — 通讯',
      description: 'openElement 的公开审计轨迹：发布记录、架构决策与标准说明，以原始语言发布。',
    },
  },
  '/roadmap': {
    en: {
      title: 'Roadmap',
      description:
        'The openElement roadmap: the current v0.44 beta line, the stable 0.43 maintenance baseline and the gated path to v1.0.',
    },
    zh: {
      title: '路线图',
      description:
        'openElement 路线图：当前的 v0.44 beta 线、0.43 稳定维护基线，以及通往 v1.0 的门禁路径。',
    },
  },
  '/changelog': {
    en: {
      title: 'Changelog',
      description:
        'Published, candidate, withdrawn and historical release evidence for openElement — every line evidenced.',
    },
    zh: {
      title: '更新日志',
      description: 'openElement 已发布、候选、已撤回与历史版本的发布证据——每一行皆有证据。',
    },
  },
  '/contributing': {
    en: {
      title: 'Contributing',
      description:
        'A precise, Deno-first contributor workflow for the openElement Web Standards Lab: setup, PR checklist and where to help.',
    },
    zh: {
      title: '贡献指南',
      description:
        '面向 openElement Web Standards Lab 的精确、Deno 优先的贡献者工作流：环境设置、PR 清单与入手方向。',
    },
  },
  '/404': {
    en: {
      title: '404 — Page not found',
      description:
        'The requested openElement page does not exist. Head back to the documentation or the homepage.',
    },
    zh: {
      title: '404 — 页面未找到',
      description: '请求的 openElement 页面不存在。返回文档或首页继续浏览。',
    },
  },
  '/probe-light': {
    en: {
      title: 'Light-root probe',
      description:
        'Internal end-to-end probe route for the compiled light-root rendering path; not a public surface.',
    },
    zh: {
      title: 'Light-root 探针',
      description: '编译型 light-root 渲染路径的内部端到端探针路由；非公开页面。',
    },
  },
};
