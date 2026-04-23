import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { scanRoutes, scanIslands, generateRoutesModule, generateIslandsModule, fileToTagName } from '../src/route-scanner.js'

const FIXTURES_DIR = join(process.cwd(), '__test_fixtures__')

describe('route-scanner', () => {
  beforeAll(async () => {
    // Create test fixtures
    await mkdir(join(FIXTURES_DIR, 'routes-basic'), { recursive: true })
    await mkdir(join(FIXTURES_DIR, 'routes-dynamic', 'posts'), { recursive: true })
    await mkdir(join(FIXTURES_DIR, 'routes-api', 'api'), { recursive: true })
    await mkdir(join(FIXTURES_DIR, 'islands'), { recursive: true })

    // Basic routes
    await writeFile(join(FIXTURES_DIR, 'routes-basic', 'index.ts'), 'export default {}')
    await writeFile(join(FIXTURES_DIR, 'routes-basic', 'about.ts'), 'export default {}')

    // Dynamic routes
    await writeFile(join(FIXTURES_DIR, 'routes-dynamic', 'index.ts'), 'export default {}')
    await writeFile(join(FIXTURES_DIR, 'routes-dynamic', 'posts', '[id].ts'), 'export default {}')

    // API routes
    await writeFile(join(FIXTURES_DIR, 'routes-api', 'index.ts'), 'export default {}')
    await writeFile(join(FIXTURES_DIR, 'routes-api', 'api', 'posts.ts'), 'export default {}')

    // Islands
    await writeFile(join(FIXTURES_DIR, 'islands', 'my-counter.ts'), 'export default {}')
    await writeFile(join(FIXTURES_DIR, 'islands', 'theme-toggle.ts'), 'export default {}')
  })

  afterAll(async () => {
    await rm(FIXTURES_DIR, { recursive: true, force: true })
  })

  describe('scanRoutes', () => {
    it('maps index.ts to /', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
      const indexRoute = routes.find(r => r.path === '/')
      expect(indexRoute).toBeDefined()
      expect(indexRoute?.filePath).toBe('index.ts')
      expect(indexRoute?.type).toBe('page')
    })

    it('maps about.ts to /about', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
      const aboutRoute = routes.find(r => r.path === '/about')
      expect(aboutRoute).toBeDefined()
      expect(aboutRoute?.filePath).toBe('about.ts')
    })

    it('maps [id].ts to /:id', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'))
      const dynamicRoute = routes.find(r => r.path === '/posts/:id')
      expect(dynamicRoute).toBeDefined()
      expect(dynamicRoute?.filePath).toBe('posts/[id].ts')
    })

    it('classifies api/ files as API routes', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-api'))
      const apiRoute = routes.find(r => r.type === 'api')
      expect(apiRoute).toBeDefined()
      expect(apiRoute?.path).toBe('/api/posts')
    })

    it('returns empty array for non-existent directory', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'non-existent'))
      expect(routes).toEqual([])
    })

    it('sorts static routes before dynamic', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-dynamic'))
      const paths = routes.map(r => r.path)
      const staticIndex = paths.indexOf('/')
      const dynamicIndex = paths.indexOf('/posts/:id')
      expect(staticIndex).toBeLessThan(dynamicIndex)
    })
  })

  describe('scanIslands', () => {
    it('lists island files', async () => {
      const islands = await scanIslands(join(FIXTURES_DIR, 'islands'))
      expect(islands).toContain('my-counter.ts')
      expect(islands).toContain('theme-toggle.ts')
    })

    it('returns empty for non-existent directory', async () => {
      const islands = await scanIslands(join(FIXTURES_DIR, 'non-existent'))
      expect(islands).toEqual([])
    })
  })

  describe('generateRoutesModule', () => {
    it('generates valid JS module code', async () => {
      const routes = await scanRoutes(join(FIXTURES_DIR, 'routes-basic'))
      const code = generateRoutesModule(routes, 'app/routes')
      expect(code).toContain('export const routes')
      expect(code).toContain("path: '/'")
      expect(code).toContain("path: '/about'")
      expect(code).toContain('pageRoutes')
      expect(code).toContain('apiRoutes')
    })
  })

  describe('generateIslandsModule', () => {
    it('generates island module code', () => {
      const code = generateIslandsModule('app/islands', ['my-counter.ts', 'theme-toggle.ts'])
      expect(code).toContain('export const islands')
      expect(code).toContain("tagName: 'my-counter'")
      expect(code).toContain("tagName: 'theme-toggle'")
      expect(code).toContain('islandTagNames')
    })
  })

  describe('fileToTagName', () => {
    it('converts file name to tag name', () => {
      expect(fileToTagName('my-counter.ts')).toBe('my-counter')
      expect(fileToTagName('theme-toggle.ts')).toBe('theme-toggle')
    })
  })
})
