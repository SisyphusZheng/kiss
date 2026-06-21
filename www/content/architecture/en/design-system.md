---
title: 'Design System'
section: 'Reference'
label: 'Design System'
order: 10
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath=/architecture/design-system`}

    <h1>Design System</h1>
    <p class='subtitle'>
      <strong>Two plates. Zero noise.</strong>
      <br />Dark and light. Nothing else.
    </p>
    <div class='section'>
      <div class='section-title'>Palettes</div>
      <div class='palette-row'>
        <div class='palette-card palette-dark'>
          <div class='palette-name'>Dark</div>
          <div class='swatch-grid'>
            <div class='swatch-item'>
              <div class='swatch' style='background:#000'></div>
              <div class='swatch-label'>Base</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#0a0a0a'></div>
              <div class='swatch-label'>Surface</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fff'></div>
              <div class='swatch-label'>Primary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#999'></div>
              <div class='swatch-label'>Secondary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#666'></div>
              <div class='swatch-label'>Tertiary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#444'></div>
              <div class='swatch-label'>Muted</div>
            </div>
          </div>
          <p class='palette-desc'>
            <strong>Black</strong> base. White accent. Gray layers.
          </p>
        </div>
        <div class='palette-card palette-light'>
          <div class='palette-name'>Light</div>
          <div class='swatch-grid'>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fff'></div>
              <div class='swatch-label'>Base</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fafafa'></div>
              <div class='swatch-label'>Surface</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#000'></div>
              <div class='swatch-label'>Primary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#555'></div>
              <div class='swatch-label'>Secondary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#888'></div>
              <div class='swatch-label'>Tertiary</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#aaa'></div>
              <div class='swatch-label'>Muted</div>
            </div>
          </div>
          <p class='palette-desc'>
            <strong>White</strong> base. Black accent. Gray layers.
          </p>
        </div>
      </div>
    </div>
    <div class='section'>
      <div class='section-title'>Buttons</div>
      <div class='preview-card'>
        <div class='preview-header'>
          <span class='preview-title'>Variants</span>
          <span class='preview-badge'>Ready</span>
        </div>
        <div class='preview-body'>
          <open-button variant='primary'>Primary</open-button>
          <open-button>Default</open-button>
          <open-button variant='ghost'>Ghost</open-button>
        </div>
      </div>
    </div>
    <div class='section'>
      <div class='section-title'>Inputs</div>
      <div class='preview-card'>
        <div class='preview-header'>
          <span class='preview-title'>Text Input</span>
          <span class='preview-badge'>Ready</span>
        </div>
        <div class='preview-body preview-body-col'>
          <open-input placeholder='Enter email...' label='Email'></open-input>
          <open-input type='password' placeholder='Password' label='Password' required>
          </open-input>
          <open-input value='hello@openelement.org' label='Read-only' disabled></open-input>
        </div>
      </div>
    </div>
    <div class='install-section'>
      <h3>Install @openelement/ui</h3>
      <div class='install-cmd'>
        <span class='prompt'>$</span> npm install @openelement/ui
      </div>
      <p>Deno, Node, Bun. Zero config.</p>
    </div>
    <div class='nav-row'>
      <a href=/architecture/architecture`} class='nav-link'>← Architecture</a>
      <a href=/architecture/reference/core`} class='nav-link'>API Reference →</a>
    </div>
