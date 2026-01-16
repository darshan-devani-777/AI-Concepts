require("dotenv").config();

/**
 * Simple API Gateway auth middleware.
 * Expects `x-api-key` header to match `API_GATEWAY_KEY` env var.
 */
function authMiddleware(req, res, next) {
  console.log("🛡️ [AUTH] Incoming request", {
    path: req.path,
    method: req.method,
    hasApiKeyHeader: !!req.header("x-api-key"),
  });

  const configuredKey = process.env.API_GATEWAY_KEY;

  // If no key is configured, skip auth (useful for local/dev).
  if (!configuredKey) {
    console.log("🛡️ [AUTH] No API_GATEWAY_KEY configured, skipping auth");
    return next();
  }

  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== configuredKey) {
    console.warn("🛡️ [AUTH] Unauthorized request", {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      status: false,
      message: "Unauthorized: invalid API key",
    });
  }

  console.log("🛡️ [AUTH] Authenticated request", {
    path: req.path,
    method: req.method,
  });

  return next();
}

module.exports = authMiddleware;


