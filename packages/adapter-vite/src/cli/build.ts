/**
 * @openelement/adapter-vite - CLI: Full Static Build
 *
 * ADR 0011: One-command build entry. viteBuild() triggers Phase 1,
 * and closeBundle() in open:build plugin automatically runs Phase 2/3.
 * No orchestrator needed - all three phases run in a single viteBuild() call.
 *
 * Usage:
 *   deno run -A npm:@openelement/adapter-vite/cli/build
 *   deno task build
 */

import process from 'node:process';
import { buildApp } from '../index.ts';

if (import.meta.main) {
  try {
    await buildApp();
    process.exit(0);
  } catch (error) {
    console.error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
