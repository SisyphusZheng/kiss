/**
 * @kissjs/core - Entry Generators
 * Pure functions that generate auto-entry code strings.
 * No Vite dependency — safe to import in tests.
 *
 * DIA: generateServerEntry() removed — no runtime server.
 * Only generateClientEntry() remains for Island client bundle.
 */

/** Generate the client entry point file content (when no custom client.ts is provided).
 * Imports all island components and registers them as custom elements. */
export function generateClientEntry(islandsDir: string, islandFiles: string[]): string {
  if (islandFiles.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n';
  }

  const imports = islandFiles
    .map((f, i) => {
      return `import Island_${i} from './${islandsDir}/${f}';`;
    })
    .join('\n');

  const registrations = islandFiles
    .map((f, i) => {
      const tagName = f.replace(/\.[^.]+$/, '');
      return `if (!customElements.get('${tagName}')) customElements.define('${tagName}', Island_${i});`;
    })
    .join('\n  ');

  return `// KISS Client Entry (auto-generated — DIA: Islands only)
${imports}

// Register all island custom elements
${registrations}
`;
}
