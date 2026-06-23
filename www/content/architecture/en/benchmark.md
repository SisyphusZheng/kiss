---
title: 'Performance & Benchmarks'
section: 'Reference'
label: 'Performance'
order: 100
---

<open-layout navItems= headerNav= currentPath='/architecture/benchmark'>

          <h1>Performance &amp; Benchmarks</h1>
          <p class='subtitle'>Zero-noise. What we actually measure.</p>

          <h2>Build Performance</h2>
          <div class='metric'><span class='label'>SSG build (www)</span><span class='value'>~3s (37 pages, 478 URLs)</span></div>
          <div class='metric'><span class='label'>Vite dev start</span><span class='value'>~2s (deno task dev)</span></div>
          <div class='metric'><span class='label'>Client bundle</span><span class='value'>~0 KB (islands only, generated data modules)</span></div>

          <h2>Rendering</h2>
          <div class='metric'><span class='label'>DSD SSR</span><span class='value'>Zero JS parse cost (browser native)</span></div>
          <div class='metric'><span class='label'>Island hydrate</span><span class='value'>Per-component, strategy-gated</span></div>
          <div class='metric'><span class='label'>Route switch (SPA)</span><span class='value'>~0ms (no full page reload)</span></div>

          <h2>Bundle Size</h2>
          <p>openElement ships zero runtime JS for DSD components. Islands load on-demand by strategy. No framework runtime in the critical path.</p>
