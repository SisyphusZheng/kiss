/**
 * @kissjs/core - route-scanner.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert'
import { join } from 'jsr:@std/path'
import { scanRoutes, scanIslands, generateRoutesModule, generateIslandsModule, fileToTagName } from '../src/route-scanner.ts'

const FIXTURES_DIR = join(Deno.cwd(), 'packages/vite/__test_fixtures__')

Deno.test('route-scanner', async (t) => {
  // Setup fixtures
  await setupFixtures()

  await t.step('scanRoutes - maps index.ts to /', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
    const indexRoute = routes.find(r => r.path === '/')
    assertEquals(indexRoute !== undefined, true)
    assertEquals(indexRoute?.filePath, 'index.ts')
    assertEquals(indexRoute?.type, 'page')
  })

  await t.step('scanRoutes - maps about.ts to /about', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
    const aboutRoute = routes.find(r => r.path === '/about')
    assertEquals(aboutRoute !== undefined, true)
    assertEquals(aboutRoute?.filePath, 'about.ts')
  })

  await t.step('scanRoutes - maps [id].ts to /:id', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'))
    const dynamicRoute = routes.find(r => r.path === '/posts/:id')
    assertEquals(dynamicRoute !== undefined, true)
    assertEquals(dynamicRoute?.filePath, 'posts/[id].ts')
  })

  await t.step('scanRoutes - classifies api/ files as API routes', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-api'))
    const apiRoute = routes.find(r => r.type === 'api')
    assertEquals(apiRoute !== undefined, true)
    assertEquals(apiRoute?.path, '/api/posts')
  })

  await t.step('scanRoutes - returns empty array for non-existent directory', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'non-existent'))
    assertEquals(routes, [])
  })

  await t.step('scanRoutes - sorts static routes before dynamic', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'))
    const paths = routes.map(r => r.path)
    const staticIndex = paths.indexOf('/')
    const dynamicIndex = paths.indexOf('/posts/:id')
    assertEquals(staticIndex < dynamicIndex, true)
  })

  await t.step('scanRoutes - detects _renderer.ts as a special file', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'))
    const renderers = routes.filter(r => r.special === 'renderer')
    assertEquals(renderers.length >= 1, true)
    // Root _renderer.ts should be present
    const rootRenderer = renderers.find(r => r.filePath === '_renderer.ts')
    assertEquals(rootRenderer !== undefined, true)
  })

  await t.step('scanRoutes - detects _middleware.ts as a special file', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'))
    const middleware = routes.find(r => r.special === 'middleware')
    assertEquals(middleware !== undefined, true)
    assertEquals(middleware?.filePath, '_middleware.ts')
  })

  await t.step('scanRoutes - detects nested _renderer.ts', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'))
    const adminRenderer = routes.find(
      r => r.special === 'renderer' && r.filePath.includes('admin')
    )
    assertEquals(adminRenderer !== undefined, true)
    assertEquals(adminRenderer?.filePath, 'admin/_renderer.ts')
  })

  await t.step('scanRoutes - regular routes are not marked as special', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'))
    const regularRoutes = routes.filter(r => !r.special)
    assertEquals(regularRoutes.length > 0, true)
    for (const r of regularRoutes) {
      assertEquals(r.special, undefined)
    }
  })

  await t.step('scanIslands - lists island files', async () => {
    const islands = await scanIslands(join(FIXTURES_DIR, 'islands'))
    assertEquals(islands.includes('my-counter.ts'), true)
    assertEquals(islands.includes('theme-toggle.ts'), true)
  })

  await t.step('scanIslands - returns empty for non-existent directory', async () => {
    const islands = await scanIslands(join(FIXTURES_DIR, 'non-existent'))
    assertEquals(islands, [])
  })

  await t.step('generateRoutesModule - generates valid JS module code', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
    const code = generateRoutesModule(routes, 'app/routes')
    assertEquals(code.includes('export const routes'), true)
    assertEquals(code.includes("path: '/'"), true)
    assertEquals(code.includes("path: '/about'"), true)
    assertEquals(code.includes('pageRoutes'), true)
    assertEquals(code.includes('apiRoutes'), true)
  })

  await t.step('generateRoutesModule - includes renderers and middlewares exports', async () => {
    const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-special'))
    const code = generateRoutesModule(routes, 'app/routes')
    assertEquals(code.includes('export const renderers'), true)
    assertEquals(code.includes('export const middlewares'), true)
  })

  await t.step('generateIslandsModule - generates island module code', () => {
    const code = generateIslandsModule('app/islands', ['my-counter.ts', 'theme-toggle.ts'])
    assertEquals(code.includes('export const islands'), true)
    assertEquals(code.includes("tagName: 'my-counter'"), true)
    assertEquals(code.includes("tagName: 'theme-toggle'"), true)
    assertEquals(code.includes('islandTagNames'), true)
  })

  await t.step('fileToTagName - converts file name to tag name', () => {
    assertEquals(fileToTagName('my-counter.ts'), 'my-counter')
    assertEquals(fileToTagName('theme-toggle.ts'), 'theme-toggle')
  })

  // Cleanup fixtures
  await cleanupFixtures()
})

async function setupFixtures() {
  const dirs = [
    join(FIXTURES_DIR, 'routes-basic'),
    join(FIXTURES_DIR, 'routes-dynamic', 'posts'),
    join(FIXTURES_DIR, 'routes-api', 'api'),
    join(FIXTURES_DIR, 'routes-special', 'admin'),
    join(FIXTURES_DIR, 'islands'),
  ]
  for (const dir of dirs) {
    await Deno.mkdir(dir, { recursive: true })
  }

  // Basic routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-basic', 'index.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-basic', 'about.ts'), 'export default {}')

  // Dynamic routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-dynamic', 'index.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-dynamic', 'posts', '[id].ts'), 'export default {}')

  // API routes
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-api', 'index.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-api', 'api', 'posts.ts'), 'export default {}')

  // Special files
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', '_renderer.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', '_middleware.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', 'index.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', 'admin', '_renderer.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'routes-special', 'admin', 'dashboard.ts'), 'export default {}')

  // Islands
  await Deno.writeTextFile(join(FIXTURES_DIR, 'islands', 'my-counter.ts'), 'export default {}')
  await Deno.writeTextFile(join(FIXTURES_DIR, 'islands', 'theme-toggle.ts'), 'export default {}')
}

async function cleanupFixtures() {
  try {
    await Deno.remove(FIXTURES_DIR, { recursive: true })
  } catch {
    // Ignore cleanup errors
  }
}
