const express = require("express");
const router = express.Router();
const dlqController = require("../controllers/dlqController");

// Get all DLQ jobs
router.get("/jobs", dlqController.getDLQJobs);

// Get DLQ statistics
router.get("/stats", dlqController.getDLQStats);

// Get specific DLQ job
router.get("/jobs/:jobId", dlqController.getDLQJob);

// Retry a job from DLQ
router.post("/jobs/:jobId/retry", dlqController.retryDLQJob);

// Clear DLQ (requires ?confirm=true)
router.delete("/clear", dlqController.clearDLQ);

module.exports = router;

