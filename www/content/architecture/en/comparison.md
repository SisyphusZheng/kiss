---
title: openElement vs Alternatives
section: Principles
label: Comparison
order: 20
---

<h1>openElement vs Alternatives</h1>
<p class="subtitle">
openElement is a DSD-first Web Components application framework. This comparison
against peer frameworks is based on DSD/WC engine, progressive islands, and
the Registry evidence pipeline.
</p>

<div class="table-wrap">
<table>
<thead>
<tr>
<th scope="col">Dimension</th>
<th scope="col" class="openElement-col">openElement</th>
<th scope="col">Astro</th>
<th scope="col">Fresh (Deno)</th>
<th scope="col">Next.js</th>
</tr>
</thead>
<tbody>
<tr>
<td>Positioning</td>
<td class="openElement-col">DSD-first WC Framework</td>
<td>Full-stack (multi)</td>
<td>Full-stack (Preact)</td>
<td>Full-stack (React)</td>
</tr>
<tr>
<td>Runtime</td>
<td class="openElement-col">Deno</td>
<td>Node.js</td>
<td>Deno</td>
<td>Node.js</td>
</tr>
<tr>
<td>First-paint JS</td>
<td class="openElement-col"><span class="tag-yes">0 KB</span></td>
<td><span class="tag-yes">0 KB</span></td>
<td><span class="tag-no">~23 KB</span></td>
<td><span class="tag-no">~90 KB</span></td>
</tr>
<tr>
<td>WC Native</td>
<td class="openElement-col"><span class="tag-yes">DSD first-class</span></td>
<td><span class="tag-no">Plain elements</span></td>
<td><span class="tag-no">Preact-only</span></td>
<td><span class="tag-no">No</span></td>
</tr>
<tr>
<td>Cross-framework</td>
<td class="openElement-col">Lit / React / Vanilla coexist</td>
<td>Multiple frameworks coexist</td>
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
<td class="openElement-col"><span class="tag-no">Deferred outside current product graph</span></td>
<td><span class="tag-no">No</span></td>
<td><span class="tag-no">No</span></td>
<td><span class="tag-no">No</span></td>
</tr>
<tr>
<td>Server</td>
<td class="openElement-col">Hono + Serverless</td>
<td>Built-in + adapters</td>
<td>Oak (optional)</td>
<td>Next.js server</td>
</tr>
<tr>
<td>Component Model</td>
<td class="openElement-col">3-layer (DSD/Island) + multi-adapter</td>
<td>Islands only</td>
<td>Islands only</td>
<td>Full hydration</td>
</tr>
<tr>
<td>Render Timing</td>
<td class="openElement-col">SSG / ISR (planned) / SSR (planned)</td>
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
<td class="openElement-col">npm</td>
<td>npm</td>
<td>JSR + npm</td>
<td>npm</td>
</tr>
</tbody>
</table>
</div>

<h2>openElement Three-Pillar Differentiation</h2>
<ul>
<li><strong>Pillar 2 Unique Value</strong> - DSD zero-runtime first paint. Astro doesn't do WC native, Fresh doesn't do DSD, Next must load React runtime. Browser-native capability, cannot be matched through engineering optimization.</li>
<li><strong>Pillar 2+3 Combination</strong> - Rendering engine + Registry in one. Install and render, validate and tier.</li>
<li><strong>Pillar 1 Difference</strong> - WC-native full-stack. Not a "full-stack framework + WC tolerance", but "WC is first-class".</li>
</ul>

<h2>What openElement Does Not Optimize For</h2>
<ul>
<li><strong>All-in-one meta-framework</strong> - openElement's three pillars each have independent value, not a platform that does everything.</li>
<li><strong>Legacy browser support</strong> - Requires browsers with DSD support (Chrome 90+, Safari 16.4+, Firefox 123+).</li>
</ul>
