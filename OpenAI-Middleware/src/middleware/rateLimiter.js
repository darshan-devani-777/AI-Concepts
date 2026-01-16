const { getRedisClient } = require("../lib/redisClient");

/**
 * Basic Redis-backed rate limiter.
 * Limit is controlled via:
 *   RATE_LIMIT_WINDOW_SEC (default: 60)
 *   RATE_LIMIT_MAX (default: 60)
 */
async function rateLimiter(req, res, next) {
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC || 60);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX || 60);

  // Use client ID if provided, otherwise IP + route.
  const clientId =
    req.header("x-client-id") ||
    req.ip ||
    req.headers["x-forwarded-for"] ||
    "anonymous";

  const key = `rate:${clientId}:${req.method}:${req.path}`;

  try {
    console.log("⏱️ [RATE] Checking rate limit", {
      clientId,
      key,
      windowSec,
      maxRequests,
    });

    const redis = getRedisClient();

    const tx = redis.multi();
    tx.incr(key);
    tx.expire(key, windowSec);
    const [count] = await tx.exec();

    const currentCount = Array.isArray(count) ? count[1] : count;

    console.log("⏱️ [RATE] Current count", {
      key,
      currentCount,
    });

    if (currentCount > maxRequests) {
      console.warn("⏱️ [RATE] Rate limit exceeded", {
        clientId,
        key,
        currentCount,
        maxRequests,
      });
      return res.status(429).json({
        status: false,
        message: "Too many requests. Please try again later.",
      });
    }

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(maxRequests - currentCount));

    console.log("⏱️ [RATE] Allowed request", {
      clientId,
      remaining: maxRequests - currentCount,
    });

    return next();
  } catch (err) {
    console.error("❌ Rate limiter error:", err.message);
    // Fail open if Redis is unavailable.
    return next();
  }
}

module.exports = rateLimiter;


