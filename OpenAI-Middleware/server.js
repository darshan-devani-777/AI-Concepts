const express = require("express");
const dotenv = require("dotenv");
const chatRoutes = require("./src/routes/chatRoutes");
const dlqRoutes = require("./src/routes/dlqRoutes");
const path = require("path");
const cors = require("cors");
const authMiddleware = require("./src/middleware/auth");
const rateLimiter = require("./src/middleware/rateLimiter");
const validateRequest = require("./src/middleware/validateRequest");
const { startChatWorker } = require("./src/workers/chatWorker");
const { setupBullDashboard } = require("./src/dashboard/bullDashboard");

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = ["http://localhost:9090", "http://192.168.29.81:9090"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "public")));

// Bull Board Dashboard for queue monitoring
try {
  setupBullDashboard(app);
} catch (error) {
  console.error("❌ Failed to setup Bull Board dashboard:", error.message);
}

// API Gateway-style pipeline for all /api routes:
//  - Auth (x-api-key)
//  - Rate limiting (Redis)
//  - Request validation (for chat-style payloads)
app.use("/api", authMiddleware, rateLimiter, validateRequest, chatRoutes);

// DLQ management routes (with auth, but no validation)
app.use("/api/dlq", authMiddleware, rateLimiter, dlqRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
  console.log(`📡 API Gateway: http://localhost:${PORT}/api`);
  console.log(`💀 DLQ Management: http://localhost:${PORT}/api/dlq`);
  console.log(`📊 Queue Dashboard: http://localhost:${PORT}/admin/queues`);
  
  // Start worker pool
  try {
    startChatWorker();
    console.log("👷 Worker pool started");
  } catch (error) {
    console.error("❌ Failed to start worker pool:", error.message);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  const { stopChatWorker } = require("./src/workers/chatWorker");
  await stopChatWorker();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  const { stopChatWorker } = require("./src/workers/chatWorker");
  await stopChatWorker();
  process.exit(0);
});
