---
title: '性能与基准测试'
section: 'Reference'
label: 'Performance'
order: 100
---

<open-layout navItems= headerNav= currentPath='/architecture/benchmark' locale='zh' locales='[&quot;en&quot;,&quot;zh&quot;]'>

          <h1>性能与基准测试</h1>
          <p class='subtitle'>零噪音，实测数据。</p>

          <h2>构建性能</h2>
          <div class='metric'><span class='label'>SSG 构建 (www)</span><span class='value'>~3s（37 页面，478 URL）</span></div>
          <div class='metric'><span class='label'>Vite 开发启动</span><span class='value'>~2s（deno task dev）</span></div>
          <div class='metric'><span class='label'>客户端包体积</span><span class='value'>~0 KB（仅 islands，generated data modules）</span></div>

          <h2>渲染</h2>
          <div class='metric'><span class='label'>DSD SSR</span><span class='value'>零 JS 解析成本（浏览器原生）</span></div>
          <div class='metric'><span class='label'>Island 水合</span><span class='value'>按组件、策略门控</span></div>
          <div class='metric'><span class='label'>路由切换 (SPA)</span><span class='value'>~0ms（无整页重载）</span></div>

          <h2>包体积</h2>
          <p>openElement 对 DSD 组件不输出运行时 JS。Islands 按策略按需加载。关键路径零框架运行时开销。</p>
