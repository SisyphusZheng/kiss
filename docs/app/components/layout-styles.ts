/**
 * KISS Docs — Layout Styles
 *
 * Design principles (from Design Philosophy & KISS Architecture):
 * - L0 HTML5 first: <details>/<summary> for collapsible UI, no JS
 * - L1 CSS: responsive layout, theme via custom properties, transform animations
 * - Maximum whitespace — let content breathe
 * - Typography-driven hierarchy, not color
 * - Academic restraint: nothing decorative without purpose
 * - Swiss International Style: pure B&W, geometric precision
 *
 * Mobile navigation architecture:
 * - Hamburger button in header-right (L0 <details>/<summary>)
 * - Sidebar slides in from left via CSS transform (L1)
 * - Semi-transparent backdrop with opacity transition (L1)
 * - Zero JavaScript — :has() selector controls open/close state
 * - Performance: will-change + transform (GPU compositing, no reflow)
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
    height: 56px;
    gap: 1.5rem;
  }

  /* === Mobile Menu (L0: <details>/<summary>) === */
  .mobile-menu {
    display: none; /* hidden on desktop */
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0;
    list-style: none;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .mobile-menu-btn::-webkit-details-marker {
    display: none;
  }

  .mobile-menu-btn::marker {
    content: "";
  }

  .mobile-menu-btn:hover,
  .mobile-menu-btn:focus-visible {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--accent-subtle);
  }

  /* Active state when menu is open */
  .mobile-menu[open] .mobile-menu-btn {
    color: var(--text-primary);
    background: var(--accent-subtle);
    border-color: var(--border-hover);
  }

  /* === Logo === */
  .logo {
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: opacity 0.15s;
    white-space: nowrap;
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

  /* === Header Nav === */
  .header-nav {
    display: flex;
    gap: 0.125rem;
    flex: 1;
  }

  .header-nav a {
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 500;
    padding: 0.375rem 0.75rem;
    letter-spacing: 0.01em;
    transition: color 0.15s;
    border-radius: 4px;
  }

  .header-nav a:hover {
    color: var(--text-primary);
  }

  /* === Header Right === */
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  /* === GitHub Link === */
  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
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

  .github-link svg {
    flex-shrink: 0;
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
    font-size: 0;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .theme-toggle:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--accent-subtle);
  }

  /* Sun/Moon SVG icons inside toggle */
  .theme-toggle svg {
    width: 16px;
    height: 16px;
  }

  /* Default (dark): show sun (click to go light), hide moon */
  .theme-toggle .icon-sun {
    display: block;
  }

  .theme-toggle .icon-moon {
    display: none;
  }

  /* Light mode: show moon (click to go dark), hide sun */
  .theme-toggle.is-light .icon-sun {
    display: none;
  }

  .theme-toggle.is-light .icon-moon {
    display: block;
  }

  /* === Sidebar (Desktop) === */
  .docs-sidebar {
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

  .nav-section {
    margin-bottom: 1.25rem;
  }

  .nav-section summary {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    padding: 0 1.25rem;
    margin-bottom: 0.375rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    user-select: none;
  }

  .nav-section summary::-webkit-details-marker {
    display: none;
  }

  .nav-section summary::marker {
    content: "";
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
    font-weight: 500;
  }

  /* === Mobile Backdrop (always exists, opacity-controlled) === */
  .mobile-backdrop {
    position: fixed;
    inset: 0;
    top: 56px;
    background: rgba(0, 0, 0, 0.4);
    z-index: 80;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
  }

  /* === Mobile Responsive (L1: CSS @media + :has() + transform) === */
  @media (max-width: 900px) {
    /* Show hamburger button in header-right */
    .mobile-menu {
      display: block;
    }

    /* Header: compact layout */
    .header-inner {
      padding: 0 1rem;
      gap: 0.75rem;
    }

    /* Hide header nav and github text on mobile */
    .header-nav {
      display: none;
    }

    .github-text {
      display: none;
    }

    /* Header right: tighter gap on mobile */
    .header-right {
      gap: 0.375rem;
    }

    /* Sidebar: slide-in drawer from left — L0 + L1, zero JS */
    /* Performance: transform + will-change = GPU compositing, no reflow */
    .docs-sidebar {
      position: fixed;
      top: 56px;
      left: 0;
      width: min(300px, 80vw);
      height: calc(100vh - 56px);
      z-index: 90;
      background: var(--bg-base);
      border-right: 1px solid var(--border);
      border-bottom: none;
      padding: 1rem 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;

      /* Slide animation */
      transform: translateX(-101%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;

      /* Shadow when open */
      box-shadow: none;
    }

    /* L1: :has() selector — when hamburger is open, slide sidebar in */
    /* KISS Architecture: L0 (details/summary) + L1 (:has() + transform) = zero JS menu */
    .app-layout:has(.mobile-menu[open]) .docs-sidebar {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    /* Backdrop: fade in when menu open */
    .app-layout:has(.mobile-menu[open]) .mobile-backdrop {
      opacity: 1;
      pointer-events: auto;
    }

    .nav-section {
      margin-bottom: 0.375rem;
    }

    .nav-section summary {
      padding: 0.5rem 1rem;
      font-size: 0.6875rem;
    }

    .docs-sidebar a {
      padding: 0.5rem 1rem 0.5rem 1.75rem;
      font-size: 0.875rem;
    }

    /* Layout main fills full width on mobile */
    .layout-main {
      width: 100%;
    }

    /* Footer compact on mobile */
    .app-footer footer {
      padding: 1.5rem 1rem;
    }

    .app-footer .divider {
      display: none;
    }

    .app-footer p {
      line-height: 1.8;
    }
  }

  @media (max-width: 480px) {
    .logo-sub {
      display: none;
    }

    .github-link {
      padding: 0.375rem;
      border: none;
    }

    .header-inner {
      padding: 0 0.75rem;
    }
  }

  /* === Footer === */
  .app-footer footer {
    padding: 2rem;
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
