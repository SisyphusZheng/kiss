import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  scanLegacyAbsence,
  type LegacyAbsenceViolation,
} from '../../check-v044-legacy-absence.ts';
import { migrateV043Source, type MigrationDiagnostic } from './migrate.ts';

Deno.test('v0.44 migration converts literal legacy registration and is idempotent', () => {
  const source = [
    "import { defineCustomElement, OpenElement } from '@openelement/element';",
    "const tagName = 'oe-legacy-counter';",
    'export class Counter extends OpenElement {',
    '  render() { return <button>Count</button>; }',
    '}',
    'defineCustomElement(tagName, Counter);',
  ].join('\n');

  const result = migrateV043Source(source, 'counter.tsx');
  assertEquals(result.diagnostics, []);
  assertEquals(result.changed, true);
  assertStringIncludes(result.code, "@element('oe-legacy-counter')");
  assertStringIncludes(
    result.code,
    "import { element, OpenElement } from '@openelement/element';",
  );
  assert(!result.code.includes('defineCustomElement'));
  assert(!result.code.includes('customElements.define'));

  const again = migrateV043Source(result.code, 'counter.tsx');
  assertEquals(again.diagnostics, []);
  assertEquals(again.changed, false);
  assertEquals(again.code, result.code);
});

Deno.test('v0.44 migration lowers a prop-free defineElement object deterministically', () => {
  const source = [
    "import { defineElement } from '@openelement/element';",
    'const styles = new StyleSheet();',
    'export const LegacyCard = defineElement(\'oe-legacy-card\', {',
    '  styles,',
    '  render() { return <article>Card</article>; },',
    '});',
  ].join('\n');

  const result = migrateV043Source(source, 'card.tsx');
  assertEquals(result.diagnostics, []);
  assertEquals(result.changed, true);
  assertStringIncludes(result.code, "@element('oe-legacy-card')");
  assertStringIncludes(result.code, 'export class LegacyCard extends OpenElement');
  assertStringIncludes(result.code, 'static styles = styles;');
  assertStringIncludes(result.code, 'render() { return <article>Card</article>; }');
  assertStringIncludes(
    result.code,
    "import { element, OpenElement } from '@openelement/element';",
  );
  assert(!result.code.includes('defineElement'));
});

Deno.test('v0.44 migration reports non-literal registration for manual repair', () => {
  const source = [
    "import { OpenElement } from '@openelement/element';",
    'declare function resolveTag(): string;',
    'class Counter extends OpenElement { render() { return <div />; } }',
    'customElements.define(resolveTag(), Counter);',
  ].join('\n');

  const result = migrateV043Source(source, 'unsafe.tsx');
  assertEquals(result.changed, false);
  assertEquals(result.code, source);
  assert(
    result.diagnostics.some((diagnostic: MigrationDiagnostic) => diagnostic.code === 'OE-MIGRATE-001'),
  );
  assertStringIncludes(result.diagnostics[0].message, 'literal custom-element tag');
  assertEquals(result.diagnostics[0].line, 4);
});

Deno.test('v0.44 legacy absence scan rejects runtime symbols and private imports', () => {
  const clean = scanLegacyAbsence([{
    path: 'dist/generated-counter.js',
    text: "import { mountCompiledElement } from './runtime.js';\nexport { mountCompiledElement };",
  }]);
  assertEquals(clean, []);

  const violations = scanLegacyAbsence([{
    path: 'dist/legacy.js',
    text: [
      "import { HydrationScope } from './internal/core/hydration-scope.ts';",
      'const descriptor: BindingDescriptor = createDescriptor();',
      'function renderToDom(vnode: VNode) { return vnode; }',
    ].join('\n'),
  }]);
  assert(violations.some((violation: LegacyAbsenceViolation) => violation.rule === 'legacy-vnode'));
  assert(violations.some((violation: LegacyAbsenceViolation) => violation.rule === 'legacy-binding'));
  assert(
    violations.some((violation: LegacyAbsenceViolation) => violation.rule === 'legacy-hydration'),
  );
  assert(
    violations.some((violation: LegacyAbsenceViolation) => violation.rule === 'private-runtime-import'),
  );
});
