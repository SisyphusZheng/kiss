/**
 * @kiss/vite - Hono application factory
 * Creates the Hono instance with middleware stack and route handlers.
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import type { FrameworkOptions } from './types.js'

export interface KissHonoEnv {
  Variables: {
    requestId: string
  }
}

/**
 * Create the Hono app with standard middleware.
 */
export function createHonoApp(options: FrameworkOptions = {}) {
  const app = new Hono<KissHonoEnv>()

  const middleware = options.middleware ?? {}

  // 1. Request ID — base for all logging and error tracking
  if (middleware.requestId !== false) {
    app.use('*', requestId())
  }

  // 2. Logger — structured request logging
  if (middleware.logger !== false) {
    app.use('*', logger())
  }

  // 3. CORS
  if (middleware.cors !== false) {
    app.use(
      '*',
      cors({
        origin: (origin) => {
          // Dev: allow any localhost
          if (origin && /^http:\/\/localhost:\d+$/.test(origin)) return origin
          // Prod: only allow configured ORIGIN
          return process.env.ORIGIN || origin
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400,
      })
    )
  }

  // 4. Security headers
  if (middleware.securityHeaders !== false) {
    app.use('*', secureHeaders())
  }

  return app
}
