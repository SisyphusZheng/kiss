/**
 * Run Wrangler's deployment dry-run with a bounded post-completion drain.
 *
 * Wrangler 4.123 under `deno run npm:` can print its documented completion
 * marker and then retain an npm compatibility event-loop handle indefinitely
 * on macOS. This wrapper never turns a generic timeout into success: it only
 * terminates after the exact completion marker has been observed. Any error or
 * exit before that marker remains a failed gate.
 */

const COMPLETION_MARKER = '--dry-run: exiting now.';
const POST_MARKER_GRACE_MS = 1_000;

const config = Deno.args[0];
if (!config || Deno.args.length !== 1) {
  console.error('usage: run-wrangler-dry-run.ts <wrangler-config>');
  Deno.exit(2);
}

const child = new Deno.Command('deno', {
  args: [
    'run',
    '-A',
    'npm:wrangler@4.123.0',
    'deploy',
    '--dry-run',
    '--config',
    config,
  ],
  stdin: 'null',
  stdout: 'piped',
  stderr: 'piped',
}).spawn();

let markerSeen = false;
let outputTail = '';
let markComplete!: () => void;
const completed = new Promise<void>((resolve) => markComplete = resolve);

async function forward(
  source: ReadableStream<Uint8Array>,
  destination: { write(data: Uint8Array): Promise<number> },
  inspect: boolean,
): Promise<void> {
  const decoder = new TextDecoder();
  for await (const chunk of source) {
    await destination.write(chunk);
    if (!inspect || markerSeen) continue;
    outputTail = `${outputTail}${decoder.decode(chunk, { stream: true })}`.slice(-512);
    if (outputTail.includes(COMPLETION_MARKER)) {
      markerSeen = true;
      markComplete();
    }
  }
}

const drained = Promise.all([
  forward(child.stdout, Deno.stdout, true),
  forward(child.stderr, Deno.stderr, false),
]);
const statusPromise = child.status;

const outcome = await Promise.race([
  statusPromise.then((status) => ({ kind: 'exit' as const, status })),
  completed.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, POST_MARKER_GRACE_MS));
    return { kind: 'marker-grace-expired' as const };
  }),
]);

if (outcome.kind === 'exit') {
  await drained;
  if (!outcome.status.success || !markerSeen) {
    console.error(
      `Wrangler dry-run failed before a confirmed completion marker (exit ${outcome.status.code}).`,
    );
    Deno.exit(outcome.status.code || 1);
  }
} else {
  child.kill('SIGTERM');
  await statusPromise;
  await drained;
  console.warn(
    `Wrangler emitted "${COMPLETION_MARKER}" but retained its event loop; ` +
      `terminated it after ${POST_MARKER_GRACE_MS}ms.`,
  );
}

console.log('Wrangler deployment dry-run completed.');
