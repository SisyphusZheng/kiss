/**
 * @openelement/content - File-system adapter
 *
 * Thin abstraction over process.cwd() and synchronous file writes so that
 * plugin buildStart() logic can be unit-tested with an in-memory adapter.
 */

import process from 'node:process';
import { mkdirSync, writeFileSync } from 'node:fs';

/** Minimal synchronous file-system surface used by content plugins. */
export interface FileSystemAdapter {
  cwd(): string;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  writeFileSync(path: string, data: string, encoding?: string): void;
}

/** Default adapter backed by Node.js process / fs. */
export const nodeFsAdapter: FileSystemAdapter = {
  cwd: () => process.cwd(),
  mkdirSync,
  writeFileSync: (path: string, data: string, encoding?: string) => {
    writeFileSync(path, data, encoding as BufferEncoding);
  },
};
