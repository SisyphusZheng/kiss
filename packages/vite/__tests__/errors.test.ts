import { describe, it, expect } from 'vitest'
import {
  HvlError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
  SsrRenderError,
  HydrationError,
} from '../src/errors.js'

describe('errors', () => {
  it('HvlError has code and statusCode', () => {
    const err = new HvlError('test', 'TEST_ERROR', 400)
    expect(err.code).toBe('TEST_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.isOperational).toBe(true)
    expect(err.name).toBe('HvlError')
  })

  it('NotFoundError maps to 404', () => {
    const err = new NotFoundError('Post', 'abc123')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toContain('Post')
    expect(err.message).toContain('abc123')
  })

  it('UnauthorizedError maps to 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('ForbiddenError maps to 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
  })

  it('ValidationError includes details', () => {
    const details = [{ field: 'title', message: 'Required' }]
    const err = new ValidationError('Validation failed', details)
    expect(err.statusCode).toBe(422)
    expect(err.details).toEqual(details)
  })

  it('ConflictError maps to 409', () => {
    const err = new ConflictError('Already exists')
    expect(err.statusCode).toBe(409)
  })

  it('RateLimitError includes retryAfter', () => {
    const err = new RateLimitError(60)
    expect(err.statusCode).toBe(429)
    expect(err.retryAfter).toBe(60)
  })

  it('SsrRenderError is not operational', () => {
    const cause = new Error('render failed')
    const err = new SsrRenderError('app/routes/index.ts', cause)
    expect(err.statusCode).toBe(500)
    expect(err.isOperational).toBe(false)
    expect(err.cause).toBe(cause)
  })

  it('HydrationError is not operational', () => {
    const cause = new Error('already defined')
    const err = new HydrationError('my-counter', cause)
    expect(err.statusCode).toBe(500)
    expect(err.isOperational).toBe(false)
  })

  it('toJSON returns structured error', () => {
    const err = new NotFoundError('Post', '123')
    const json = err.toJSON()
    expect(json).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Post not found: 123',
      },
    })
  })
})
