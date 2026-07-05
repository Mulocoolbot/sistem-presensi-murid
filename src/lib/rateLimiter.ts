// Simple In-Memory Rate Limiter for Login/Registration endpoints
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitRecord>();

// Clean up expired cache entries periodically (every 5 minutes)
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.resetTime) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check if the request is rate-limited
 * @param ip Client IP Address
 * @param limit Max allowed attempts in the window
 * @param windowMs Time window in milliseconds (default: 1 minute)
 */
export function isRateLimited(ip: string, limit: number = 5, windowMs: number = 60 * 1000): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = cache.get(ip);

  if (!record || now > record.resetTime) {
    // Create new window
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs
    };
    cache.set(ip, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000)
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000)
    };
  }

  record.count++;
  cache.set(ip, record);

  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000)
  };
}
