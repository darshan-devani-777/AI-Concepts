const { getRedisClient } = require("./redisClient");

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60 * 10); // 10 minutes

async function getCache(key) {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);
    console.log("📦 [CACHE] GET", {
      key,
      hit: value !== null,
    });
    return value;
  } catch (err) {
    console.error("❌ Cache get error:", err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  try {
    const redis = getRedisClient();
    await redis.set(key, value, "EX", ttlSeconds);
    console.log("📦 [CACHE] SET", {
      key,
      ttlSeconds,
    });
  } catch (err) {
    console.error("❌ Cache set error:", err.message);
  }
}

module.exports = {
  getCache,
  setCache,
};


