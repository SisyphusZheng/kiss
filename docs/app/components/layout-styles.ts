/**
 * Docs site global layout styles.
 * KISS Architecture (K·I·S·S) — Shadow DOM encapsulated, styles scoped to app-layout's shadow root.
 * DSD makes content visible even without JavaScript.
 *
 * Theme system: Pure B&W — Dark (default) / Light.
 * All colors use CSS custom properties that inherit from :root.
 */
import { css } from '@kissjs/core';

export const layoutStyles = css`
  /* === Global Reset & Base === */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :host {
    display: block;
  }

  /* === Layout === */
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--text-primary);
  }

  .app-layout .layout-body {
    display: flex;
    flex: 1;
  }

  .app-layout .layout-main {
    flex: 1;
    min-width: 0;
  }

  .app-layout[home] .layout-body {
    display: block;
  }

  @media (max-width: 900px) {
    .docs-sidebar {
      display: block;
      width: 100%;
      height: auto;
      position: relative;
      top: 0;
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: 0.75rem 1rem;
    }

    .docs-sidebar .nav-section {
      margin-bottom: 0.5rem;
    }

    .docs-sidebar .nav-section summary {
      padding: 0.25rem 0.5rem;
    }

    .docs-sidebar a {
      padding: 0.25rem 0.5rem 0.25rem 1.5rem;
    }
  }

  /* === Header === */
  .app-header {
    display: block;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
  }

  .app-header .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    height: 56px;
    gap: 2rem;
  }

  .app-header .logo {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .app-header .logo:hover {
    opacity: 0.7;
  }

  .app-header .logo-sub {
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 0.375rem;
    letter-spacing: 0.02em;
  }

  .app-header nav {
    display: flex;
    gap: 0.25rem;
    flex: 1;
  }

  .app-header nav a {
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.375rem 0.75rem;
    letter-spacing: 0.01em;
    transition: color 0.15s;
    border-radius: 2px;
  }

  .app-header nav a:hover {
    color: var(--text-primary);
  }

  .app-header .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .app-header .github-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 2px;
    transition: color 0.15s, border-color 0.15s;
  }

  .app-header .github-link:hover {
    color: var(--text-secondary);
    border-color: var(--border-hover);
  }

  /* === Theme Toggle === */
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1rem;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .theme-toggle:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--accent-subtle);
  }

  /* === Sidebar === */
  .docs-sidebar {
    display: block;
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    padding: 1.5rem 0;
    overflow-y: auto;
    height: calc(100vh - 56px);
    position: sticky;
    top: 56px;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  .docs-sidebar .nav-section {
    margin-bottom: 1.25rem;
  }

  .docs-sidebar .nav-section summary {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    padding: 0 1.25rem;
    margin-bottom: 0.375rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
  }

  .docs-sidebar .nav-section summary::-webkit-details-marker {
    display: none;
  }

  .docs-sidebar .nav-section summary::before {
    content: "▸";
    font-size: 0.625rem;
    transition: transform 0.15s;
    display: inline-block;
  }

  .docs-sidebar .nav-section[open] summary::before {
    transform: rotate(90deg);
  }

  .docs-sidebar .nav-section summary:hover {
    color: var(--text-tertiary);
  }

  .docs-sidebar a {
    display: block;
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.8125rem;
    padding: 0.3rem 1.25rem;
    transition: color 0.15s, background 0.15s;
    border-left: 2px solid transparent;
  }

  .docs-sidebar a:hover {
    color: var(--text-primary);
    background: var(--accent-subtle);
  }

  .docs-sidebar a.active,
  .docs-sidebar a[aria-current="page"] {
    color: var(--text-primary);
    border-left-color: var(--text-primary);
    background: var(--accent-subtle);
    font-weight: 600;
  }

  /* === Footer === */
  .app-footer {
    display: block;
    margin-top: auto;
  }

  .app-footer footer {
    padding: 2rem 1.5rem;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--text-tertiary);
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    background: var(--bg-base);
  }

  .app-footer p {
    margin: 0.25rem 0;
  }

  .app-footer a {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s;
  }

  .app-footer a:hover {
    color: var(--text-primary);
  }

  .app-footer .divider {
    display: inline-block;
    width: 1px;
    height: 10px;
    background: var(--border-hover);
    vertical-align: middle;
    margin: 0 0.75rem;
  }

  /* === Noscript === */
  .noscript-warning {
    padding: 1rem;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    text-align: center;
    font-size: 0.8125rem;
    border-bottom: 1px solid var(--border);
  }
`;
