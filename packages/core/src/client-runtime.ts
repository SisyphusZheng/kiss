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

const hostDisposers = new WeakMap<Element, () => void>();

interface ChildContainer {
  readonly children?: Iterable<Node>;
  readonly childNodes?: Iterable<Node>;
}

interface SignalRegistryHost {
  signalRegistry?: Map<string, Signal<unknown>>;
}

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
      const container = node as ChildContainer;
      const nodes = Array.from(container.children ?? container.childNodes ?? []);
      for (const child of nodes.filter((c: Node) => c.nodeType === 1)) {
        const el = child as Element;
        if (
          el.tagName === 'TEMPLATE' &&
          el.getAttribute('shadowrootmode') === 'open'
        ) {
          results.push(el as HTMLTemplateElement);
        }
        const childContainer = child as ChildContainer;
        if (childContainer.childNodes) {
          walk(child as ParentNode);
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

function templateHost(template: HTMLTemplateElement): Element | null {
  if (template.parentElement) return template.parentElement;
  const parent = template.parentNode;
  return parent?.nodeType === 1 ? parent as Element : null;
}

function getSignalRegistry(host: Element): Map<string, Signal<unknown>> | undefined {
  return (host as SignalRegistryHost).signalRegistry;
}

function disposeScope(scope: HydrationScope): void {
  try {
    scope.dispose();
  } catch {
    /* ignore dispose errors */
  }
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
  const hydratedHosts: Element[] = [];

  for (const template of templates) {
    const host = templateHost(template);
    if (!host || !registry) continue;

    const tagName = host.tagName.toLowerCase();
    const ctor = registry.get(tagName);
    if (!ctor) continue; // Skip non-custom-element hosts.

    const shadowRoot = createShadowRootFromTemplate(host, template);

    // Read signal registry from the upgraded element instance.
    // OpenElement sets signalRegistry in its constructor.
    const hostReg = getSignalRegistry(host);

    const scope = new HydrationScope({ signalRegistry: hostReg });
    scope.hydrate(shadowRoot, hostReg);
    scopes.push(scope);
    hydratedHosts.push(host);

    // Store disposer on the host so disposeOpenElement can find it.
    hostDisposers.set(host, () => disposeScope(scope));
  }

  return () => {
    for (const scope of scopes) {
      disposeScope(scope);
    }
    for (const host of hydratedHosts) {
      hostDisposers.delete(host);
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
  // ponytail: O(n) walk so callers can dispose an arbitrary container.
  const walk = (node: Node) => {
    const el = node as Element;
    const disposer = hostDisposers.get(el);
    if (disposer) {
      disposer();
      hostDisposers.delete(el);
    }
    // Walk children (supports both real DOM children and test double childNodes).
    const container = el as ChildContainer;
    for (const child of Array.from(container.children ?? container.childNodes ?? [])) {
      walk(child as Node);
    }
  };

  walk(root as Node);
}
