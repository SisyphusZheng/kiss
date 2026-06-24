/**
 * Build-time generator for the @openelement/ui package manifest.
 *
 * Scans packages/ui/src/open-*.tsx, parses component metadata, and writes a
 * static JSON file to packages/ui/src/generated-manifest.json.
 *
 * This keeps runtime-free packages free of Deno.readDirSync/Deno.readFileSync.
 */

import { walkSync } from '@std/fs/walk';
import type {
  OpenElementAttribute,
  OpenElementCssPart,
  OpenElementDeclaration,
  OpenElementEvent,
  OpenElementPackageManifest,
  OpenElementSlot,
} from '@openelement/protocol/manifest';

const UI_SRC_DIR = new URL('../packages/ui/src/', import.meta.url);
const UI_DENO_JSON = new URL('../packages/ui/deno.json', import.meta.url);
const OUT_FILE = new URL('../packages/ui/src/generated-manifest.json', import.meta.url);

const pkgVersion = JSON.parse(Deno.readTextFileSync(UI_DENO_JSON)).version;

interface ComponentMeta {
  file: string;
  tagName: string;
  className: string;
  description: string;
  attributes: OpenElementAttribute[];
  events: OpenElementEvent[];
  slots: OpenElementSlot[];
  cssParts: OpenElementCssPart[];
  layer: 'dsd-static' | 'dsd-interactive';
  hydrate: 'load' | 'idle' | 'visible';
}

const COMPONENT_ORDER = [
  'open-card',
  'open-callout',
  'open-step-card',
  'open-button',
  'open-input',
  'open-theme-toggle',
  'open-code-block',
  'open-badge',
  'open-brand-mark',
  'open-lab-panel',
  'open-standards-visual',
  'open-lab-stage',
  'open-dialog',
  'open-layout',
  'open-dropdown',
  'open-modal',
  'open-tabs',
  'open-hero-ping',
];

function layerFromClass(className: string): ComponentMeta['layer'] {
  const interactive = new Set([
    'OpenButton',
    'OpenInput',
    'OpenThemeToggle',
    'OpenDialog',
    'OpenLayout',
    'OpenDropdown',
    'OpenModal',
    'OpenTabs',
    'OpenHeroPing',
  ]);
  return interactive.has(className) ? 'dsd-interactive' : 'dsd-static';
}

function hydrateFromClass(className: string): ComponentMeta['hydrate'] {
  const load = new Set([
    'OpenButton',
    'OpenInput',
    'OpenThemeToggle',
    'OpenLayout',
    'OpenDropdown',
    'OpenModal',
    'OpenTabs',
  ]);
  return load.has(className) ? 'load' : 'idle';
}

function inferAttributeType(name: string): string {
  if (
    name === 'disabled' || name === 'compact' || name === 'open' || name === 'home' ||
    name === 'required'
  ) {
    return 'boolean';
  }
  if (name === 'step') return 'number';
  if (name === 'nav-items' || name === 'header-nav' || name === 'locales') return 'array';
  return 'string';
}

function parseObservedAttributes(text: string): string[] {
  const match = text.match(/static\s+(?:override\s+)?observedAttributes\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return match[1]
    .split(/,\s*/)
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseTagName(text: string): string {
  const match = text.match(/export\s+const\s+tagName\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('Could not find tagName export');
  return match[1];
}

function parseClassName(text: string, file: string): string {
  const match = text.match(/export\s+(?:default\s+)?class\s+(\w+)\s+extends\s+OpenElement/);
  if (!match) throw new Error(`Could not find exported class in ${file}`);
  return match[1];
}

function parseCssParts(text: string): OpenElementCssPart[] {
  const parts: OpenElementCssPart[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/\*\s*@csspart\s+(\S+)\s*-+(.*)/g)) {
    const name = m[1].trim();
    const description = m[2].trim();
    if (!seen.has(name)) {
      seen.add(name);
      parts.push({ name, description });
    }
  }
  return parts;
}

function parseSlots(text: string): OpenElementSlot[] {
  const slots: OpenElementSlot[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/\*\s*@slot\s+(\S*)\s*-+(.*)/g)) {
    const name = m[1].trim();
    const description = m[2].trim();
    if (!seen.has(name)) {
      seen.add(name);
      slots.push({ name, description });
    }
  }
  if (text.includes('<slot></slot>') || text.includes('<slot ')) {
    if (!seen.has('')) {
      slots.unshift({ name: '', description: 'Default slot' });
    }
  }
  return slots;
}

function parseEvents(text: string): OpenElementEvent[] {
  const events: OpenElementEvent[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/new\s+CustomEvent\(['"]([^'"]+)['"],?\s*(?:\{([^}]*)\})?/g)) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const detail = (m[2] || '').match(/detail\s*:\s*\{([^}]*)\}/);
    events.push({
      name,
      type: detail ? `CustomEvent<{ ${detail[1].trim()} }>` : 'CustomEvent',
      description: `Fired on ${name}`,
    });
  }
  return events;
}

