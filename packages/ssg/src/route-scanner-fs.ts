/**
 * @openelement/ssg - Route scanner file-system helpers
 *
 * Thin wrappers around Node.js fs promises that swallow errors and return
 * `undefined` (or `null`) instead of throwing. Used by the route scanner to
 * keep file-system concerns separate from AST extraction and orchestration.
 */

import type { Stats } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';

/** Read a directory, returning `undefined` if it cannot be read. */
export async function safeReadDir(dirPath: string): Promise<string[] | undefined> {
  try {
    return await readdir(dirPath);
  } catch {
    return undefined;
  }
}

/** Read a text file, returning `undefined` if it cannot be read. */
export async function safeReadFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

/** Stat a path, returning `undefined` if it cannot be stated. */
export async function safeStat(filePath: string): Promise<Stats | undefined> {
  try {
    return await stat(filePath);
  } catch {
    return undefined;
  }
}
