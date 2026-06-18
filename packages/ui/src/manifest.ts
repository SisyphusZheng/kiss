/**
 * @openelement/ui - Package Manifest
 *
 * CEM-compatible OpenElementPackageManifest for the @openelement/ui package.
 * Consumers (adapter-vite) read manifest.declarations to derive
 * island metadata (tagName, module, hydrate, ssr, dsd).
 *
 * v0.20.0: All components use DsdElement (zero framework).
 */

import type { OpenElementPackageManifest } from '@openelement/core';

export const manifest: OpenElementPackageManifest = {
  schemaVersion: '1.0.0',
  packageName: '@openelement/ui',
  version: '0.40.7',
  description: 'Open Props Web Component library for openElement',
  author: 'openElement',
  license: 'MIT',
  homepage: 'https://openelement.org',
  repository: 'https://github.com/open-element/openelement',
  openElement: {
    adapter: 'vanilla', // v0.20.0: DSD components use DsdElement (zero framework)
    hasStylesheet: true,
    cssPrefix: 'open',
  },
  declarations: [
    // -- Ocean (DSD, DsdElement) --
    {
      tagName: 'open-card',
      className: 'OpenCard',
      superclassName: 'OpenElement',
      description: 'Card container with header and footer slots',
      attributes: [
        {
          name: 'variant',
          type: 'string',
          default: '"default"',
          description: 'Card variant (default, elevated, borderless)',
        },
      ],
      slots: [
        { name: '', description: 'Default slot for card content' },
        { name: 'header', description: 'Header slot' },
        { name: 'footer', description: 'Footer slot' },
      ],
      cssParts: [
        { name: 'container', description: 'The article wrapper' },
        { name: 'body', description: 'The card content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-card',
        export: 'OpenCard',
      },
    },
    {
      tagName: 'open-callout',
      className: 'OpenCallout',
      superclassName: 'OpenElement',
      description: 'Callout notice box (info, warning, danger, tip)',
      attributes: [
        { name: 'type', type: 'string', default: '"info"', description: 'Callout type' },
        { name: 'label', type: 'string', description: 'Callout heading label' },
      ],
      cssParts: [
        { name: 'container', description: 'The callout wrapper' },
        { name: 'icon', description: 'The type icon span' },
        { name: 'content', description: 'The body content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-callout',
        export: 'OpenCallout',
      },
    },
    {
      tagName: 'open-step-card',
      className: 'OpenStepCard',
      superclassName: 'OpenElement',
      description: 'Step card with numbered indicator',
      attributes: [
        { name: 'step', type: 'number', default: '1', description: 'Step number' },
        { name: 'label', type: 'string', description: 'Step label' },
        { name: 'description', type: 'string', description: 'Step description' },
        { name: 'status', type: 'string', description: 'Step status (completed, active, pending)' },
      ],
      cssParts: [
        { name: 'container', description: 'The step card wrapper' },
        { name: 'indicator', description: 'The step number circle' },
        { name: 'title', description: 'The step label heading' },
        { name: 'content', description: 'The slot content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-step-card',
        export: 'OpenStepCard',
      },
    },
    {
      tagName: 'open-button',
      className: 'OpenButton',
      superclassName: 'OpenElement',
      description: 'Button with variants (default, primary, ghost, accent)',
      attributes: [
        { name: 'variant', type: 'string', default: '"default"', description: 'Button variant' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether disabled' },
        { name: 'size', type: 'string', default: '"md"', description: 'Button size (sm, md, lg)' },
        { name: 'href', type: 'string', description: 'Link URL (renders as anchor)' },
      ],
      events: [
        { name: 'open-click', type: 'CustomEvent', description: 'Fired on button click' },
      ],
      cssParts: [
        { name: 'control', description: 'The button or anchor element' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-button',
        export: 'OpenButton',
      },
    },
    {
      tagName: 'open-input',
      className: 'OpenInput',
      superclassName: 'OpenElement',
      description: 'Input field with label and error states',
      attributes: [
        { name: 'label', type: 'string', description: 'Input label' },
        { name: 'value', type: 'string', default: '""', description: 'Input value' },
        { name: 'type', type: 'string', default: '"text"', description: 'Input type' },
        { name: 'error', type: 'string', description: 'Error message' },
        { name: 'placeholder', type: 'string', description: 'Placeholder text' },
        { name: 'disabled', type: 'boolean', description: 'Disabled state' },
      ],
      events: [
        {
          name: 'open-input',
          type: 'CustomEvent<{ value: string }>',
          description: 'Fired on input change',
        },
      ],
      cssParts: [
        { name: 'wrapper', description: 'The outer wrapper div' },
        { name: 'label', description: 'The label element' },
        { name: 'control', description: 'The input element' },
        { name: 'error', description: 'The error message element' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-input',
        export: 'OpenInput',
      },
    },
    {
      tagName: 'open-theme-toggle',
      className: 'OpenThemeToggle',
      superclassName: 'OpenElement',
      description: 'Dark/Light theme toggle',
      attributes: [
        { name: 'theme', type: 'string', description: 'Initial theme (light/dark)' },
      ],
      cssParts: [
        { name: 'toggle', description: 'The button element' },
        { name: 'icon-sun', description: 'The sun SVG icon' },
        { name: 'icon-moon', description: 'The moon SVG icon' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-theme-toggle',
        export: 'OpenThemeToggle',
      },
    },
    {
      tagName: 'open-code-block',
      className: 'OpenCodeBlock',
      superclassName: 'OpenElement',
      description: 'Code block with syntax highlighting and copy button',
      cssParts: [
        { name: 'container', description: 'The code-block wrapper' },
        { name: 'copy', description: 'The copy button' },
        { name: 'body', description: 'The pre/code area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'idle',
        module: '@openelement/ui/open-code-block',
        export: 'OpenCodeBlock',
      },
    },
    {
      tagName: 'open-badge',
      className: 'OpenBadge',
      superclassName: 'OpenElement',
      description: 'Open Props status badge',
      attributes: [
        { name: 'tone', type: 'string', default: '"neutral"', description: 'Badge tone' },
        { name: 'size', type: 'string', default: '"md"', description: 'Badge size' },
      ],
      slots: [
        { name: '', description: 'Badge text' },
      ],
      cssParts: [
        { name: 'badge', description: 'The badge wrapper' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-badge',
        export: 'OpenBadge',
      },
    },
    {
      tagName: 'open-brand-mark',
      className: 'OpenBrandMark',
      superclassName: 'OpenElement',
      description: 'Aperture O brand mark for openElement surfaces',
      attributes: [
        { name: 'size', type: 'string', default: '"md"', description: 'Mark size' },
        { name: 'tone', type: 'string', default: '"default"', description: 'Mark tone' },
      ],
      cssParts: [
        { name: 'mark', description: 'The Aperture O wrapper' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-brand-mark',
        export: 'OpenBrandMark',
      },
    },
    {
      tagName: 'open-lab-panel',
      className: 'OpenLabPanel',
      superclassName: 'OpenElement',
      description: 'Standards-lab artifact and spec panel',
      attributes: [
        { name: 'variant', type: 'string', default: '"surface"', description: 'Panel variant' },
        { name: 'label', type: 'string', description: 'Panel label' },
        { name: 'meta', type: 'string', description: 'Panel metadata' },
        { name: 'compact', type: 'boolean', description: 'Compact body padding' },
      ],
      slots: [
        { name: '', description: 'Panel content' },
      ],
      cssParts: [
        { name: 'container', description: 'The panel wrapper' },
        { name: 'header', description: 'The panel header' },
        { name: 'body', description: 'The panel content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-lab-panel',
        export: 'OpenLabPanel',
      },
    },
    {
      tagName: 'open-standards-visual',
      className: 'OpenStandardsVisual',
      superclassName: 'OpenElement',
      description: 'Product-art standards diagram for route, package, token, and hero visuals',
      attributes: [
        { name: 'variant', type: 'string', default: '"hero"', description: 'Visual variant' },
        { name: 'motion', type: 'string', default: '"auto"', description: 'Motion mode' },
        { name: 'emphasis', type: 'string', default: '"normal"', description: 'Visual emphasis' },
      ],
      cssParts: [],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-standards-visual',
        export: 'OpenStandardsVisual',
      },
    },
    {
      tagName: 'open-lab-stage',
      className: 'OpenLabStage',
      superclassName: 'OpenElement',
      description: 'Kinetic standards-lab hero stage for product-art pages',
      attributes: [
        { name: 'motion', type: 'string', default: '"auto"', description: 'Motion mode' },
        { name: 'emphasis', type: 'string', default: '"high"', description: 'Stage emphasis' },
      ],
      cssParts: [
        { name: 'stage', description: 'The stage wrapper' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-lab-stage',
        export: 'OpenLabStage',
      },
    },
    {
      tagName: 'open-dialog',
      className: 'OpenDialog',
      superclassName: 'OpenElement',
      description: 'Modal dialog component using native <dialog>',
      attributes: [
        {
          name: 'open',
          type: 'boolean',
          default: 'false',
          description: 'Whether the dialog is open',
        },
        { name: 'label', type: 'string', description: 'Dialog heading' },
      ],
      events: [
        { name: 'open-dialog-close', type: 'CustomEvent', description: 'Fired when dialog closes' },
      ],
      slots: [
        { name: '', description: 'Default slot for dialog content' },
        { name: 'trigger', description: 'Click target to open the dialog' },
        { name: 'footer', description: 'Footer slot for action buttons' },
      ],
      cssParts: [
        { name: 'overlay', description: 'The dialog element (backdrop)' },
        { name: 'header', description: 'The header bar' },
        { name: 'close', description: 'The close button' },
        { name: 'body', description: 'The content area' },
        { name: 'footer', description: 'The footer area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'idle',
        module: '@openelement/ui/open-dialog',
        export: 'OpenDialog',
      },
    },
    {
      tagName: 'open-layout',
      className: 'OpenLayout',
      superclassName: 'OpenElement',
      description: 'App layout with header, sidebar, footer, and SPA navigation',
      attributes: [
        { name: 'current-path', type: 'string', description: 'Current URL path' },
        { name: 'nav-items', type: 'array', description: 'Sidebar navigation sections' },
        { name: 'header-nav', type: 'array', description: 'Header navigation links' },
        { name: 'logo-text', type: 'string', default: '"openElement"', description: 'Logo text' },
        { name: 'home', type: 'boolean', description: 'Home page layout (no sidebar)' },
      ],
      slots: [
        { name: '', description: 'Default slot for page content' },
        { name: 'header-actions', description: 'Header right-side actions (e.g. search)' },
      ],
      cssParts: [
        { name: 'container', description: 'The app-layout root div' },
        { name: 'header', description: 'The sticky header' },
        { name: 'sidebar', description: 'The docs-sidebar nav' },
        { name: 'main', description: 'The layout-main element' },
        { name: 'footer', description: 'The app-footer element' },
        { name: 'nav', description: 'The header-nav element' },
        { name: 'nav-toggle', description: 'The mobile menu toggle button' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-layout',
        export: 'OpenLayout',
      },
    },
    {
      tagName: 'open-dropdown',
      className: 'OpenDropdown',
      superclassName: 'OpenElement',
      description: 'Dropdown toggle with trigger slot and content slot',
      slots: [
        { name: 'trigger', description: 'Click target to toggle the dropdown' },
        { name: '', description: 'Dropdown content (shown when open)' },
      ],
      cssParts: [
        { name: 'dropdown', description: 'The dropdown wrapper' },
        { name: 'content', description: 'The dropdown content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-dropdown',
        export: 'OpenDropdown',
      },
    },
    {
      tagName: 'open-modal',
      className: 'OpenModal',
      superclassName: 'OpenElement',
      description: 'Modal dialog using signal-driven open attribute',
      attributes: [
        {
          name: 'open',
          type: 'boolean',
          default: 'false',
          description: 'Whether the modal is open',
        },
      ],
      slots: [
        { name: '', description: 'Modal body content' },
      ],
      cssParts: [
        { name: 'modal', description: 'The modal root' },
        { name: 'backdrop', description: 'The backdrop element' },
        { name: 'content', description: 'The content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-modal',
        export: 'OpenModal',
      },
    },
    {
      tagName: 'open-tabs',
      className: 'OpenTabs',
      superclassName: 'OpenElement',
      description: 'Tab interface with tab and panel slots',
      slots: [
        { name: 'tab', description: 'Tab button labels (multiple)' },
        { name: 'panel', description: 'Tab panel content (multiple, one per tab)' },
      ],
      cssParts: [
        { name: 'tabs', description: 'The tab button container' },
        { name: 'panel', description: 'The active panel content' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-tabs',
        export: 'OpenTabs',
      },
    },
    // -- Island-style DsdElement component --
    {
      tagName: 'open-hero-ping',
      className: 'OpenHeroPing',
      superclassName: 'OpenElement',
      description: 'Animated hero ping indicator (Island)',
      cssParts: [
        { name: 'dot-static', description: 'The static status dot' },
        { name: 'dot-animated', description: 'The animated ping dot' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'idle',
        module: '@openelement/ui/open-hero-ping',
        export: 'OpenHeroPing',
      },
    },
    // -- Linear (OpenElement, `@openelement/element`) --
    {
      tagName: 'open-button-linear',
      className: 'OpenButtonLinear',
      superclassName: 'OpenElement',
      description: 'Linear.app-style button (compact, no box-shadow, no hover lift)',
      attributes: [
        {
          name: 'variant',
          type: 'string',
          default: '"primary"',
          description: 'Button variant (primary, secondary, tertiary, inverse)',
        },
        { name: 'size', type: 'string', default: '"md"', description: 'Button size (sm, md, lg)' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether disabled' },
        { name: 'href', type: 'string', description: 'Link URL (renders as anchor)' },
        { name: 'target', type: 'string', description: 'Anchor target attribute' },
        { name: 'type', type: 'string', default: '"button"', description: 'Button type attribute' },
      ],
      events: [
        { name: 'open-click', type: 'CustomEvent', description: 'Fired on button click' },
      ],
      cssParts: [
        { name: 'control', description: 'The button or anchor element' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-button-linear',
        export: 'OpenButtonLinear',
      },
    },
    {
      tagName: 'open-card-linear',
      className: 'OpenCardLinear',
      superclassName: 'OpenElement',
      description: 'Linear.app-style card with edge highlight, code-panel and featured variants',
      attributes: [
        {
          name: 'variant',
          type: 'string',
          default: '"standard"',
          description: 'Card variant (standard, featured, code-panel)',
        },
        { name: 'title', type: 'string', description: 'Panel title (code-panel variant)' },
      ],
      slots: [
        { name: '', description: 'Default slot for card content' },
        { name: 'header', description: 'Header slot' },
        { name: 'footer', description: 'Footer slot' },
      ],
      cssParts: [
        { name: 'container', description: 'The article wrapper' },
        { name: 'body', description: 'The card content area' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-card-linear',
        export: 'OpenCardLinear',
      },
    },
    {
      tagName: 'open-input-linear',
      className: 'OpenInputLinear',
      superclassName: 'OpenElement',
      description: 'Linear.app-style input (standard, cli, search variants; sm, md, lg sizes)',
      attributes: [
        {
          name: 'variant',
          type: 'string',
          default: '"standard"',
          description: 'Input variant (standard, cli, search)',
        },
        { name: 'size', type: 'string', default: '"md"', description: 'Input size (sm, md, lg)' },
        { name: 'type', type: 'string', default: '"text"', description: 'Input type' },
        { name: 'label', type: 'string', description: 'Input label' },
        { name: 'value', type: 'string', default: '""', description: 'Input value' },
        { name: 'placeholder', type: 'string', description: 'Placeholder text' },
        { name: 'name', type: 'string', description: 'Form field name' },
        { name: 'disabled', type: 'boolean', description: 'Disabled state' },
        { name: 'error', type: 'string', description: 'Error message' },
        { name: 'copy', type: 'boolean', description: 'Show copy button (cli variant)' },
      ],
      slots: [
        { name: '', description: 'Default slot for input content' },
        { name: 'prefix', description: 'Content before the input' },
        { name: 'suffix', description: 'Content after the input' },
      ],
      events: [
        {
          name: 'open-input',
          type: 'CustomEvent<{ value: string }>',
          description: 'Fired on input change',
        },
        {
          name: 'open-change',
          type: 'CustomEvent<{ value: string }>',
          description: 'Fired on commit (blur/enter)',
        },
        { name: 'open-focus', type: 'CustomEvent', description: 'Fired on focus' },
        { name: 'open-blur', type: 'CustomEvent', description: 'Fired on blur' },
      ],
      cssParts: [
        { name: 'wrapper', description: 'The outer input row wrapper' },
        { name: 'control', description: 'The actual <input> element' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-input-linear',
        export: 'OpenInputLinear',
      },
    },
    {
      tagName: 'open-nav-linear',
      className: 'OpenNavLinear',
      superclassName: 'OpenElement',
      description: 'Linear.app-style sticky navigation bar with backdrop-blur and mobile overlay',
      attributes: [
        { name: 'current-path', type: 'string', description: 'Current URL path' },
        { name: 'nav-links', type: 'array', description: 'Navigation links JSON array' },
        { name: 'logo-text', type: 'string', default: '"openElement"', description: 'Logo text' },
        { name: 'github-url', type: 'string', description: 'GitHub repository URL' },
      ],
      cssParts: [
        { name: 'container', description: 'The nav inner wrapper' },
        { name: 'logo', description: 'The logo link' },
        { name: 'links', description: 'The desktop nav links container' },
        { name: 'cta', description: 'The primary CTA button' },
        { name: 'github', description: 'The GitHub secondary button' },
        { name: 'hamburger', description: 'The mobile hamburger toggle button' },
        { name: 'overlay', description: 'The mobile full-screen overlay' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-interactive',
        hydrate: 'load',
        module: '@openelement/ui/open-nav-linear',
        export: 'OpenNavLinear',
      },
    },
    {
      tagName: 'open-badge-linear',
      className: 'OpenBadgeLinear',
      superclassName: 'OpenElement',
      description: 'Linear.app-style pill badge with status variants',
      attributes: [
        {
          name: 'variant',
          type: 'string',
          default: '"default"',
          description: 'Badge variant (default, success, error, warning, info, new)',
        },
        { name: 'size', type: 'string', description: 'Badge size (sm)' },
      ],
      cssParts: [
        { name: 'badge', description: 'The badge span element' },
      ],
      openElement: {
        ssr: true,
        dsd: true,
        layer: 'dsd-static',
        hydrate: 'idle',
        module: '@openelement/ui/open-badge-linear',
        export: 'OpenBadgeLinear',
      },
    },
  ],
  modules: [
    {
      path: './open-button.js',
      exports: [{ name: 'OpenButton', path: './open-button.js' }],
      declarations: ['open-button'],
    },
    {
      path: './open-card.js',
      exports: [{ name: 'OpenCard', path: './open-card.js' }],
      declarations: ['open-card'],
    },
    {
      path: './open-callout.js',
      exports: [{ name: 'OpenCallout', path: './open-callout.js' }],
      declarations: ['open-callout'],
    },
    {
      path: './open-step-card.js',
      exports: [{ name: 'OpenStepCard', path: './open-step-card.js' }],
      declarations: ['open-step-card'],
    },
    {
      path: './open-code-block.js',
      exports: [{ name: 'OpenCodeBlock', path: './open-code-block.js' }],
      declarations: ['open-code-block'],
    },
    {
      path: './open-badge.js',
      exports: [{ name: 'OpenBadge', path: './open-badge.js' }],
      declarations: ['open-badge'],
    },
    {
      path: './open-brand-mark.js',
      exports: [{ name: 'OpenBrandMark', path: './open-brand-mark.js' }],
      declarations: ['open-brand-mark'],
    },
    {
      path: './open-lab-panel.js',
      exports: [{ name: 'OpenLabPanel', path: './open-lab-panel.js' }],
      declarations: ['open-lab-panel'],
    },
    {
      path: './open-lab-stage.js',
      exports: [{ name: 'OpenLabStage', path: './open-lab-stage.js' }],
      declarations: ['open-lab-stage'],
    },
    {
      path: './open-standards-visual.js',
      exports: [{ name: 'OpenStandardsVisual', path: './open-standards-visual.js' }],
      declarations: ['open-standards-visual'],
    },
    {
      path: './open-dialog.js',
      exports: [{ name: 'OpenDialog', path: './open-dialog.js' }],
      declarations: ['open-dialog'],
    },
    {
      path: './open-hero-ping.js',
      exports: [{ name: 'OpenHeroPing', path: './open-hero-ping.js' }],
      declarations: ['open-hero-ping'],
    },
    {
      path: './open-input.js',
      exports: [{ name: 'OpenInput', path: './open-input.js' }],
      declarations: ['open-input'],
    },
    {
      path: './open-layout.js',
      exports: [{ name: 'OpenLayout', path: './open-layout.js' }],
      declarations: ['open-layout'],
    },
    {
      path: './open-theme-toggle.js',
      exports: [{ name: 'OpenThemeToggle', path: './open-theme-toggle.js' }],
      declarations: ['open-theme-toggle'],
    },
    {
      path: './open-dropdown.js',
      exports: [{ name: 'OpenDropdown', path: './open-dropdown.js' }],
      declarations: ['open-dropdown'],
    },
    {
      path: './open-modal.js',
      exports: [{ name: 'OpenModal', path: './open-modal.js' }],
      declarations: ['open-modal'],
    },
    {
      path: './open-tabs.js',
      exports: [{ name: 'OpenTabs', path: './open-tabs.js' }],
      declarations: ['open-tabs'],
    },
    // -- Linear modules --
    {
      path: './open-button-linear.js',
      exports: [{ name: 'OpenButtonLinear', path: './open-button-linear.js' }],
      declarations: ['open-button-linear'],
    },
    {
      path: './open-card-linear.js',
      exports: [{ name: 'OpenCardLinear', path: './open-card-linear.js' }],
      declarations: ['open-card-linear'],
    },
    {
      path: './open-input-linear.js',
      exports: [{ name: 'OpenInputLinear', path: './open-input-linear.js' }],
      declarations: ['open-input-linear'],
    },
    {
      path: './open-nav-linear.js',
      exports: [{ name: 'OpenNavLinear', path: './open-nav-linear.js' }],
      declarations: ['open-nav-linear'],
    },
    {
      path: './open-badge-linear.js',
      exports: [{ name: 'OpenBadgeLinear', path: './open-badge-linear.js' }],
      declarations: ['open-badge-linear'],
    },
  ],
};
