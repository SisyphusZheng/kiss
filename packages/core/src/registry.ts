/**
 * @openelement/core - Local WC Package Registry
 *
 * Provides registration, lookup, validation, and indexing for
 * OpenElementPackageManifest instances. This is the foundation for
 * the v0.16 WC Package Protocol.
 *
 * The registry is local (in-process) only. Public hub support
 * is a future concern (v0.18+).
 */

import type {
  OpenElementDeclaration,
  OpenElementPackageManifest,
} from '@openelement/protocol/manifest';
import type {
  RegistryIndex,
  RegistryIndexEntry,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '@openelement/protocol/framework';

const _packages: OpenElementPackageManifest[] = [];

/** Register a package manifest with the local registry. */
export function register(manifest: OpenElementPackageManifest): void {
  const existing = _packages.find((p) => p.packageName === manifest.packageName);
  if (existing) {
    const idx = _packages.indexOf(existing);
    _packages[idx] = manifest;
  } else {
    _packages.push(manifest);
  }
}

/** Look up a declaration by its custom element tag name. */
export function getByTagName(tagName: string): OpenElementDeclaration | undefined {
  for (const pkg of _packages) {
    const decl = pkg.declarations.find((d) => d.tagName === tagName);
    if (decl) return decl;
  }
  return undefined;
}

/** Get all registered package manifests. */
export function getAll(): readonly OpenElementPackageManifest[] {
  return _packages;
}

/** Validate a package manifest against the openElement protocol rules. */
export function validate(manifest: OpenElementPackageManifest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Required fields
  if (!manifest.packageName) {
    errors.push({
      code: 'MISSING_PACKAGE_NAME',
      message: 'packageName is required',
      path: 'packageName',
    });
  }
  if (!manifest.version) {
    errors.push({
      code: 'MISSING_VERSION',
      message: 'version is required',
      path: 'version',
    });
  }
  if (!manifest.schemaVersion) {
    errors.push({
      code: 'MISSING_SCHEMA_VERSION',
      message: 'schemaVersion is required',
      path: 'schemaVersion',
    });
  }
  if (!manifest.declarations || manifest.declarations.length === 0) {
    errors.push({
      code: 'MISSING_DECLARATIONS',
      message: 'At least one declaration is required',
      path: 'declarations',
    });
  }

  // 2. Validate each declaration
  const tagNames = new Set<string>();
  for (let i = 0; i < (manifest.declarations ?? []).length; i++) {
    const decl = manifest.declarations[i];
    const path = `declarations[${i}]`;

    if (!decl.tagName) {
      errors.push({
        code: 'MISSING_TAG_NAME',
        message: 'tagName is required for each declaration',
        path: `${path}.tagName`,
      });
      continue;
    }

    // 3. Invalid custom element name
    if (!isValidCustomElementName(decl.tagName)) {
      errors.push({
        code: 'INVALID_TAG_NAME',
        message:
          `"${decl.tagName}" is not a valid custom element name (must contain a hyphen and start with a letter)`,
        path: `${path}.tagName`,
      });
    }

    // 5. Duplicate tag names within a package
    if (tagNames.has(decl.tagName)) {
      errors.push({
        code: 'DUPLICATE_TAG_NAME',
        message: `Duplicate tagName "${decl.tagName}" within package`,
        path: `${path}.tagName`,
      });
    }
    tagNames.add(decl.tagName);

    // 4. Unsafe module paths
    if (decl.openElement?.module) {
      if (isUnsafeModulePath(decl.openElement.module)) {
        errors.push({
          code: 'UNSAFE_MODULE_PATH',
          message: `Module path "${decl.openElement.module}" contains unsafe patterns`,
          path: `${path}.openElement.module`,
        });
      }
    }

    // 4. Invalid layer
    if (
      decl.openElement?.layer &&
      !['dsd-static', 'dsd-interactive', 'pure-island'].includes(decl.openElement.layer)
    ) {
      errors.push({
        code: 'INVALID_LAYER',
        message:
          `Invalid layer "${decl.openElement.layer}" (must be dsd-static, dsd-interactive, or pure-island)`,
        path: `${path}.openElement.layer`,
      });
    }

    // 4. Invalid hydrate strategy
    if (
      decl.openElement?.hydrate &&
      !['load', 'idle', 'visible', 'only'].includes(decl.openElement.hydrate)
    ) {
      errors.push({
        code: 'INVALID_HYDRATE_STRATEGY',
        message: `Invalid hydrate strategy "${decl.openElement.hydrate}"`,
        path: `${path}.openElement.hydrate`,
      });
    }
  }

  // 6. Unresolved export declaration references
  if (manifest.modules) {
    for (let mi = 0; mi < manifest.modules.length; mi++) {
      const mod = manifest.modules[mi];
      if (mod.declarations) {
        for (const declRef of mod.declarations) {
          const found = manifest.declarations.some(
            (d) => d.tagName === declRef || d.className === declRef,
          );
          if (!found) {
            warnings.push({
              code: 'UNRESOLVED_DECLARATION_REF',
              message:
                `Module references declaration "${declRef}" which is not in the declarations array`,
              path: `modules[${mi}].declarations`,
            });
          }
        }
      }
    }
  }

  // 7. Registry-level duplicate tag names (across packages)
  for (const decl of manifest.declarations ?? []) {
    if (!decl.tagName) continue;
    for (const existingPkg of _packages) {
      if (existingPkg.packageName === manifest.packageName) continue;
      const conflict = existingPkg.declarations.find((d) => d.tagName === decl.tagName);
      if (conflict) {
        warnings.push({
          code: 'REGISTRY_TAG_CONFLICT',
          message: `tagName "${decl.tagName}" already registered by ${existingPkg.packageName}`,
          path: `declarations[${manifest.declarations.indexOf(decl)}].tagName`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Generate an aggregated index of all registered manifests. */
export function generateIndex(): RegistryIndex {
  const entries: RegistryIndexEntry[] = [];

  for (const pkg of _packages) {
    for (const decl of pkg.declarations) {
      entries.push({
        tagName: decl.tagName,
        packageName: pkg.packageName,
        version: pkg.version,
        module: decl.openElement?.module,
        ssr: decl.openElement?.ssr,
        dsd: decl.openElement?.dsd,
        hydrate: decl.openElement?.hydrate,
      });
    }
  }

  entries.sort((a, b) => a.tagName.localeCompare(b.tagName));

  return {
    totalPackages: _packages.length,
    totalDeclarations: entries.length,
    entries,
  };
}

/** Clear all registered manifests (useful for testing). */
export function clear(): void {
  _packages.length = 0;
}

/** Check if a tag name is a valid custom element name per HTML spec. */
function isValidCustomElementName(name: string): boolean {
  // Must contain a hyphen, start with a lowercase letter, and only
  // contain allowed characters. Must not be a reserved name.
  if (!name) return false;
  const reserved = new Set([
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
  ]);
  if (reserved.has(name)) return false;
  // Basic check: starts with letter, contains hyphen, only [a-z0-9-]
  return /^[a-z][a-z0-9]*-[a-z0-9-]*$/.test(name);
}

/** Check if a module path contains unsafe patterns. */
function isUnsafeModulePath(path: string): boolean {
  // Reject paths with directory traversal, absolute paths, or protocol handlers
  if (path.startsWith('/') || path.startsWith('\\')) return true;
  if (path.includes('..')) return true;
  if (/^[a-z]+:\/\//i.test(path) && !path.startsWith('jsr:') && !path.startsWith('npm:')) {
    return true;
  }
  return false;
}
