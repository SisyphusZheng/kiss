import { join, resolve } from 'node:path';
import { CREATE_VERSION } from './version.ts';

export interface ProductVersions {
  app: string;
  adapterVite: string;
  element: string;
}

/**
 * The published starter relies on the five-package same-version release
 * invariant. Package-graph and release-prepare gates verify that invariant;
 * Create deliberately has no runtime registry fallback or mixed-version mode.
 * Caller-supplied versions are validated by `buildTemplates` below.
 */
export function resolveVersions(): ProductVersions {
  return {
    app: CREATE_VERSION,
    adapterVite: CREATE_VERSION,
    element: CREATE_VERSION,
  };
}

export function assertUnifiedProductVersions(versions: ProductVersions): ProductVersions {
  const observed = [...new Set(Object.values(versions))];
  if (observed.length !== 1) {
    throw new Error(
      `Create requires the five-package same-version release invariant; observed ${
        observed.join(', ')
      }`,
    );
  }
  return versions;
}

// [sourceTemplate, targetRelativePath] pairs. The starter manifest is stored
// as deno.json.tmpl so deno does not treat the templates/ directory as a
// nested workspace config; it is renamed to deno.json when written.
export const TEMPLATE_FILES: readonly (readonly [string, string])[] = [
  // npm tarballs omit dotfiles even when a directory is included. Keep the
  // template non-hidden and write the expected dotfile into generated apps.
  ['gitignore.tmpl', '.gitignore'],
  ['public/openelement-mark.svg', 'public/openelement-mark.svg'],
  ['content/blog/welcome.md', 'content/blog/welcome.md'],
  ['deno.json.tmpl', 'deno.json'],
  ['vite.config.ts', 'vite.config.ts'],
  ['app/components/app-shell.tsx', 'app/components/app-shell.tsx'],
  ['app/routes/index.tsx', 'app/routes/index.tsx'],
  ['app/routes/freshness.tsx', 'app/routes/freshness.tsx'],
  ['app/routes/contact.tsx', 'app/routes/contact.tsx'],
  ['app/routes/api/health.ts', 'app/routes/api/health.ts'],
  ['app/islands/my-counter.tsx', 'app/islands/my-counter.tsx'],
];

function versionTokens(v: ProductVersions): Record<string, string> {
  return {
    '${v.app}': v.app,
    '${v.adapterVite}': v.adapterVite,
    '${v.element}': v.element,
  };
}

export async function buildTemplates(v: ProductVersions): Promise<Record<string, string>> {
  assertUnifiedProductVersions(v);
  const templatesDir = resolve(import.meta.dirname!, '..', 'templates');
  const tokens = versionTokens(v);
  const entries = await Promise.all(TEMPLATE_FILES.map(async ([source, target]) => {
    let content = await Deno.readTextFile(join(templatesDir, source));
    for (const [token, value] of Object.entries(tokens)) {
      if (content.includes(token)) content = content.split(token).join(value);
    }
    if (content.includes('${v.')) {
      throw new Error(`Unresolved package-version token in starter template: ${source}`);
    }
    return [target, content] as const;
  }));
  entries.sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}
