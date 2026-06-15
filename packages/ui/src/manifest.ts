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
  version: '0.33.0',
  description: 'Swiss International Style Web Component library for openElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      tagName: 'open-dialog',
      className: 'OpenDialog',
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
      superclassName: 'DsdElement',
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
  ],
};
