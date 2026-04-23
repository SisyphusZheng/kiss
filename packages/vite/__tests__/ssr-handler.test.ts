import { describe, it, expect } from 'vitest'
import { wrapInDocument, renderSSRError, collectIslands } from '../src/ssr-handler.js'
import type { RouteEntry, IslandMeta } from '../src/types.js'

describe('ssr-handler', () => {
  describe('wrapInDocument', () => {
    it('wraps body in full HTML document', () => {
      const html = wrapInDocument('<h1>Hello</h1>', { title: 'Test' })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Test</title>')
      expect(html).toContain('<h1>Hello</h1>')
    })

    it('includes hydration script', () => {
      const html = wrapInDocument('<h1>Hello</h1>', {
        hydrateScript: '<script type="module">hydrate()</script>',
      })
      expect(html).toContain('<script type="module">hydrate()</script>')
    })
  })

  describe('renderSSRError', () => {
    const route: RouteEntry = {
      path: '/broken',
      filePath: 'broken.ts',
      type: 'page',
      varName: 'Route_Broken',
    }

    it('shows error details in dev mode', () => {
      const error = new Error('Something went wrong')
      const html = renderSSRError(error, route, true)
      expect(html).toContain('SSR Render Error')
      expect(html).toContain('Something went wrong')
    })

    it('shows generic message in production', () => {
      const error = new Error('Something went wrong')
      const html = renderSSRError(error, route, false)
      expect(html).toContain('Something went wrong')
      expect(html).not.toContain('SSR Render Error')
    })
  })

  describe('collectIslands', () => {
    it('collects known island tags from HTML', () => {
      const knownIslands = new Map([
        ['my-counter', '/app/islands/my-counter.ts'],
        ['theme-toggle', '/app/islands/theme-toggle.ts'],
      ])
      const html = '<div><my-counter></my-counter><p>hello</p></div>'
      const islands = collectIslands(html, knownIslands)
      expect(islands).toHaveLength(1)
      expect(islands[0].tagName).toBe('my-counter')
    })

    it('returns empty array when no islands found', () => {
      const knownIslands = new Map([
        ['my-counter', '/app/islands/my-counter.ts'],
      ])
      const html = '<div><p>hello</p></div>'
      const islands = collectIslands(html, knownIslands)
      expect(islands).toHaveLength(0)
    })
  })
})