function parseDescription(text: string): string {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('* @openelement/ui')) {
      const next = lines[i + 1]?.replace(/^\s*\*\s?/, '').trim();
      if (next && !next.startsWith('*') && !next.startsWith('@')) return next;
    }
  }
  return '';
}

function buildMeta(file: string, source: string): ComponentMeta {
  const tagName = parseTagName(source);
  const className = parseClassName(source, file);
  const observed = parseObservedAttributes(source);
  const attributes: OpenElementAttribute[] = observed.map((name) => ({
    name,
    type: inferAttributeType(name),
    description: `${name} attribute`,
  }));

  for (const attr of attributes) {
    if (attr.type === 'boolean') {
      attr.default = 'false';
    }
  }

  return {
    file,
    tagName,
    className,
    description: parseDescription(source),
    attributes,
    events: parseEvents(source),
    slots: parseSlots(source),
    cssParts: parseCssParts(source),
    layer: layerFromClass(className),
    hydrate: hydrateFromClass(className),
  };
}

function readComponentSources(): ComponentMeta[] {
  const metas: ComponentMeta[] = [];
  for (const entry of walkSync(UI_SRC_DIR, { includeDirs: false })) {
    if (!entry.isFile || !entry.name.startsWith('open-') || !entry.name.endsWith('.tsx')) continue;
    const source = Deno.readTextFileSync(entry.path);
    if (!source.includes('extends OpenElement')) continue;
    metas.push(buildMeta(entry.name, source));
  }
  const order = new Map(COMPONENT_ORDER.map((t, i) => [t, i]));
  metas.sort((a, b) => (order.get(a.tagName) ?? 999) - (order.get(b.tagName) ?? 999));
  return metas;
}

function buildDeclaration(meta: ComponentMeta): OpenElementDeclaration {
  return {
    tagName: meta.tagName,
    className: meta.className,
    superclassName: 'OpenElement',
    description: meta.description,
    attributes: meta.attributes.length ? meta.attributes : undefined,
    events: meta.events.length ? meta.events : undefined,
    slots: meta.slots.length ? meta.slots : undefined,
    cssParts: meta.cssParts.length ? meta.cssParts : undefined,
    openElement: {
      ssr: true,
      dsd: true,
      layer: meta.layer,
      hydrate: meta.hydrate,
      module: `@openelement/ui/${meta.file.replace(/\.tsx$/, '')}`,
      export: meta.className,
    },
  };
}

function buildManifest(): OpenElementPackageManifest {
  const metas = readComponentSources();
  const declarations = metas.map(buildDeclaration);
  const modules = metas.map((meta) => ({
    path: `./${meta.file.replace(/\.tsx$/, '.js')}`,
    exports: [{ name: meta.className, path: `./${meta.file.replace(/\.tsx$/, '.js')}` }],
    declarations: [meta.tagName],
  }));

  return {
    schemaVersion: '1.0.0',
    packageName: '@openelement/ui',
    version: pkgVersion,
    description: 'Open Props Web Component library for openElement',
    author: 'openElement',
    license: 'MIT',
    homepage: 'https://openelement.org',
    repository: 'https://github.com/open-element/openelement',
    declarations,
    modules,
  };
}

const manifest = buildManifest();
Deno.writeTextFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${manifest.declarations.length} declarations to ${OUT_FILE.pathname}`);
