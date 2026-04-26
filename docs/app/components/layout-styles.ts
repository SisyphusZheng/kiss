/**
 * KISS Docs — Layout Styles
 *
 * Design principles:
 * - Maximum whitespace — let content breathe
 * - Subtle borders, never heavy
 * - Typography-driven hierarchy, not color
 * - Academic restraint: nothing decorative without purpose
 *
 * Theme: Pure B&W via CSS custom properties on :root.
 * Dark and Light — toggled by [data-theme] attribute.
 */
import { css } from '@kissjs/core';

export const layoutStyles = css`
  /* === Reset === */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :host {
    display: block;
  }

  /* === Layout Shell === */
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .layout-body {
    display: flex;
    flex: 1;
  }

  .layout-main {
    flex: 1;
    min-width: 0;
  }

  .app-layout[home] .layout-body {
    display: block;
  }

  /* === Header === */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-base);
    border-bottom: 1px solid var(--border);
  }

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    height: 60px;
    gap: 2rem;
  }

  .logo {
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: opacity 0.15s;
  }

  .logo:hover {
    opacity: 0.6;
  }

  .logo-sub {
    font-size: 0.625rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 0.5rem;
    letter-spacing: 0.04em;
    text-transform: none;
  }

  .app-header nav {
    display: flex;
    gap: 0.125rem;
    flex: 1;
  }

  .app-header nav a {
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.5rem 0.875rem;
    letter-spacing: 0.01em;
    transition: color 0.15s;
    border-radius: 4px;
  }

  .app-header nav a:hover {
    color: var(--text-primary);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .github-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    transition: color 0.15s, border-color 0.15s;
  }

  .github-link:hover {
    color: var(--text-secondary);
    border-color: var(--border-hover);
  }

  /* === Theme Toggle === */
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .theme-toggle:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--accent-subtle);
  }

  /* === Sidebar === */
  .docs-sidebar {
    width: 256px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    padding: 2rem 0;
    overflow-y: auto;
    height: calc(100vh - 60px);
    position: sticky;
    top: 60px;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  .nav-section {
    margin-bottom: 1.5rem;
  }

  .nav-section summary {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    padding: 0 1.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
  }

  .nav-section summary::-webkit-details-marker {
    display: none;
  }

  .nav-section summary::before {
    content: "▾";
    font-size: 0.5rem;
    transition: transform 0.15s;
    display: inline-block;
  }

  .nav-section[open] summary::before {
    transform: rotate(0deg);
  }

  .nav-section:not([open]) summary::before {
    transform: rotate(-90deg);
  }

  .nav-section summary:hover {
    color: var(--text-tertiary);
  }

  .docs-sidebar a {
    display: block;
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.8125rem;
    padding: 0.35rem 1.5rem;
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
    font-weight: 500;
  }

  /* === Mobile Sidebar === */
  @media (max-width: 900px) {
    .docs-sidebar {
      display: block;
      width: 100%;
      height: auto;
      position: relative;
      top: 0;
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: 1rem;
    }

    .nav-section {
      margin-bottom: 0.5rem;
    }

    .nav-section summary {
      padding: 0.25rem 0.5rem;
    }

    .docs-sidebar a {
      padding: 0.25rem 0.5rem 0.25rem 1.5rem;
    }
  }

  /* === Footer === */
  .app-footer footer {
    padding: 2.5rem 2rem;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--text-muted);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    background: var(--bg-base);
  }

  .app-footer p {
    margin: 0.25rem 0;
  }

  .app-footer a {
    color: var(--text-tertiary);
    text-decoration: none;
    transition: color 0.15s;
  }

  .app-footer a:hover {
    color: var(--text-primary);
  }

  .app-footer .divider {
    display: inline-block;
    width: 1px;
    height: 8px;
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
