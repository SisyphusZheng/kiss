import { assertEquals } from 'jsr:@std/assert@1';

Deno.test('@openelement/core/static subpath exports expected API', async () => {
  const staticMod = await import('../src/static.ts');

  assertEquals(typeof staticMod.jsx, 'function');
  assertEquals(typeof staticMod.jsxs, 'function');
  assertEquals(typeof staticMod.jsxDEV, 'function');
  assertEquals(typeof staticMod.Fragment, 'symbol');
  assertEquals(typeof staticMod.trustedHtml, 'function');
  assertEquals(typeof staticMod.renderDsdTree, 'function');
  assertEquals(typeof staticMod.renderDsd, 'function');
  assertEquals(typeof staticMod.renderDsdStream, 'function');
  assertEquals(typeof staticMod.escapeHtml, 'function');
  assertEquals(typeof staticMod.DANGEROUS_KEYS, 'object');
  assertEquals(typeof staticMod.OpenElementError, 'function');
  assertEquals(typeof staticMod.createLogger, 'function');
  assertEquals(typeof staticMod.isSignalLike, 'function');
  assertEquals(typeof staticMod.unwrap, 'function');
  assertEquals(typeof staticMod.createContext, 'function');
  assertEquals(typeof staticMod.serializeEventMarkers, 'function');

  // Verify static render works without DOM binding imports.
  const vnode = staticMod.jsx('p', { className: 'greeting', children: 'hello' });
  const html = await staticMod.renderDsdTree(vnode);
  assertEquals(html, '<p class="greeting">hello</p>');
});

Deno.test('@openelement/core/hydrate subpath exports expected API', async () => {
  const hydrateMod = await import('../src/hydrate.ts');

  // Static surface is re-exported
  assertEquals(typeof hydrateMod.renderDsdTree, 'function');
  assertEquals(typeof hydrateMod.jsx, 'function');

  // Hydration-specific surface
  assertEquals(typeof hydrateMod.applyBindingDescriptor, 'function');
  assertEquals(typeof hydrateMod.collectEventBindings, 'function');
  assertEquals(typeof hydrateMod.hydrateEventMarkers, 'function');
  assertEquals(typeof hydrateMod.createDsdRenderRoot, 'function');
  assertEquals(typeof hydrateMod.hydrateDsdEvents, 'function');
  assertEquals(typeof hydrateMod.bindHydrateEvents, 'function');

  // v0.41.0-alpha.2: HydrationScope value object
  assertEquals(typeof hydrateMod.HydrationScope, 'function');
});

Deno.test('@openelement/core/csr subpath exports expected API', async () => {
  const csrMod = await import('../src/csr.ts');

  // Static surface is re-exported
  assertEquals(typeof csrMod.renderDsdTree, 'function');
  assertEquals(typeof csrMod.jsx, 'function');

  // CSR-specific surface
  assertEquals(typeof csrMod.applyBindingDescriptor, 'function');
  assertEquals(typeof csrMod.renderToDom, 'function');
  assertEquals(typeof csrMod.applyProps, 'function');
  assertEquals(typeof csrMod.collectPropBindings, 'function');
  assertEquals(typeof csrMod.collectEventBindings, 'function');
  assertEquals(typeof csrMod.hydrateEventMarkers, 'function');
});

Deno.test('@openelement/core (main entry) still exports all public API', async () => {
  // Import the main entry to ensure backward compatibility is preserved.
  const indexMod = await import('../src/index.ts');
  assertEquals(typeof indexMod.renderDsdTree, 'function');
  assertEquals(typeof indexMod.renderToDom, 'function');
  assertEquals(typeof indexMod.applyBindingDescriptor, 'function');
});
