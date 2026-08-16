import type { NextFunction, Request, Response } from 'express'

type Bucket = {
  tokens: number
  updatedAt: number
}

type TokenBucketOptions = {
  capacity: number
  refillPerSecond: number
  getEmail?: (req: Request) => string | undefined
}

const buckets = new Map<string, Bucket>()

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown'
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function refill(bucket: Bucket, capacity: number, refillPerSecond: number, now: number) {
  const elapsedSeconds = (now - bucket.updatedAt) / 1000
  if (elapsedSeconds <= 0) return

  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond)
  bucket.updatedAt = now
}

/**
 * In-memory token bucket keyed by IP + email.
 * Default: 5 tokens, refill 1 token / 60s (≈5 attempts then slow drip).
 */
export function createTokenBucketLimiter(options: TokenBucketOptions) {
  const { capacity, refillPerSecond, getEmail } = options

  return function tokenBucketLimiter(req: Request, res: Response, next: NextFunction) {
    const emailRaw = getEmail?.(req) ?? (typeof req.body?.email === 'string' ? req.body.email : '')
    const email = emailRaw.trim().toLowerCase() || 'unknown'
    const key = `${clientIp(req)}:${email}`
    const now = Date.now()

    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { tokens: capacity, updatedAt: now }
      buckets.set(key, bucket)
    } else {
      refill(bucket, capacity, refillPerSecond, now)
    }

    if (bucket.tokens < 1) {
      const secondsUntilToken = Math.ceil((1 - bucket.tokens) / refillPerSecond)
      res.setHeader('Retry-After', String(Math.max(secondsUntilToken, 1)))
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: Math.max(secondsUntilToken, 1),
      })
      return
    }

    bucket.tokens -= 1
    bucket.updatedAt = now
    next()
  }
}
