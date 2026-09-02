import { SourceMapConsumer } from 'source-map';
import { compileElementProgram } from '/Users/zhengzhi/Documents/projects/openelement/openelement/packages/adapter-vite/src/internal/compiler/semantic-core/compile.ts';

const FILE = '/project/app/components/map-fixture.tsx';
const SOURCE = `import { computed, element, OpenElement, property } from '@openelement/element';
import { defineIslandConfig as island } from '@openelement/app';
export const openElement = island({ hydrate: 'load', ssr: true, dsd: false });

@element('oe-map-fixture')
export class MapFixture extends OpenElement {
  @property({ reflect: true }) count = 0;
  @property({ reflect: false }) label = 'ready';
  @property({ reflect: false, attribute: false }) doubled = computed(() => this.count * 2);
  @property({ reflect: false }) config = {
    step: 1,
    parity: 'even',
  };
  @property({ reflect: false }) busy = false;
  @property({ reflect: false }) items: Array<{ id: string; text: string }> = [];

  bump(): void {
    this.count++;
  }
  bumpTwice(): void {
    this.count++;
    this.count++;
  }

  render() {
    return (
      <div class='fixture' title={this.label}>
        <h1>Count: {this.count}</h1>
        <input value={this.label} hidden={this.busy} />
        <button type='button' onClick={() => this.count++}>inc</button>
        <button type='button' onClick={() => this.count++}>inc again</button>
        <button type='button' onClick={this.bump}>method</button>
        {this.count > 0 ? <p class='parity'>positive</p> : <p class='parity'>zero</p>}
        <ul>{this.items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>
      </div>
    );
  }
}
`;

function positionOf(haystack: string, needle: string, occurrence = 1) {
  let from = 0;
  let offset = -1;
  for (let i = 0; i < occurrence; i++) {
    offset = haystack.indexOf(needle, from);
    if (offset < 0) throw new Error(`needle occurrence ${occurrence} not found: ${needle}`);
    from = offset + needle.length;
  }
  const before = haystack.slice(0, offset);
  return { line: before.split('\n').length, column: offset - (before.lastIndexOf('\n') + 1) };
}

const { code, map } = compileElementProgram(SOURCE, FILE);
// Mozilla source-map (WASM) consumer — independent of the suite's trace-mapping helper.
const consumer = await new SourceMapConsumer(JSON.parse(JSON.stringify(map)));

let failures = 0;
function check(
  label: string,
  genNeedle: string,
  genOcc: number,
  srcNeedle: string,
  srcOcc: number,
  genColumnNeedle?: string,
) {
  const gp = positionOf(code, genNeedle, genOcc);
  const lineText = code.split('\n')[gp.line - 1];
  const col = genColumnNeedle !== undefined
    ? lineText.indexOf(genColumnNeedle)
    : gp.column + (genNeedle.length - genNeedle.trimStart().length);
  const resolved = consumer.originalPositionFor({ line: gp.line, column: col });
  const sp = positionOf(SOURCE, srcNeedle, srcOcc);
  const ok = resolved.source === FILE && resolved.line === sp.line && resolved.column === sp.column;
  if (!ok) failures++;
  console.log(
    `${
      ok ? 'PASS' : 'FAIL'
    } ${label}: generated ${gp.line}:${col} -> ${resolved.source}:${resolved.line}:${resolved.column} (expected ${FILE}:${sp.line}:${sp.column})`,
  );
}

// 1. verbatim import resolves to authored line 1 col 0
check(
  'verbatim import',
  `import { computed, OpenElement } from '@openelement/element';`,
  1,
  `import { computed, element, OpenElement, property } from '@openelement/element';`,
  1,
);
// 2. MANDATORY duplicate-line vector: two byte-identical generated handlers
check(
  'duplicate handler #1',
  '__compiledEvent0(): void { this.count++; }',
  1,
  '() => this.count++',
  1,
);
check(
  'duplicate handler #2',
  '__compiledEvent1(): void { this.count++; }',
  1,
  '() => this.count++',
  2,
);
// 3. the two resolved origins must differ
const g0 = positionOf(code, '__compiledEvent0(): void { this.count++; }', 1);
const g1 = positionOf(code, '__compiledEvent1(): void { this.count++; }', 1);
const l0 = code.split('\n')[g0.line - 1];
const r0 = consumer.originalPositionFor({ line: g0.line, column: l0.indexOf('__compiledEvent0') });
const r1 = consumer.originalPositionFor({
  line: g1.line,
  column: code.split('\n')[g1.line - 1].indexOf('__compiledEvent1'),
});
const distinct = r0.line !== r1.line;
console.log(
  `${
    distinct ? 'PASS' : 'FAIL'
  } duplicate-line distinctness: event0 -> ${r0.source}:${r0.line}:${r0.column}, event1 -> ${r1.source}:${r1.line}:${r1.column}`,
);
if (!distinct) failures++;
consumer.destroy();
if (failures > 0) {
  console.error(`FAILURES: ${failures}`);
  Deno.exit(1);
}
console.log('ALL INDEPENDENT SOURCE-MAP RESOLUTIONS PASS');
