const { QdrantClient } = require("@qdrant/js-client-rest");

let client;

/**
 * Get or create Qdrant client instance.
 * Supports:
 * - Qdrant Cloud (QDRANT_URL + QDRANT_API_KEY)
 * - Local Qdrant (QDRANT_URL only, no API key)
 */
function getQdrantClient() {
  if (client) return client;

  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  console.log("🔍 [QDRANT] Initializing client", {
    url: qdrantUrl || "Not configured",
    hasApiKey: !!qdrantApiKey,
    mode: qdrantApiKey ? "Cloud" : qdrantUrl ? "Local" : "Not configured",
  });

  if (!qdrantUrl) {
    console.warn("⚠️ [QDRANT] QDRANT_URL not set. Qdrant features will be disabled.");
    return null;
  }

  try {
    client = qdrantApiKey
      ? new QdrantClient({
          url: qdrantUrl,
          apiKey: qdrantApiKey,
        })
      : new QdrantClient({
          url: qdrantUrl,
        });

    console.log("✅ [QDRANT] Client initialized successfully");
    return client;
  } catch (error) {
    console.error("❌ [QDRANT] Failed to initialize client:", error.message);
    return null;
  }
}

/**
 * Check if Qdrant is available and healthy
 */
async function checkQdrantHealth() {
  const qdrant = getQdrantClient();
  if (!qdrant) {
    return { available: false, message: "Qdrant not configured" };
  }

  try {
    // Try to get collections list as a health check
    await qdrant.getCollections();
    return { available: true, message: "Qdrant is healthy" };
  } catch (error) {
    return {
      available: false,
      message: `Qdrant health check failed: ${error.message}`,
    };
  }
}

module.exports = {
  getQdrantClient,
  checkQdrantHealth,
};

