const Redis = require("ioredis");

let client;
let bullmqClient;

/**
 * Get Redis client for general use (cache, rate limiting)
 */
function getRedisClient() {
  if (client) return client;

  const redisUrl = process.env.REDIS_URL;

  console.log("🧱 [REDIS] Initializing client", {
    usingUrl: !!redisUrl,
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
  });

  const connectionOptions = redisUrl
    ? { url: redisUrl }
    : {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT || 6379),
      };

  client = new Redis(connectionOptions);

  client.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  client.on("connect", () => {
    console.log("✅ Redis Connected...");
  });

  return client;
}

/**
 * Get Redis connection for BullMQ (requires maxRetriesPerRequest: null)
 */
function getBullMQConnection() {
  if (bullmqClient) return bullmqClient;

  const redisUrl = process.env.REDIS_URL;

  console.log("🔗 [REDIS] Initializing BullMQ connection", {
    usingUrl: !!redisUrl,
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
  });

  // BullMQ requires maxRetriesPerRequest: null
  // If using URL, pass it directly; otherwise use connection options
  if (redisUrl) {
    bullmqClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  } else {
    bullmqClient = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }

  bullmqClient.on("error", (err) => {
    console.error("❌ BullMQ Redis error:", err.message);
  });

  bullmqClient.on("connect", () => {
    console.log("✅ BullMQ Redis Connected...");
  });

  return bullmqClient;
}

module.exports = {
  getRedisClient,
  getBullMQConnection,
};


