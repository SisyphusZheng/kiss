/**
 * @kissjs/core - island-transform.ts tests (Deno)
 */
import { assertEquals, assertNotEquals } from 'jsr:@std/assert'
import { islandTransformPlugin, generateHydrationScript } from '../src/island-transform.ts'

Deno.test('island-transform - islandTransformPlugin', async (t) => {
  const plugin = islandTransformPlugin('app/islands')

  await t.step('returns a Vite plugin', () => {
    assertEquals(plugin.name, 'kiss:island-transform')
    assertEquals(typeof plugin.transform, 'function')
  })

  await t.step('injects __island marker and __tagName for island files', () => {
    const transform = plugin.transform as Function
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts'
    )
    assertEquals(result.includes('export const __island = true'), true)
    assertEquals(result.includes("export const __tagName = 'my-counter'"), true)
  })

  await t.step('does NOT inject CJS-style registration code', () => {
    const transform = plugin.transform as Function
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts'
    )
    // Should NOT contain the old CJS patterns
    assertEquals(result.includes('exports.default'), false)
    assertEquals(result.includes('module.exports'), false)
  })

  await t.step('skips non-island files', () => {
    const transform = plugin.transform as Function
    const result = transform(
      'export default class Header extends LitElement {}',
      '/project/app/components/header.ts'
    )
    assertEquals(result, null)
  })

  await t.step('warns for tag names without hyphen', () => {
    const transform = plugin.transform as Function
    // When called with proper context, it returns null for no-hyphen names
    const result = transform.call(
      { warn: () => {} },
      'export default class Counter extends LitElement {}',
      '/project/app/islands/counter.ts'
    )
    assertEquals(result, null)
  })
})

Deno.test('island-transform - generateHydrationScript', async (t) => {
  await t.step('generates hydration script with island loaders', () => {
    const islands = [
      { tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' },
      { tagName: 'theme-toggle', modulePath: '/app/islands/theme-toggle.ts' },
    ]
    const script = generateHydrationScript(islands, 'lazy')
    assertEquals(script.includes('<script type="module" data-kiss-hydration>'), true)
    assertEquals(script.includes("'my-counter'"), true)
    assertEquals(script.includes("'theme-toggle'"), true)
    assertEquals(script.includes('hydrateIsland'), true)
  })

  await t.step('returns empty string for no islands', () => {
    const script = generateHydrationScript([])
    assertEquals(script, '')
  })

  await t.step('supports eager strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
    const script = generateHydrationScript(islands, 'eager')
    assertEquals(script.includes('hydrate all islands immediately'), true)
  })

  await t.step('supports visible strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
    const script = generateHydrationScript(islands, 'visible')
    assertEquals(script.includes('IntersectionObserver'), true)
  })

  await t.step('supports idle strategy', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
    const script = generateHydrationScript(islands, 'idle')
    assertEquals(script.includes('requestIdleCallback'), true)
  })

  await t.step('includes progressive enhancement fallback', () => {
    const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
    const script = generateHydrationScript(islands, 'lazy')
    assertEquals(script.includes('data-kiss-hydration-error'), true)
  })
})
