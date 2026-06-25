/**
 * @openelement/core/hydrate - Client runtime for third-party frameworks.
 *
 * Lightweight entry point that scans DSD templates, upgrades custom elements,
 * and hydrates signal markers without importing @openelement/element.
 *
 * ADR-0109 alpha.4: client-runtime for Fresh, React, etc.
 */

import type { Signal } from '@openelement/protocol/signal';
import { HydrationScope } from './hydration-scope.js';

const DISPOSE_KEY = Symbol.for('openelement.hydrate.dispose');

export interface ClientRuntimeOptions {
  /** Optional CustomElementRegistry. If not provided, uses globalThis.customElements. */
  registry?: CustomElementRegistry;
}

/**
 * Walk a subtree collecting all <template shadowrootmode="open"> elements.
 * In Chromium, DSD templates are parsed and their content moved into the
 * host's shadowRoot automatically, leaving an empty template element behind.
 */
function collectDsdTemplates(root: ParentNode): HTMLTemplateElement[] {
  const results: HTMLTemplateElement[] = [];
  // Use a TreeWalker when available; fall back to manual traversal.
  if (typeof document !== 'undefined' && document.createTreeWalker) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node: Node): number {
          const el = node as Element;
          if (
            el.tagName === 'TEMPLATE' &&
            el.getAttribute('shadowrootmode') === 'open'
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      },
    );
    let n: Node | null;
    while ((n = walker.nextNode())) {
      results.push(n as HTMLTemplateElement);
    }
  } else {
    // Fallback for environments without a real TreeWalker (e.g. test doubles).
    // ponytail: walk childNodes instead of children since test doubles may not
    // implement ParentNode.children. Only process ELEMENT_NODE children.
    const walk = (node: ParentNode) => {
      const n = node as unknown as { children?: unknown[]; childNodes?: Node[] };
      const nodes: Node[] = Array.isArray(n.children)
        ? (n.children as Node[])
        : (n.childNodes ?? []);
      for (const child of nodes.filter((c: Node) => c.nodeType === 1)) {
        const el = child as Element;
        if (
          el.tagName === 'TEMPLATE' &&
          el.getAttribute('shadowrootmode') === 'open'
        ) {
          results.push(el as unknown as HTMLTemplateElement);
        }
        const cn = child as unknown as { childNodes?: Node[] };
        if (cn.childNodes) {
          walk(child as unknown as ParentNode);
        }
      }
    };
    walk(root);
  }
  return results;
}

/**
 * Create a shadow root from a DSD template's content.
 *
 * In a real browser, DSD parsing already moved the template's content into
 * the host's shadowRoot. This handles the case where that hasn't happened
 * (e.g. programmatic hydration via innerHTML or test doubles).
 */
function createShadowRootFromTemplate(
  host: Element,
  template: HTMLTemplateElement,
): ShadowRoot {
  // If the host already has a shadow root (DSD was parsed by the browser),
  // return it directly.
  const existing = (host as HTMLElement).shadowRoot;
  if (existing && existing.childNodes.length > 0) return existing;

  // Otherwise, create from template content.
  const shadow = host.attachShadow({ mode: 'open' });
  if (template.content) {
    shadow.append(...Array.from(template.content.childNodes));
  } else {
    // ponytail: template.content may not exist in test doubles; fall back to
    // moving childNodes directly. Real User-Agents always have template.content.
    while (template.firstChild) {
      shadow.appendChild(template.firstChild);
    }
  }
  return shadow;
}

/**
 * Hydrate all openElement components in a root element.
 *
 * Scans for `<template shadowrootmode="open">` declarative shadow roots,
 * upgrades custom elements, and hydrates data-signal markers.
 *
 * Returns a dispose function that cleans up all effects and event listeners.
 */
export function hydrateOpenElement(
  root: ParentNode,
  options?: ClientRuntimeOptions,
): () => void {
  const registry: CustomElementRegistry | undefined = options?.registry ??
    globalThis.customElements;
  const templates = collectDsdTemplates(root);
  const scopes: HydrationScope[] = [];

  for (const template of templates) {
    const host: Element | null = template.parentElement ?? template.parentNode as Element | null;
    if (!host || !registry) continue;

    const tagName = host.tagName.toLowerCase();
    const ctor = registry.get(tagName);
    if (!ctor) continue; // Skip non-custom-element hosts.

    const shadowRoot = createShadowRootFromTemplate(host, template);

    // Read signal registry from the upgraded element instance.
    // OpenElement sets signalRegistry in its constructor.
    const hostReg = (host as unknown as { signalRegistry?: Map<string, Signal<unknown>> })
      .signalRegistry;

    const scope = new HydrationScope({ signalRegistry: hostReg });
    scope.hydrate(shadowRoot, hostReg);
    scopes.push(scope);

    // Store disposer on the host so disposeOpenElement can find it.
    (host as unknown as Record<symbol, () => void>)[DISPOSE_KEY] = () => scope.dispose();
  }

  return () => {
    for (const scope of scopes) {
      try {
        scope.dispose();
      } catch {
        /* ignore dispose errors */
      }
    }
  };
}

/**
 * Dispose all hydrated openElement components in a root element.
 *
 * Walks the tree looking for host elements that were hydrated by
 * `hydrateOpenElement` and calls their cleanup functions.
 */
export function disposeOpenElement(root: ParentNode): void {
  // ponytail: O(n) walk without a dedicated hydration registry.
  // Use a hydration map stored on the root if per-root scoping is needed later.
  const walk = (node: Node) => {
    const el = node as Element;
    const rec = el as unknown as Record<symbol, (() => void) | undefined>;
    const disposer = rec?.[DISPOSE_KEY];
    if (disposer) {
      try {
        disposer();
      } catch {
        /* ignore dispose errors */
      }
      // Remove after use
      delete rec[DISPOSE_KEY];
    }
    // Walk children (supports both real DOM children and test double childNodes).
    const kids = el.children ?? (el.childNodes ?? []);
    for (const child of Array.from(kids)) {
      walk(child as Node);
    }
    // Also walk shadow roots recursively
    const shadow = (el as HTMLElement)?.shadowRoot;
    if (shadow) walk(shadow);
  };

  walk(root as unknown as Node);
}
