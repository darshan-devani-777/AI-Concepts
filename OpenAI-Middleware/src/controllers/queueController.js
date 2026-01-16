const { addJobToQueue, getQueueStats, getChatQueue } = require("../lib/queue");

/**
 * Add chat request to queue (non-streaming)
 */
async function queueChatRequest(req, res) {
  try {
    console.log("📥 [QUEUE] Queue chat request received", {
      type: req.body.type,
      hasTask: !!req.body.task,
      hasToken: !!req.body.token,
    });

    // Add job to queue
    const job = await addJobToQueue(req.body, {
      priority: req.body.priority || 0,
      delay: req.body.delay || 0,
    });

    console.log("✅ [QUEUE] Chat request queued", {
      jobId: job.id,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      status: true,
      message: "Request queued successfully",
      data: {
        jobId: job.id,
        estimatedWaitTime: "Processing...",
      },
    });
  } catch (error) {
    console.error("❌ [QUEUE] Failed to queue chat request", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to queue request",
      error: error.message,
    });
  }
}

/**
 * Get queue statistics with detailed information
 */
async function getQueueStatistics(req, res) {
  try {
    console.log("📊 [QUEUE] Fetching queue statistics", {
      timestamp: new Date().toISOString(),
    });

    const queue = getChatQueue();
    const stats = await getQueueStats();

    // Get sample jobs for more details
    const [waitingJobs, activeJobs, failedJobs] = await Promise.all([
      queue.getJobs(["waiting"], 0, 4),
      queue.getJobs(["active"], 0, 4),
      queue.getJobs(["failed"], 0, 4),
    ]);

    const detailedStats = {
      ...stats,
      samples: {
        waiting: waitingJobs.map((job) => ({
          id: job.id,
          data: {
            type: job.data.type,
            hasTask: !!job.data.task,
          },
          timestamp: job.timestamp,
        })),
        active: activeJobs.map((job) => ({
          id: job.id,
          data: {
            type: job.data.type,
            hasTask: !!job.data.task,
          },
          timestamp: job.timestamp,
        })),
        failed: failedJobs.map((job) => ({
          id: job.id,
          data: {
            type: job.data.type,
            hasTask: !!job.data.task,
          },
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
          timestamp: job.timestamp,
        })),
      },
    };

    return res.json({
      status: true,
      data: detailedStats,
    });
  } catch (error) {
    console.error("❌ [QUEUE] Failed to fetch queue statistics", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch queue statistics",
      error: error.message,
    });
  }
}

/**
 * Get job status by ID
 */
async function getJobStatus(req, res) {
  try {
    const { jobId } = req.params;
    const queue = getChatQueue();

    console.log("🔍 [QUEUE] Fetching job status", {
      jobId,
      timestamp: new Date().toISOString(),
    });

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: false,
        message: "Job not found",
      });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;

    const jobStatus = {
      id: job.id,
      state,
      data: {
        type: job.data.type,
        hasTask: !!job.data.task,
      },
      progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnValue: returnValue
        ? {
            success: returnValue.success,
            responseLength: returnValue.response?.length || 0,
            processingTimeMs: returnValue.processingTimeMs,
          }
        : null,
    };

    console.log("✅ [QUEUE] Job status retrieved", {
      jobId,
      state,
    });

    return res.json({
      status: true,
      data: jobStatus,
    });
  } catch (error) {
    console.error("❌ [QUEUE] Failed to fetch job status", {
      jobId: req.params.jobId,
      error: error.message,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch job status",
      error: error.message,
    });
  }
}

module.exports = {
  queueChatRequest,
  getQueueStatistics,
  getJobStatus,
};
