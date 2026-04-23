/**
 * @kiss/vite - Error classes
 * Type-safe error hierarchy for the KISS framework.
 */

export class KissError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message)
    this.name = 'KissError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    }
  }
}

export class NotFoundError extends KissError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
  }
}

export class UnauthorizedError extends KissError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends KissError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class ValidationError extends KissError {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }>,
  ) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}

export class ConflictError extends KissError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}

export class RateLimitError extends KissError {
  constructor(public readonly retryAfter: number) {
    super('Too many requests', 'RATE_LIMITED', 429)
  }
}

export class SsrRenderError extends KissError {
  constructor(
    public readonly componentPath: string,
    public override readonly cause: Error,
  ) {
    super(`SSR render failed: ${componentPath}`, 'SSR_RENDER_ERROR', 500, false)
  }
}

export class HydrationError extends KissError {
  constructor(
    public readonly tagName: string,
    public override readonly cause: Error,
  ) {
    super(`Hydration failed for <${tagName}>`, 'HYDRATION_ERROR', 500, false)
  }
}
