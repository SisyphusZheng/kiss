---
title: 'Package Compatibility'
section: 'Compatibility'
label: 'Package Compatibility'
order: 10
---

<open-layout
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/package-compatibility"
        locale="$"
        locales='$'
      >

          <h1>Package Compatibility</h1>
          <p class="subtitle">
            Introduced in v0.18.0, the Universal WC Engine enables openElement to automatically detect
            and classify third-party Web Component packages - deciding safely which ones can SSR
            and which must stay client-only.
          </p>

          <h2>The Problem</h2>
          <p>
            Third-party Web Components come from different ecosystems. Some use Lit, some use
            vanilla classes, some are browser-only with real-DOM dependencies. openElement no longer
            assumes every package is SSR-safe - it reads their <code>custom-elements.json</code>
            manifest and makes informed decisions.
          </p>
          <h3>Reality check: CEM adoption is still low</h3>
          <p>
            Some third-party Web Component libraries (e.g. <code>@example/third-party-wc</code>)
            <strong>do not ship</strong> a <code>custom-elements.json</code> file. Without CEM,
            auto-detection returns no results for these packages, and they rely on explicit
            <code>packageIslands</code> declarations in <code>vite.config.ts</code>.
          </p>

          <h2>4-Tier Compatibility</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Meaning</th>
                <th>Build Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>ssr-capable</code></td>
                <td>Explicit openElement SSR declaration or adapter support</td>
                <td>Import in SSR bundle, participate in DSD rendering</td>
              </tr>
              <tr>
                <td><code>client-only</code></td>
                <td>Browser-only, or no SSR declaration<ul><li>CEM without Less extension</li><li>Explicit <code>ssr: false</code></li><li>Default when no CEM</li></ul></td>
                <td>Exclude from SSR bundle, emit client registration/hydration metadata</td>
              </tr>
              <tr>
                <td><code>rejected</code></td>
                <td>Invalid manifest, duplicate tags, unsafe paths</td>
                <td>Fail before code generation</td>
              </tr>
              <tr>
                <td><code>experimental-dom</code></td>
                <td>Opt-in DOM simulation candidate</td>
                <td>Render only when flag is enabled, report all results</td>
              </tr>
            </tbody>
          </table>

          <h2>Build-Time Auto-Detection</h2>
          <p>
            During the Vite plugin's <code>buildStart()</code> phase, openElement automatically scans
            <code>node_modules</code> for <code>custom-elements.json</code> files:
          </p>
          <open-code-block><pre><code>// Pseudocode - actual implementation in route-scanner.ts

for (const pkg of node_modules)
}</code></pre></open-code-block>

          <h3>Key properties</h3>
          <ul>
            <li><strong>No code execution</strong> - reads JSON only, safe</li>
            <li><strong>Scoped package support</strong> - handles <code>@org/pkg</code> patterns</li>
            <li><strong>Non-fatal</strong> - a corrupted CEM won't break the build</li>
            <li><strong>Zero-config</strong> - automatic, no manual declarations needed</li>
          </ul>

          <h2>Compatibility Report in dsd-report.json</h2>
          <p>
            The build report now includes a <code>cemCompatibility</code> section:
          </p>
          <open-code-block><pre><code>
    ]

}
}</code></pre></open-code-block>

<p>
Each entry includes the package name, compatibility tier, reason, and component count
for debugging and audit purposes.
</p>

          <h2>Current Site Results</h2>
          <p>
            The www example site now uses <code>@openelement/ui</code>, which ships a
            <code>custom-elements.json</code> manifest and is auto-detected as
            <code>ssr-capable</code>. Third-party packages without a CEM still require explicit
            <code>packageIslands</code> declarations in <code>vite.config.ts</code>.
          </p>

          <h2>CEM vs No-CEM Comparison</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>CEM Detection</th>
                <th>Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Has CEM + openElement SSR extension</td>
                <td><code>ssr-capable</code></td>
                <td>Auto-added to SSR bundle</td>
              </tr>
              <tr>
                <td>Has CEM + no SSR declaration</td>
                <td><code>client-only</code></td>
                <td>Safe fallback, no server rendering</td>
              </tr>
              <tr>
                <td>No CEM</td>
                <td>Empty (not detected)</td>
                <td>Manual via <code>packageIslands</code></td>
              </tr>
              <tr>
                <td>No CEM + not in packageIslands</td>
                <td>Empty</td>
                <td>Not registered (requires explicit import)</td>
              </tr>
            </tbody>
          </table>

          <h2>Roadmap</h2>
          <ul class="compact-list">
            <li><strong>v0.18.1</strong>: <code>less validate-manifest</code> CLI - pre-install validation</li>
            <li><strong>v0.18.2</strong>: <code>open add</code> - one-click install and configure</li>
            <li><strong>v0.18.3</strong>: DOM simulation - experimental client-only component rendering</li>
          </ul>

          <nav class="nav-row">
            <a class="nav-link" href="/$/architecture/architecture">← Architecture</a>
            <a class="nav-link" href="/$/architecture/standards-registry">Standards &amp; Registry -></a>
          </nav>
