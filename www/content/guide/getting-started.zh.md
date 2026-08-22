---
title: '快速开始'
lede: 'OpenElement 是以 Web Components 为原生契约、static-first 的应用框架。从标准 Custom Elements、pages、routes 与按需升级开始，产出可部署的 Vite/Nitro 输出。'
order: 1
---

> 当前源码线为 `{{OPENELEMENT_VERSION}}`。npm 发布线为 0.42 稳定线（dist-tag `latest`）——在未被触动的 ADR-0119 静态冻结之上，按 ADR-0122 冻结交付。

## 安装

三条命令跑起应用：

```bash
deno run -A --minimum-dependency-age 0 npm:@openelement/create my-app
cd my-app
deno task dev
```

默认 dist-tag 即 0.42 稳定线。`--minimum-dependency-age 0` 是必须的，因为 Deno 默认的 `minimumDependencyAge`（约 24h）会拒绝发布未满一天的包。

> 需要 Deno 2.8+——生成的 starter 会写入 `minimumDependencyAge` 配置键，更旧的 Deno 版本不认识该键。

## 探索

阅读 [文档](/zh/docs)、[API 参考](/zh/apilist) 与 [路线图](/zh/roadmap)，了解当前产品全貌。

## 构建

发布前运行 build、package、docs truth 与 visual smoke 门禁。
