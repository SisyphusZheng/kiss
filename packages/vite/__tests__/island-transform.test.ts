import { describe, it, expect } from 'vitest'
import { islandTransformPlugin } from '../src/island-transform.js'
import { generateHydrationScript } from '../src/island-transform.js'
import type { Plugin } from 'vite'

describe('island-transform', () => {
  describe('islandTransformPlugin', () => {
    const plugin = islandTransformPlugin('app/islands')

    it('returns a Vite plugin', () => {
      expect(plugin.name).toBe('hvl:island-transform')
      expect(typeof plugin.transform).toBe('function')
    })

    it('injects __island marker for island files', () => {
      const transform = plugin.transform as Function
      const result = transform(
        'export default class MyCounter extends LitElement {}',
        '/project/app/islands/my-counter.ts'
      )
      expect(result).toContain('export const __island = true')
      expect(result).toContain("export const __tagName = 'my-counter'")
    })

    it('skips non-island files', () => {
      const transform = plugin.transform as Function
      const result = transform(
        'export default class Header extends LitElement {}',
        '/project/app/components/header.ts'
      )
      expect(result).toBeNull()
    })

    it('warns for tag names without hyphen', () => {
      const transform = plugin.transform as Function
      // this.warn is not available outside Vite context, expect it to throw
      // In actual Vite, it would call this.warn() and return null
      expect(() => {
        transform.call(
          { warn: () => {} },  // mock this context
          'export default class Counter extends LitElement {}',
          '/project/app/islands/counter.ts'
        )
      }).not.toThrow()
      // When called with proper context, it returns null
      const result = transform.call(
        { warn: () => {} },
        'export default class Counter extends LitElement {}',
        '/project/app/islands/counter.ts'
      )
      expect(result).toBeNull()
    })
  })

  describe('generateHydrationScript', () => {
    it('generates hydration script with island loaders', () => {
      const islands = [
        { tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' },
        { tagName: 'theme-toggle', modulePath: '/app/islands/theme-toggle.ts' },
      ]
      const script = generateHydrationScript(islands, 'lazy')
      expect(script).toContain('<script type="module" data-hvl-hydrate>')
      expect(script).toContain("'my-counter'")
      expect(script).toContain("'theme-toggle'")
      expect(script).toContain('hydrateIsland')
    })

    it('returns empty string for no islands', () => {
      const script = generateHydrationScript([])
      expect(script).toBe('')
    })

    it('supports eager strategy', () => {
      const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
      const script = generateHydrationScript(islands, 'eager')
      expect(script).toContain('hydrate all islands immediately')
    })

    it('supports visible strategy', () => {
      const islands = [{ tagName: 'my-counter', modulePath: '/app/islands/my-counter.ts' }]
      const script = generateHydrationScript(islands, 'visible')
      expect(script).toContain('IntersectionObserver')
    })
  })
})
