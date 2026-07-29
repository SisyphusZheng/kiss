/**
 * @openelement/adapter-vite - CLI: preview built output
 *
 * #601: `vite preview` is static-only and silently wrong for dynamic routes.
 * If dist/server exists, refuse and point at `start`. Otherwise serve static.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const distDir = join(process.cwd(), 'dist');
const serverEntry = join(distDir, 'server', 'index.js');

if (import.meta.main) {
  if (!existsSync(distDir)) {
    console.error('[openElement preview] dist/ not found. Run `deno task build` first.');
    process.exit(1);
  }
  if (existsSync(serverEntry)) {
    console.error(
      '[openElement preview] This project has request-time routes (dist/server).\n' +
        '  `vite preview` cannot serve dynamic loader/action routes.\n' +
        '  Use: deno task start\n' +
        '  (or: deno run -A npm:@openelement/adapter-vite/cli/start)',
    );
    process.exit(1);
  }
  // Static-only: delegate to vite preview
  const { spawn } = await import('node:child_process');
  const child = spawn('deno', ['run', '-A', 'npm:vite', 'preview', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: false,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}
