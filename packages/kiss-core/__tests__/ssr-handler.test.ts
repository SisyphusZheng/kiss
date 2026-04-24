/**
 * @kissjs/core - ssr-handler.ts tests (Deno)
 */
import { assertEquals, assertNotEquals } from 'jsr:@std/assert'
import { wrapInDocument, renderSSRError, collectIslands } from '../src/ssr-handler.ts'
import type { RouteEntry } from '../src/types.ts'

Deno.test('ssr-handler - wrapInDocument', async (t) => {
  await t.step('wraps body in full HTML document', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { title: 'Test' })
    assertEquals(html.includes('<!DOCTYPE html>'), true)
    assertEquals(html.includes('<title>Test</title>'), true)
    assertEquals(html.includes('<h1>Hello</h1>'), true)
  })

  await t.step('includes hydration script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      hydrateScript: '<script type="module">hydrate()</script>',
    })
    assertEquals(html.includes('<script type="module">hydrate()</script>'), true)
  })

  await t.step('supports custom lang attribute', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { lang: 'zh-CN' })
    assertEquals(html.includes('lang="zh-CN"'), true)
  })

  await t.step('supports meta tags', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      meta: { description: 'Test page' },
    })
    assertEquals(html.includes('name="description"'), true)
    assertEquals(html.includes('content="Test page"'), true)
  })
})

Deno.test('ssr-handler - renderSSRError', async (t) => {
  const route: RouteEntry = {
    path: '/broken',
    filePath: 'broken.ts',
    type: 'page',
    varName: 'Route_Broken',
  }

  await t.step('shows error details in dev mode', () => {
    const error = new Error('Something went wrong')
    const html = renderSSRError(error, route, true)
    assertEquals(html.includes('SSR Render Error'), true)
    assertEquals(html.includes('Something went wrong'), true)
  })

  await t.step('shows generic message in production', () => {
    const error = new Error('Something went wrong')
    const html = renderSSRError(error, route, false)
    assertEquals(html.includes('Something went wrong'), true)
    // Production error page should NOT contain "SSR Render Error"
    assertEquals(html.includes('SSR Render Error'), false)
  })
})

Deno.test('ssr-handler - collectIslands', async (t) => {
  await t.step('collects known island tags from HTML using precise map', () => {
    const knownIslands = new Map([
      ['my-counter', '/app/islands/my-counter.ts'],
      ['theme-toggle', '/app/islands/theme-toggle.ts'],
    ])
    const html = '<div><my-counter></my-counter><p>hello</p></div>'
    const islands = collectIslands(html, knownIslands)
    assertEquals(islands.length, 1)
    assertEquals(islands[0].tagName, 'my-counter')
  })

  await t.step('returns empty array when no islands found', () => {
    const knownIslands = new Map([
      ['my-counter', '/app/islands/my-counter.ts'],
    ])
    const html = '<div><p>hello</p></div>'
    const islands = collectIslands(html, knownIslands)
    assertEquals(islands.length, 0)
  })

  await t.step('does not match non-island custom elements', () => {
    const knownIslands = new Map([
      ['my-counter', '/app/islands/my-counter.ts'],
    ])
    const html = '<my-header></my-header><div>hello</div>'
    const islands = collectIslands(html, knownIslands)
    assertEquals(islands.length, 0)
  })

  await t.step('collects multiple islands', () => {
    const knownIslands = new Map([
      ['my-counter', '/app/islands/my-counter.ts'],
      ['theme-toggle', '/app/islands/theme-toggle.ts'],
    ])
    const html = '<my-counter count="5"></my-counter><theme-toggle></theme-toggle>'
    const islands = collectIslands(html, knownIslands)
    assertEquals(islands.length, 2)
  })

  await t.step('deduplicates islands', () => {
    const knownIslands = new Map([
      ['my-counter', '/app/islands/my-counter.ts'],
    ])
    const html = '<my-counter></my-counter><my-counter></my-counter>'
    const islands = collectIslands(html, knownIslands)
    assertEquals(islands.length, 1)
  })
})
