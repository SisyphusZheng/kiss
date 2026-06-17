---
title: openElement 与竞品对比
section: Principles
label: Comparison
order: 20
---

<h1>openElement 与竞品对比</h1>
<p class="subtitle">
openElement 当前是 DSD-first Web Components 应用框架。与同级框架的对比基于 DSD/WC 引擎、
渐进 island 和 Registry evidence pipeline。
</p>

<div class="table-wrap">
<table>
<thead>
<tr>
<th scope="col">维度</th>
<th scope="col" class="openElement-col">openElement</th>
<th scope="col">Astro</th>
<th scope="col">Fresh (Deno)</th>
<th scope="col">Next.js</th>
</tr>
</thead>
<tbody>
<tr>
<td>定位</td>
<td class="openElement-col">DSD-first WC 应用框架</td>
<td>全栈（多框架）</td>
<td>全栈（Preact）</td>
<td>全栈（React）</td>
</tr>
<tr>
<td>Runtime</td>
<td class="openElement-col">Deno</td>
<td>Node.js</td>
<td>Deno</td>
<td>Node.js</td>
</tr>
<tr>
<td>首屏 JS</td>
<td class="openElement-col"><span class="tag-yes">0 KB</span></td>
<td><span class="tag-yes">0 KB</span></td>
<td><span class="tag-no">~23 KB</span></td>
<td><span class="tag-no">~90 KB</span></td>
</tr>
<tr>
<td>WC 原生</td>
<td class="openElement-col"><span class="tag-yes">DSD 一等公民</span></td>
<td><span class="tag-no">当普通元素</span></td>
<td><span class="tag-no">Preact-only</span></td>
<td><span class="tag-no">否</span></td>
</tr>
<tr>
<td>跨框架</td>
<td class="openElement-col">Lit / React / Vanilla 共存</td>
<td>多框架共存</td>
<td>Preact</td>
<td>React</td>
</tr>
<tr>
<td>Rendering</td>
<td class="openElement-col">SSG + DSD + OpenElement + Islands (ISR next)</td>
<td>SSG + SSR + Islands</td>
<td>SSR + Islands</td>
<td>SSR + RSC + SSG</td>
</tr>
<tr>
<td>Registry / Hub</td>
<td class="openElement-col"><span class="tag-no">已移出当前产品图谱</span></td>
<td><span class="tag-no">否</span></td>
<td><span class="tag-no">否</span></td>
<td><span class="tag-no">否</span></td>
</tr>
<tr>
<td>Server</td>
<td class="openElement-col">Hono + Serverless</td>
<td>Built-in + adapters</td>
<td>Oak (optional)</td>
<td>Next.js server</td>
</tr>
<tr>
<td>组件模型</td>
<td class="openElement-col">3-layer (DSD/Island) + 多适配器</td>
<td>Islands only</td>
<td>Islands only</td>
<td>Full hydration</td>
</tr>
<tr>
<td>渲染时机</td>
<td class="openElement-col">SSG / ISR 规划中 / SSR 规划中</td>
<td>SSG / SSR</td>
<td>SSR</td>
<td>SSR / SSG</td>
</tr>
<tr>
<td>Ecosystem</td>
<td class="openElement-col"><span class="tag-partial">Emerging</span></td>
<td>Mature</td>
<td><span class="tag-partial">Small</span></td>
<td>Massive</td>
</tr>
<tr>
<td>Package Registry</td>
<td class="openElement-col">JSR</td>
<td>npm</td>
<td>JSR + npm</td>
<td>npm</td>
</tr>
</tbody>
</table>
</div>

<h2>openElement 三支柱差异化</h2>
<ul>
<li><strong>支柱 2 独有价值</strong> - DSD 零 runtime 首屏。Astro 不做 WC 原生，Fresh 不做 DSD，Next 必须加载 React runtime。浏览器原生能力，无法通过工程优化追平</li>
<li><strong>支柱 2+3 组合</strong> - 渲染引擎 + Registry 一体。安装即渲染，验证即分层</li>
<li><strong>支柱 1 差异</strong> - WC 原生全栈。不是"全栈框架 + WC 容忍"，而是"WC 是一等公民"</li>
</ul>

<h2>openElement 不优化的方向</h2>
<ul>
<li><strong>大而全的元框架</strong> - openElement 三支柱各有独立价值，不是什么都做的平台</li>
<li><strong>npm 生态优先</strong> - JSR-only 包分发对 npm 用户需要额外配置</li>
<li><strong>旧浏览器兼容</strong> - 需要 DSD 支持的浏览器（Chrome 90+、Safari 16.4+、Firefox 123+）</li>
</ul>
