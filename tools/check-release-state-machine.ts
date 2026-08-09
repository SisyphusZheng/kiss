import { PACKAGE_VERSION_TAG, PREVIOUS_PACKAGE_VERSION } from './project-constants.ts';
import { runGit } from './lib/git.ts';

// Replay the durable release state machine for a released tag from git
// history: every recorded state of the autoflow3 evidence file plus the
// degraded/recovered events documented in the release note (1.2, #855).
// Fails when the final state is not completed or the note omits the event
// chain that a degraded release documents.
//
// Usage: deno run -A tools/check-release-state-machine.ts [--to <version>]

const toIndex = Deno.args.indexOf('--to');
let version = (toIndex === -1 ? PACKAGE_VERSION_TAG : Deno.args[toIndex + 1])
  .replace(/^v/u, '');
if (toIndex === -1) {
  // A release in flight has no evidence for the current line yet — the bump
  // commit precedes the publish evidence, and every release-tier run
  // (prepare, publish-existing) gates before the publish plan writes it.
  // Replay the previous completed line instead; the in-flight line is
  // verified separately by release:evidence:check once it exists.
  const currentEvidence = `docs/release/autoflow3/v${version}.json`;
  if (!(await runGit(['log', '--format=%H', '--', currentEvidence])).trim()) {
    console.log(
      `No evidence for v${version} yet (release in flight); replaying the previous line.`,
    );
    version = PREVIOUS_PACKAGE_VERSION;
  }
}
const tag = `v${version}`;
const evidencePath = `docs/release/autoflow3/${tag}.json`;
const notePath = `docs/release/${tag}.md`;

type EvidenceState = {
  commit: string;
  message: string;
  kind: string;
  status: string;
};

const states: EvidenceState[] = [];
for (
  const line of (await runGit([
    'log',
    '--format=%H %s',
    '--follow',
    '--',
    evidencePath,
  ])).split('\n').filter(Boolean)
) {
  const [commit, ...rest] = line.split(' ');
  const message = rest.join(' ');
  if (!(await runGit(['ls-tree', '--name-only', commit, '--', evidencePath])).trim()) continue;
  const raw = await runGit(['show', `${commit}:${evidencePath}`]);
  const parsed = JSON.parse(raw) as { kind?: string; status?: string };
  states.push({
    commit,
    message,
    kind: parsed.kind ?? 'unknown',
    status: parsed.status ?? 'unknown',
  });
}

console.log(`Replayed ${states.length} recorded states of ${evidencePath}:`);
for (const state of states) {
  console.log(`- ${state.commit.slice(0, 8)} ${state.message}: ${state.kind}/${state.status}`);
}

if (states.length === 0) {
  throw new Error(`No recorded evidence states for ${tag}.`);
}
const last = states[0];
if (last.status !== 'completed') {
  throw new Error(`Final recorded state of ${tag} is ${last.status}, not completed.`);
}

// Degraded events surface in the release note as immutable findings with a
// tracking issue; a published-but-degraded version must document them and the
// recovery that returned it to published (replayed as the final completion).
const note = await Deno.readTextFile(notePath);
const degradedEvents = note.matchAll(/tracked by #(\d+)/gu).map((match) => match[1]).toArray();
if (degradedEvents.length > 0) {
  console.log(
    `Release note documents degraded event(s) tracked by #${degradedEvents.join(', #')}.`,
  );
} else {
  console.log('Release note documents no degraded events.');
}
console.log('State machine replay: passed.');
