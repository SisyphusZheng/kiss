import { join } from 'node:path';
import { readdirSync } from 'node:fs';

export interface HtmlFileEntry {
  absolutePath: string;
  relativePath: string;
}

/** Single deterministic HTML walker shared by SSG and sitemap generation. */
export function walkHtmlFileEntries(root: string, relativeDir = ''): HtmlFileEntry[] {
  const files: HtmlFileEntry[] = [];
  try {
    const entries = readdirSync(join(root, relativeDir), { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relativePath = relativeDir ? join(relativeDir, entry.name) : entry.name;
      if (entry.isDirectory()) files.push(...walkHtmlFileEntries(root, relativePath));
      else if (entry.name.endsWith('.html')) {
        files.push({ absolutePath: join(root, relativePath), relativePath });
      }
    }
  } catch {
    // Output directory may not exist yet.
  }
  return files;
}
