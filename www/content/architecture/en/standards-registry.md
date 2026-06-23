---
title: 'Standards & Registry Strategy'
section: 'Compatibility'
label: 'Standards & Registry'
order: 20
---

<open-layout
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/standards-registry"
        locale="$"
        locales='$'
      >

          <h1>Standards &amp; Registry Strategy</h1>
          <p class="subtitle">
            The long-term openElement direction is a WC SSR/SSG rendering kernel and component package
            protocol. A public registry hub should follow local indexing, manifests, validation artifacts,
            and security governance.
          </p>

          <h2>Boundary In One Sentence</h2>
          <p>
            openElement can become a Web Components SSR/SSG rendering kernel and package protocol, but it
            should not promise automatic SSR, registration, and hydration for arbitrary Web Components.
            Automation must come from manifests, not runtime guessing.
          </p>

          <h2>Standards And Ecosystem References</h2>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>How openElement Uses It</th>
                <th>What openElement Avoids</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WHATWG HTML / DSD</td>
                <td>
                  Follow template attributes such as <code>shadowrootmode</code> as the SSR output base.
                </td>
                <td>Do not replace platform semantics with private hydration markers.</td>
              </tr>
              <tr>
                <td>Custom Elements Manifest</td>
                <td>
                  Use it as metadata for tags, attributes, properties, events, slots, parts, and CSS
                  tokens.
                </td>
                <td>Do not invent an incompatible component documentation format.</td>
              </tr>
              <tr>
                <td>Open UI</td>
                <td>Borrow vocabulary for parts, states, behavior, accessibility, and form semantics.</td>
                <td>Do not turn openElement into an OpenWC template or Open UI implementation library.</td>
              </tr>
              <tr>
                <td>OpenWC</td>
                <td>Learn from testing, linting, demoing, and publishing history.</td>
                <td>
                  Do not adopt older test stacks, Rollup presets, or project templates as the main route.
                </td>
              </tr>
              <tr>
                <td>Lit / FAST</td>
                <td>Treat them as WC authoring models and adapter inputs.</td>
                <td>Do not bind openElement's identity to one authoring library.</td>
              </tr>
              <tr>
                <td>Scoped Custom Element Registries</td>
                <td>Track future multi-version and duplicate-tag isolation.</td>
                <td>Do not depend on it before browser and protocol support are stable.</td>
              </tr>
              <tr>
                <td>CSS Houdini</td>
                <td>Watch it as future styling and worklet adjacency.</td>
                <td>Do not make Houdini part of the current renderer promise.</td>
              </tr>
            </tbody>
          </table>

          <h2>Automation Requirements</h2>
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Credible Condition</th>
                <th>Failure Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>One-command install</td>
                <td>Package declares a manifest, schema passes, source and version are recorded.</td>
                <td>Show a dry-run diff only; do not modify config.</td>
              </tr>
              <tr>
                <td>Automatic registration</td>
                <td>Manifest declares tag, module, export, and registration strategy.</td>
                <td>Skip duplicate defines and report version conflicts.</td>
              </tr>
              <tr>
                <td>Automatic rendering</td>
                <td>
                  Component declares <code>ssr.renderable: true</code> and a matching adapter exists.
                </td>
                <td>Degrade to host element or pure island and record diagnostics.</td>
              </tr>
              <tr>
                <td>Automatic hydration</td>
                <td>Manifest declares hydrate strategy, events, selectors, and cleanup.</td>
                <td>Keep static DSD HTML and bind no unknown events.</td>
              </tr>
              <tr>
                <td>Hub listing</td>
                <td>Consume manifest, SSR/SSG snapshots, bundle cost, tests, and a11y notes.</td>
                <td>Hide unverified fields and do not trust README marketing text.</td>
              </tr>
            </tbody>
          </table>

          <h2>Suggested Manifest Fields</h2>
          <p>
            v0.16 should not freeze the entire ecosystem protocol immediately, but it should define
            verifiable fields: package, version, components, tag, module, export, ssr, dsd, hydrate,
            events, slots, parts, states, tokens, diagnostics, and validation.
          </p>

          <h2>Market Reality</h2>
          <p>
            This direction is differentiated, but it is not a replacement for mainstream React/Vue app
            frameworks. The best-fit users are design system authors, Web Component package authors,
            docs/product site teams, Deno/Edge teams, and organizations that need internal component
            indexing and quality review.
          </p>

          <h2>Near-Term Priority</h2>
          <ol>
            <li>Document and test renderer protocol, adapter contract, and DSD diagnostics.</li>
            <li>Extend <code>@openelement/protocol/manifest</code> toward a CEM-compatible package manifest draft.</li>
            <li>Build manifest validation helpers before one-command install flow.</li>
            <li>Build a local registry index before a public hub.</li>
          </ol>

          <div class="nav-row">
            <a href="/$/architecture/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
