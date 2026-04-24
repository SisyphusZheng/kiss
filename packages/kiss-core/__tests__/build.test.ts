/**
 * @kissjs/core - build / entry-generators tests (Deno)
 *
 * Tests the pure functions from entry-generators.ts (no Vite dependency).
 * buildPlugin itself requires Vite runtime and is better suited for E2E tests.
 */
import { assertStringIncludes } from 'jsr:@std/assert@^1.0.0'
import { generateServerEntry, generateClientEntry } from '../src/entry-generators.ts'

Deno.test('build - generateServerEntry', async (t) => {
  await t.step('generates valid Hono server entry', () => {
    const code = generateServerEntry('app/routes')
    assertStringIncludes(code, "import { Hono } from 'hono'")
    assertStringIncludes(code, 'const app = new Hono()')
    assertStringIncludes(code, 'export default app')
  })

  await t.step('includes middleware setup', () => {
    const code = generateServerEntry('app/routes')
    assertStringIncludes(code, "import { logger } from 'hono/logger'")
    assertStringIncludes(code, "import { requestId } from 'hono/request-id'")
  })
})

Deno.test('build - generateClientEntry', async (t) => {
  await t.step('returns empty comment when no islands', () => {
    const code = generateClientEntry('app/islands', [])
    assertStringIncludes(code, 'No islands detected')
  })

  await t.step('generates imports for island files', () => {
    const code = generateClientEntry('app/islands', ['my-counter.ts', 'theme-toggle.ts'])
    assertStringIncludes(code, "import Island_0 from './app/islands/my-counter.ts'")
    assertStringIncludes(code, "import Island_1 from './app/islands/theme-toggle.ts'")
  })

  await t.step('generates customElements.define() registrations', () => {
    const code = generateClientEntry('app/islands', ['my-counter.ts'])
    assertStringIncludes(code, "customElements.get('my-counter')")
    assertStringIncludes(code, "customElements.define('my-counter'")
  })

  await t.step('guards against duplicate registration', () => {
    const code = generateClientEntry('app/islands', ['my-counter.ts'])
    assertStringIncludes(code, "if (!customElements.get('my-counter'))")
  })
})
