/**
 * @openelement/ui - daisyUI forked CSS classes (Pure CSS, Open Props tokens)
 *
 * Inlined at build time so consumers do not need to ship a separate CSS asset
 * and SSR bundles do not depend on a file-system path next to import.meta.url.
 */

import { StyleSheet, type StyleSheetLike } from '@openelement/element';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`/**
 * @openelement/ui - daisyUI forked CSS classes (Pure CSS, Open Props tokens)
 *
 * Forked daisyUI class semantics (btn, card, badge, alert, input, modal, menu, etc.)
 * with Tailwind token engine replaced by Open Props.
 *
 * Key rules:
 * - All selectors use \`:host\` prefix (DSD-compatible, not \`:root\`/\`html\`)
 * - All colors/spacing use \`var(--*)\` (Open Props tokens)
 * - Zero Tailwind syntax (no \`@apply\`, \`theme()\`, \`rgb()\`)
 * - Class names preserve daisyUI semantics
 */

:host {
  /* ═══════════════════════════════════════════════
     btn — daisyUI btn class set
     ═══════════════════════════════════════════════ */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
    padding: var(--btn-padding-y) var(--btn-padding-x);
    border-radius: var(--btn-radius);
    font-size: var(--btn-font-size);
    font-weight: var(--btn-font-weight);
    text-transform: var(--btn-text-case);
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--duration-2) var(--ease-1);
    line-height: 1.5;
    text-decoration: none;
    user-select: none;
    background: var(--brand);
    color: white;
  }
  .btn:hover {
    background: var(--brand-hover);
  }
  .btn:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-primary {
    background: var(--brand);
    color: white;
  }
  .btn-primary:hover {
    background: var(--brand-hover);
  }
  .btn-ghost {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border);
  }
  .btn-ghost:hover {
    background: var(--bg-hover);
  }
  .btn-outline {
    background: transparent;
    color: var(--brand);
    border-color: var(--brand);
  }
  .btn-outline:hover {
    background: var(--brand);
    color: white;
  }
  .btn-sm {
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-00);
  }
  .btn-lg {
    padding: var(--size-3) var(--size-6);
    font-size: var(--font-size-2);
  }
  .btn-wide {
    min-width: 16rem;
  }

  /* ═══════════════════════════════════════════════
     card
     ═══════════════════════════════════════════════ */
  .card {
    display: flex;
    flex-direction: column;
    border-radius: var(--card-radius);
    border: 1px solid var(--border);
    background: var(--bg-card);
    overflow: hidden;
  }
  .card-body {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    gap: var(--size-4);
  }
  .card-title {
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-6);
    color: var(--text-primary);
  }
  .card-bordered {
    border: 1px solid var(--border);
  }

  /* ═══════════════════════════════════════════════
     badge
     ═══════════════════════════════════════════════ */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: var(--badge-padding-y) var(--badge-padding-x);
    border-radius: var(--badge-radius);
    font-size: var(--badge-font-size);
    font-weight: var(--font-weight-6);
    line-height: 1;
    border: 1px solid transparent;
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .badge-primary {
    background: var(--brand);
    color: white;
  }
  .badge-success {
    background: var(--success-subtle);
    color: var(--success);
  }
  .badge-warning {
    background: var(--warning-subtle);
    color: var(--warning);
  }
  .badge-error {
    background: var(--error-subtle);
    color: var(--error);
  }
  .badge-info {
    background: var(--info-subtle);
    color: var(--info);
  }
  .badge-outline {
    background: transparent;
    border-color: currentColor;
  }

  /* ═══════════════════════════════════════════════
     alert
     ═══════════════════════════════════════════════ */
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--size-3);
    padding: var(--alert-padding);
    border-radius: var(--alert-radius);
    border: 1px solid transparent;
  }
  .alert-info {
    background: var(--info-subtle);
    color: var(--info);
    border-color: var(--info-subtle);
  }
  .alert-success {
    background: var(--success-subtle);
    color: var(--success);
    border-color: var(--success-subtle);
  }
  .alert-warning {
    background: var(--warning-subtle);
    color: var(--warning);
    border-color: var(--warning-subtle);
  }
  .alert-error {
    background: var(--error-subtle);
    color: var(--error);
    border-color: var(--error-subtle);
  }

  /* ═══════════════════════════════════════════════
     input / textarea / select
     ═══════════════════════════════════════════════ */
  .input, .textarea, .select {
    padding: var(--input-padding-y) var(--input-padding-x);
    border-radius: var(--input-radius);
    font-size: var(--input-font-size);
    border: 1px solid var(--input-border-color);
    background: var(--bg-elevated);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--duration-2) var(--ease-1);
    width: 100%;
    box-sizing: border-box;
  }
  .input:focus, .textarea:focus, .select:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px var(--brand-subtle);
  }
  .input:disabled, .textarea:disabled, .select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .input-bordered {
    border-color: var(--border);
  }
  .textarea {
    min-height: 6rem;
    resize: vertical;
  }
  .input-sm, .textarea-sm, .select-sm {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
  }

  /* ═══════════════════════════════════════════════
     divider
     ═══════════════════════════════════════════════ */
  .divider {
    display: flex;
    align-items: center;
    gap: var(--size-4);
    margin: var(--divider-margin);
    color: var(--text-muted);
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--divider-color);
  }

  /* ═══════════════════════════════════════════════
     tooltip
     ═══════════════════════════════════════════════ */
  [data-tooltip] {
    position: relative;
  }
  [data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: var(--size-2);
    padding: var(--tooltip-padding);
    border-radius: var(--tooltip-radius);
    background: var(--tooltip-bg);
    color: var(--tooltip-color);
    font-size: var(--font-size-00);
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-2) var(--ease-1);
  }
  [data-tooltip]:hover::after {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════
     modal
     ═══════════════════════════════════════════════ */
  .modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  .modal[open] {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: var(--overlay);
  }
  .modal-content {
    position: relative;
    background: var(--modal-bg);
    border-radius: var(--modal-radius);
    padding: var(--modal-padding);
    max-width: 32rem;
    width: 90%;
    box-shadow: var(--shadow-1);
  }

  /* ═══════════════════════════════════════════════
     menu
     ═══════════════════════════════════════════════ */
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: var(--menu-padding);
    border-radius: var(--menu-radius);
  }
  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--menu-item-padding);
    border-radius: var(--radius-1);
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    transition: background var(--duration-2);
  }
  .menu-item:hover {
    background: var(--bg-hover);
  }
  .menu-item.active {
    background: var(--brand-subtle);
    color: var(--brand);
  }

  /* ═══════════════════════════════════════════════
     dropdown
     ═══════════════════════════════════════════════ */
  .dropdown {
    position: relative;
    display: inline-block;
  }
  .dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 12rem;
    background: var(--dropdown-bg);
    border-radius: var(--dropdown-radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    z-index: 50;
    padding: var(--size-2);
  }
  .dropdown:focus-within .dropdown-content,
  .dropdown:hover .dropdown-content {
    display: block;
  }
  &[data-open='true'] .dropdown-content {
    display: block;
  }

  /* ═══════════════════════════════════════════════
     tabs
     ═══════════════════════════════════════════════ */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
  }
  .tab {
    padding: var(--tab-padding);
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--duration-2);
  }
  .tab:hover {
    color: var(--text-primary);
  }
  .tab-active {
    color: var(--brand);
    border-bottom-color: var(--brand);
  }

  /* ═══════════════════════════════════════════════
     Color variants — semantic token mapping (~300 lines)
     ═══════════════════════════════════════════════ */

  /* btn color variants */
  .btn-success {
    background: var(--success);
    color: white;
  }
  .btn-success:hover {
    background: color-mix(in srgb, var(--success) 80%, black);
  }
  .btn-warning {
    background: var(--warning);
    color: white;
  }
  .btn-warning:hover {
    background: color-mix(in srgb, var(--warning) 80%, black);
  }
  .btn-error {
    background: var(--error);
    color: white;
  }
  .btn-error:hover {
    background: color-mix(in srgb, var(--error) 80%, black);
  }
  .btn-info {
    background: var(--info);
    color: white;
  }
  .btn-info:hover {
    background: color-mix(in srgb, var(--info) 80%, black);
  }

  /* badge color variants */
  .badge-success {
    background: var(--success-subtle);
    color: var(--success);
  }
  .badge-warning {
    background: var(--warning-subtle);
    color: var(--warning);
  }
  .badge-error {
    background: var(--error-subtle);
    color: var(--error);
  }
  .badge-info {
    background: var(--info-subtle);
    color: var(--info);
  }

  /* alert color variants */
  .alert-success {
    background: var(--success-subtle);
    color: var(--success);
    border-color: var(--success-subtle);
  }
  .alert-warning {
    background: var(--warning-subtle);
    color: var(--warning);
    border-color: var(--warning-subtle);
  }
  .alert-error {
    background: var(--error-subtle);
    color: var(--error);
    border-color: var(--error-subtle);
  }
  .alert-info {
    background: var(--info-subtle);
    color: var(--info);
    border-color: var(--info-subtle);
  }

  /* ═══════════════════════════════════════════════
     Size system (~200 lines)
     ═══════════════════════════════════════════════ */

  /* btn sizes */
  .btn-xs {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
    border-radius: var(--radius-1);
  }
  .btn-sm {
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-00);
  }
  .btn-md {
    padding: var(--btn-padding-y) var(--btn-padding-x);
    font-size: var(--btn-font-size);
  }
  .btn-lg {
    padding: var(--size-3) var(--size-6);
    font-size: var(--font-size-2);
  }

  /* badge sizes */
  .badge-xs {
    padding: 0 var(--size-1);
    font-size: 0.625rem;
  }
  .badge-sm {
    padding: var(--badge-padding-y) var(--badge-padding-x);
    font-size: var(--badge-font-size);
  }
  .badge-lg {
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-0);
  }

  /* input sizes */
  .input-xs {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
  }
  .input-sm {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
  }
  .input-md {
    padding: var(--input-padding-y) var(--input-padding-x);
    font-size: var(--input-font-size);
  }
  .input-lg {
    padding: var(--size-3) var(--size-4);
    font-size: var(--font-size-1);
  }
  .textarea-sm {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
    min-height: 4rem;
  }
  .textarea-lg {
    padding: var(--size-3) var(--size-4);
    font-size: var(--font-size-1);
    min-height: 10rem;
  }
  .select-sm {
    padding: var(--size-1) var(--size-2);
    font-size: var(--font-size-00);
  }
  .select-lg {
    padding: var(--size-3) var(--size-4);
    font-size: var(--font-size-1);
  }

  /* card sizes */
  .card-sm {
    --card-padding: var(--size-4);
  }
  .card-sm .card-body {
    padding: var(--card-padding);
  }
  .card-lg {
    --card-padding: var(--size-8);
  }
  .card-lg .card-body {
    padding: var(--card-padding);
  }

  /* alert sizes */
  .alert-sm {
    padding: var(--size-2) var(--size-3);
    font-size: var(--font-size-00);
  }
  .alert-lg {
    padding: var(--size-6);
  }

  /* modal sizes */
  .modal-sm .modal-content {
    max-width: 24rem;
  }
  .modal-lg .modal-content {
    max-width: 48rem;
  }

  /* ═══════════════════════════════════════════════
     Layout & display classes (~200 lines)
     ═══════════════════════════════════════════════ */

  /* table */
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  .table th, .table td {
    padding: var(--size-3) var(--size-4);
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  .table th {
    font-weight: var(--font-weight-6);
    color: var(--text-secondary);
    font-size: var(--font-size-00);
  }
  .table-zebra tbody tr:nth-child(odd) {
    background: var(--bg-muted);
  }

  /* hero */
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--size-12) var(--size-6);
  }
  .hero-content {
    max-width: 48rem;
  }
  .hero-title {
    font-size: var(--font-size-6);
    font-weight: var(--font-weight-8);
    color: var(--text-primary);
    line-height: var(--font-lineheight-1);
  }
  .hero-description {
    font-size: var(--font-size-2);
    color: var(--text-secondary);
    margin-top: var(--size-4);
  }

  /* kbd */
  .kbd {
    display: inline-flex;
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
  }

  /* link */
  .link {
    color: var(--brand);
    text-decoration: underline;
    cursor: pointer;
  }
  .link:hover {
    color: var(--brand-hover);
  }

  /* loading spinner */
  .loading {
    display: inline-block;
    width: 1.5em;
    height: 1.5em;
    border: 2px solid var(--border);
    border-top-color: var(--brand);
    border-radius: 50%;
    animation: spin var(--duration-2) var(--ease-3) infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .loading-sm {
    width: 1em;
    height: 1em;
  }
  .loading-lg {
    width: 2.5em;
    height: 2.5em;
  }

  /* stats */
  .stats {
    display: flex;
    flex-wrap: wrap;
  }
  .stat {
    display: flex;
    flex-direction: column;
    padding: var(--size-4) var(--size-6);
    border: 1px solid var(--border);
  }
  .stat-title {
    font-size: var(--font-size-00);
    color: var(--text-muted);
  }
  .stat-value {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-7);
    color: var(--text-primary);
  }
  .stat-desc {
    font-size: var(--font-size-00);
    color: var(--text-secondary);
  }

  /* steps */
  .steps {
    display: flex;
  }
  .step {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    color: var(--text-muted);
  }
  .step::before {
    content: '';
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-00);
  }
  .step-primary.step-active::before {
    border-color: var(--brand);
    background: var(--brand);
    color: white;
  }
  .step-active {
    color: var(--brand);
    font-weight: var(--font-weight-6);
  }

  /* timeline */
  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--size-4);
    padding-left: var(--size-6);
    border-left: 2px solid var(--border);
  }
  .timeline-item {
    position: relative;
  }
  .timeline-item::before {
    content: '';
    position: absolute;
    left: calc(-1 * var(--size-6) - 5px);
    top: var(--size-2);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--brand);
  }
  .timeline-title {
    font-weight: var(--font-weight-6);
    color: var(--text-primary);
  }
  .timeline-desc {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
  }

  /* skeleton */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--bg-hover) 25%,
      var(--bg-surface) 50%,
      var(--bg-hover) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease infinite;
    border-radius: var(--radius-1);
  }
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  .skeleton-text {
    height: 1em;
  }
  .skeleton-title {
    height: 1.5em;
    width: 60%;
  }
  .skeleton-avatar {
    width: 3em;
    height: 3em;
    border-radius: 50%;
  }
  .skeleton-card {
    height: 12em;
  }
}
`);

export const daisyClassSheet: StyleSheetLike = sheet;
