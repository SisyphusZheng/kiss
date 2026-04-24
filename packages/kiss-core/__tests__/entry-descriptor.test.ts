/**
 * @kissjs/core - Entry descriptor + renderer tests (Deno)
 *
 * Tests the two-step entry pipeline:
 *   1. buildEntryDescriptor — produces structured data
 *   2. renderEntry — renders data to code string
 *
 * Also integration-tests that generateHonoEntryCode still works.
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert'
import {
  buildEntryDescriptor,
  renderEntry,
  generateHonoEntryCode,
} from '../src/hono-entry.ts'
import type { RouteEntry } from '../src/types.ts'

// ─── Test fixtures ─────────────────────────────────────────────

const sampleRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/about', filePath: 'about.ts', type: 'page', varName: 'pageAbout' },
  { path: '/api/hello', filePath: 'api/hello.ts', type: 'api', varName: 'apiHello' },
]

const islandRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
]

// ─── buildEntryDescriptor tests ────────────────────────────────

Deno.test('buildEntryDescriptor: default options produce correct structure', () => {
  const desc = buildEntryDescriptor(sampleRoutes)

  assertEquals(desc.isSSG, false)
  assertEquals(desc.apiRoutes.length, 1)
  assertEquals(desc.pageRoutes.length, 2)
  assertEquals(desc.middleware.length, 4) // requestId, logger, cors, securityHeaders
  assertEquals(desc.debugRoutes?.length, 3) // all 3 non-special routes
  assertEquals(desc.document.lang, 'en')
  assertEquals(desc.document.title, 'KISS App')
  assertEquals(desc.document.headExtras, '')
})

Deno.test('buildEntryDescriptor: SSG mode sets isSSG and omits debugRoutes', () => {
  const desc = buildEntryDescriptor(sampleRoutes, { ssg: true })

  assertEquals(desc.isSSG, true)
  assertEquals(desc.debugRoutes, undefined)
})

Deno.test('buildEntryDescriptor: middleware can be disabled', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { cors: false, requestId: false },
  })

  const kinds = desc.middleware.map(m => m.kind)
  assertEquals(kinds.includes('cors'), false)
  assertEquals(kinds.includes('requestId'), false)
  assertEquals(kinds.includes('logger'), true)
  assertEquals(kinds.includes('securityHeaders'), true)
})

Deno.test('buildEntryDescriptor: custom CORS origin is serialized', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { corsOrigin: 'https://example.com' },
  })

  const corsMw = desc.middleware.find(m => m.kind === 'cors')
  assertEquals(corsMw?.config?.corsOrigin, 'https://example.com')
})

Deno.test('buildEntryDescriptor: array CORS origin is preserved', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { corsOrigin: ['https://a.com', 'https://b.com'] },
  })

  const corsMw = desc.middleware.find(m => m.kind === 'cors')
  assertEquals(corsMw?.config?.corsOrigin, ['https://a.com', 'https://b.com'])
})

Deno.test('buildEntryDescriptor: function CORS origin is serialized', () => {
  const originFn = (origin: string) => origin.endsWith('.example.com') ? origin : ''
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { corsOrigin: originFn },
  })

  const corsMw = desc.middleware.find(m => m.kind === 'cors')
  const corsOrigin = corsMw?.config?.corsOrigin
  if (corsOrigin && typeof corsOrigin === 'object' && !Array.isArray(corsOrigin)) {
    assertEquals(corsOrigin.type, 'function')
    assertStringIncludes(corsOrigin.body, 'example.com')
  } else {
    throw new Error('Expected function-type CorsOriginConfig')
  }
})

Deno.test('buildEntryDescriptor: custom html config is applied', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    html: { lang: 'zh-CN', title: '我的应用' },
    headExtras: '<link rel="stylesheet" href="https://cdn.example.com/styles.css" />',
  })

  assertEquals(desc.document.lang, 'zh-CN')
  assertEquals(desc.document.title, '我的应用')
  assertStringIncludes(desc.document.headExtras, 'cdn.example.com')
})

Deno.test('buildEntryDescriptor: islands are mapped correctly', () => {
  const desc = buildEntryDescriptor(islandRoutes, {
    islandTagNames: ['my-counter', 'theme-toggle'],
    islandsDir: 'app/islands',
  })

  assertEquals(desc.islands.length, 2)
  assertEquals(desc.islands[0].tagName, 'my-counter')
  assertEquals(desc.islands[0].modulePath, '/app/islands/my-counter.ts')
  assertEquals(desc.islands[1].tagName, 'theme-toggle')
})

Deno.test('buildEntryDescriptor: route import paths include routesDir', () => {
  const desc = buildEntryDescriptor(sampleRoutes, { routesDir: 'app/routes' })

  assertEquals(desc.apiRoutes[0].importPath, '/app/routes/api/hello.ts')
  assertEquals(desc.pageRoutes[0].importPath, '/app/routes/index.ts')
})

// ─── renderEntry tests ─────────────────────────────────────────

Deno.test('renderEntry: produces valid module code', () => {
  const desc = buildEntryDescriptor(sampleRoutes)
  const code = renderEntry(desc)

  assertStringIncludes(code, "import { Hono } from 'hono'")
  assertStringIncludes(code, "import { render } from '@lit-labs/ssr'")
  assertStringIncludes(code, 'export default app')
  assertStringIncludes(code, 'const app = new Hono()')
})

Deno.test('renderEntry: SSG mode includes DOM shim import', () => {
  const desc = buildEntryDescriptor(sampleRoutes, { ssg: true })
  const code = renderEntry(desc)

  assertStringIncludes(code, "import '@lit-labs/ssr/lib/install-global-dom-shim.js'")
})

Deno.test('renderEntry: SSG mode omits /__kiss debug endpoint', () => {
  const desc = buildEntryDescriptor(sampleRoutes, { ssg: true })
  const code = renderEntry(desc)

  assertEquals(code.includes("/__kiss"), false)
})

Deno.test('renderEntry: dev mode includes /__kiss debug endpoint', () => {
  const desc = buildEntryDescriptor(sampleRoutes)
  const code = renderEntry(desc)

  assertStringIncludes(code, "/__kiss")
})

Deno.test('renderEntry: API routes are registered with app.all', () => {
  const desc = buildEntryDescriptor(sampleRoutes)
  const code = renderEntry(desc)

  assertStringIncludes(code, "app.all('/api/hello'")
  assertStringIncludes(code, '$apiHello')
})

Deno.test('renderEntry: page routes use SSR helper', () => {
  const desc = buildEntryDescriptor(sampleRoutes)
  const code = renderEntry(desc)

  assertStringIncludes(code, "app.get('/'")
  assertStringIncludes(code, 'await __ssr(tag)')
  assertStringIncludes(code, 'wrapDocument(clean, islands)')
})

Deno.test('renderEntry: no process.env call in output', () => {
  const desc = buildEntryDescriptor(sampleRoutes)
  const code = renderEntry(desc)

  // Check that process.env is not used as a runtime call (only in comments is fine)
  const codeLines = code.split('\n').filter(l => !l.trimStart().startsWith('//'))
  assertEquals(codeLines.some(l => l.includes('process.env')), false)
})

Deno.test('renderEntry: custom CORS origin renders correctly', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { corsOrigin: 'https://example.com' },
  })
  const code = renderEntry(desc)

  assertStringIncludes(code, '"https://example.com"')
  // Verify no process.env call in non-comment lines
  const codeLines = code.split('\n').filter(l => !l.trimStart().startsWith('//'))
  assertEquals(codeLines.some(l => l.includes('process.env')), false)
})

Deno.test('renderEntry: document config renders correctly', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    html: { lang: 'zh-CN', title: '测试' },
    headExtras: '<link rel="stylesheet" href="https://cdn.example.com/styles.css" />',
  })
  const code = renderEntry(desc)

  assertStringIncludes(code, 'lang="zh-CN"')
  assertStringIncludes(code, '<title>测试</title>')
  assertStringIncludes(code, 'cdn.example.com')
})

// ─── Integration test: generateHonoEntryCode ───────────────────

Deno.test('generateHonoEntryCode: end-to-end produces runnable code', () => {
  const code = generateHonoEntryCode(sampleRoutes, {
    routesDir: 'app/routes',
    islandsDir: 'app/islands',
  })

  assertStringIncludes(code, "import { Hono } from 'hono'")
  assertStringIncludes(code, 'export default app')
  assertStringIncludes(code, "app.all('/api/hello'")
  assertStringIncludes(code, "app.get('/'")
  assertStringIncludes(code, "app.get('/about'")
  // No process.env call in non-comment lines
  const codeLines = code.split('\n').filter(l => !l.trimStart().startsWith('//'))
  assertEquals(codeLines.some(l => l.includes('process.env')), false)
})
