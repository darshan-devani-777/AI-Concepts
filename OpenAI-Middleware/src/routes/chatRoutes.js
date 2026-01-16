const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const queueController = require("../controllers/queueController");

// Streaming endpoint (existing)
router.post("/chatGPT", chatController.handleChatRequest);

// Queue endpoint (non-streaming, uses worker pool)
router.post("/chatGPT/queue", queueController.queueChatRequest);

// Queue statistics
router.get("/queue/stats", queueController.getQueueStatistics);

// Get job status
router.get("/queue/jobs/:jobId", queueController.getJobStatus);

module.exports = router;
