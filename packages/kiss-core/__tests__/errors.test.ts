/**
 * @kissjs/core - errors.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0'
import {
  KissError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
  SsrRenderError,
  HydrationError,
} from '../src/errors.ts'

Deno.test('errors', async (t) => {
  await t.step('KissError has code and statusCode', () => {
    const err = new KissError('test', 'TEST_ERROR', 400)
    assertEquals(err.code, 'TEST_ERROR')
    assertEquals(err.statusCode, 400)
    assertEquals(err.isOperational, true)
    assertEquals(err.name, 'KissError')
  })

  await t.step('NotFoundError maps to 404', () => {
    const err = new NotFoundError('Post', 'abc123')
    assertEquals(err.statusCode, 404)
    assertEquals(err.code, 'NOT_FOUND')
    assertEquals(err.message.includes('Post'), true)
    assertEquals(err.message.includes('abc123'), true)
  })

  await t.step('UnauthorizedError maps to 401', () => {
    const err = new UnauthorizedError()
    assertEquals(err.statusCode, 401)
    assertEquals(err.code, 'UNAUTHORIZED')
  })

  await t.step('ForbiddenError maps to 403', () => {
    const err = new ForbiddenError()
    assertEquals(err.statusCode, 403)
  })

  await t.step('ValidationError includes details', () => {
    const details = [{ field: 'title', message: 'Required' }]
    const err = new ValidationError('Validation failed', details)
    assertEquals(err.statusCode, 422)
    assertEquals(err.details, details)
  })

  await t.step('ConflictError maps to 409', () => {
    const err = new ConflictError('Already exists')
    assertEquals(err.statusCode, 409)
  })

  await t.step('RateLimitError includes retryAfter', () => {
    const err = new RateLimitError(60)
    assertEquals(err.statusCode, 429)
    assertEquals(err.retryAfter, 60)
  })

  await t.step('SsrRenderError is not operational', () => {
    const cause = new Error('render failed')
    const err = new SsrRenderError('app/routes/index.ts', cause)
    assertEquals(err.statusCode, 500)
    assertEquals(err.isOperational, false)
    assertEquals(err.cause, cause)
  })

  await t.step('HydrationError is not operational', () => {
    const cause = new Error('already defined')
    const err = new HydrationError('my-counter', cause)
    assertEquals(err.statusCode, 500)
    assertEquals(err.isOperational, false)
  })

  await t.step('toJSON returns structured error', () => {
    const err = new NotFoundError('Post', '123')
    const json = err.toJSON()
    assertEquals(json, {
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found: 123',
      },
    })
  })
})
