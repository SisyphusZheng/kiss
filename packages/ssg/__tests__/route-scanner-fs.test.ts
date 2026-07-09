/**
 * @openelement/ssg/route-scanner-fs — filesystem access wrappers.
 *
 * These wrappers swallow I/O errors and return undefined so the route
 * scanner can tolerate missing/unreadable paths. This test pins that
 * contract (success path returns data, failure path returns undefined).
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { safeReadDir, safeReadFile, safeStat } from '../src/route-scanner-fs.ts';
import { join } from 'node:path';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'oe-routescannerfs-'));
}

Deno.test('safeReadFile returns file contents when present', async () => {
  const dir = tmpDir();
  try {
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'hello');
    assertEquals(await safeReadFile(file), 'hello');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('safeReadFile returns undefined for a missing file', async () => {
  const dir = tmpDir();
  try {
    assertEquals(await safeReadFile(join(dir, 'nope.txt')), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('safeReadDir returns entry names when present', async () => {
  const dir = tmpDir();
  try {
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'x.txt'), 'x');
    const names = await safeReadDir(dir);
    assert(names !== undefined);
    assertEquals(names.includes('sub'), true);
    assertEquals(names.includes('x.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('safeReadDir returns undefined for a missing directory', async () => {
  const dir = tmpDir();
  try {
    assertEquals(await safeReadDir(join(dir, 'ghost')), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('safeStat returns stats for an existing path', async () => {
  const dir = tmpDir();
  try {
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'hi');
    const stats = await safeStat(file);
    assert(stats !== undefined);
    assertEquals(stats.isFile(), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('safeStat returns undefined for a missing path', async () => {
  const dir = tmpDir();
  try {
    assertEquals(await safeStat(join(dir, 'ghost')), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
