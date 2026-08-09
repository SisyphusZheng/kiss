/**
 * route-scanner: missing-tagName note suppression and dedupe.
 *
 * - definePage-style routes never export tagName; the scanner must stay
 *   silent for them (pristine starter builds must be warning-free).
 * - Plain page routes without tagName get one debug note per file per
 *   process, even when scanRoutes() runs again with a different routesDir
 *   spelling (relative vs absolute).
 */
import { assertEquals } from '@std/assert';
import { join, relative } from 'jsr:@std/path@^1.0.0';
import { scanRoutes } from '../src/internal/ssg/index.ts';

/** Run fn with console.debug captured; returns the captured messages. */
async function captureDebug(fn: () => Promise<void>): Promise<string[]> {
  const messages: string[] = [];
  const original = console.debug;
  console.debug = (msg?: unknown, ...args: unknown[]) => {
    messages.push([msg, ...args].map(String).join(' '));
  };
  try {
    await fn();
  } finally {
    console.debug = original;
  }
  return messages;
}

Deno.test('scanRoutes stays silent for definePage routes without tagName', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'oe-scan-tagname-' });
  try {
    const routesDir = join(dir, 'routes');
    await Deno.mkdir(routesDir, { recursive: true });
    // Mirrors the create-template contact.tsx: definePage, no tagName export.
    await Deno.writeTextFile(
      join(routesDir, 'contact.tsx'),
      `import { definePage } from '@openelement/app';
export default definePage({
  render() {
    return <main>contact</main>;
  },
});
`,
    );

    const messages = await captureDebug(async () => {
      const entries = await scanRoutes(routesDir);
      assertEquals(entries.length, 1);
      assertEquals(entries[0].tagName, undefined);
    });
    const notes = messages.filter((m) => m.includes('No tagName export'));
    assertEquals(notes, [], 'definePage routes must not trigger the note');
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
});

Deno.test('scanRoutes notes a plain route without tagName once across path spellings', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'oe-scan-tagname-' });
  try {
    const routesDir = join(dir, 'routes');
    await Deno.mkdir(routesDir, { recursive: true });
    // A plain function route: no definePage, no tagName.
    await Deno.writeTextFile(
      join(routesDir, 'plain.tsx'),
      `export default function Plain() {
  return <main>plain</main>;
}
`,
    );

    const relRoutesDir = relative(Deno.cwd(), routesDir);
    const messages = await captureDebug(async () => {
      await scanRoutes(routesDir); // absolute spelling
      await scanRoutes(relRoutesDir); // relative spelling — same files
    });
    const notes = messages.filter((m) => m.includes('No tagName export'));
    assertEquals(notes.length, 1, 'same file must be noted exactly once');
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
});
