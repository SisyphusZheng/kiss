/**
 * Unified consumer qualification entry (#870-3.4): one CLI, three tiers.
 *
 *   --tier=local     workspace-source consumer build (fast, every PR)
 *   --tier=packaged  dry-run pack + packed starter SSG build + import-map check
 *   --tier=smoke     published @openelement/element npm smoke (+ CDN/Nitro)
 *
 * Additional flags are forwarded to the tier's script. The three tier scripts
 * stay independently runnable (the published-consumers workflow drives
 * consumer-smoke.ts directly); this entry only centralizes the entry points.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function tierArgs(args: string[]): { tier: string; rest: string[] } {
  let tier = 'local';
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' || args[i] === '--tier=') {
      tier = args[i + 1] ?? '';
      i++;
    } else if (args[i].startsWith('--tier=')) {
      tier = args[i].split('=')[1];
    } else {
      rest.push(args[i]);
    }
  }
  return { tier, rest };
}

async function runScript(script: string, args: string[]): Promise<void> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', script, ...args],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await command.output();
  if (code !== 0) Deno.exit(code);
}

if (import.meta.main) {
  const { tier, rest } = tierArgs(Deno.args);
  switch (tier) {
    case 'local':
      await runScript(join(here, 'consumer-local.ts'), rest);
      break;
    case 'packaged': {
      await runScript(join(here, 'consumer-packaged-starter.ts'), rest);
      await runScript(join(here, 'consumer-local.ts'), ['--packaged-import-map-check', ...rest]);
      break;
    }
    case 'smoke':
      await runScript(join(here, 'consumer-smoke.ts'), rest);
      break;
    default:
      console.error(`Unknown consumer qualification tier: ${tier}`);
      console.error('Expected one of: local, packaged, smoke.');
      Deno.exit(1);
  }
}
