const { getDLQ, getChatQueue } = require("../lib/queue");
const { addJobToQueue } = require("../lib/queue");

/**
 * Get all jobs in DLQ
 */
async function getDLQJobs(req, res) {
  try {
    const dlq = getDLQ();
    const limit = Number(req.query.limit || 50);
    const start = Number(req.query.start || 0);

    console.log("📋 [DLQ] Fetching DLQ jobs", {
      limit,
      start,
      timestamp: new Date().toISOString(),
    });

    const [waiting, failed] = await Promise.all([
      dlq.getJobs(["waiting"], start, start + limit - 1),
      dlq.getJobs(["failed"], start, start + limit - 1),
    ]);

    const allJobs = [...waiting, ...failed];

    const jobsData = await Promise.all(
      allJobs.map(async (job) => {
        const state = await job.getState();
        return {
          id: job.id,
          originalJobId: job.data.originalJobId,
          state,
          failedAt: job.data.failedAt,
          failureReason: job.data.failureReason,
          attemptsMade: job.data.attemptsMade,
          maxAttempts: job.data.maxAttempts,
          createdAt: job.timestamp,
          processedAt: job.processedOn,
          failedAtTimestamp: job.failedReason ? job.finishedOn : null,
          data: {
            type: job.data.originalJobData?.type,
            hasTask: !!job.data.originalJobData?.task,
          },
        };
      })
    );

    const total = await dlq.getJobCounts();

    console.log("✅ [DLQ] DLQ jobs fetched", {
      count: jobsData.length,
      total: total.waiting + total.failed,
    });

    return res.json({
      status: true,
      data: {
        jobs: jobsData,
        pagination: {
          start,
          limit,
          total: total.waiting + total.failed,
        },
        summary: {
          waiting: total.waiting,
          failed: total.failed,
          active: total.active,
          completed: total.completed,
        },
      },
    });
  } catch (error) {
    console.error("❌ [DLQ] Failed to fetch DLQ jobs", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch DLQ jobs",
      error: error.message,
    });
  }
}

/**
 * Get specific DLQ job details
 */
async function getDLQJob(req, res) {
  try {
    const { jobId } = req.params;
    const dlq = getDLQ();

    console.log("🔍 [DLQ] Fetching DLQ job details", {
      jobId,
      timestamp: new Date().toISOString(),
    });

    const job = await dlq.getJob(jobId);

    if (!job) {
      console.warn("⚠️ [DLQ] Job not found", { jobId });
      return res.status(404).json({
        status: false,
        message: "Job not found in DLQ",
      });
    }

    const state = await job.getState();
    const jobData = {
      id: job.id,
      originalJobId: job.data.originalJobId,
      state,
      failedAt: job.data.failedAt,
      failureReason: job.data.failureReason,
      failureStack: job.data.failureStack,
      attemptsMade: job.data.attemptsMade,
      maxAttempts: job.data.maxAttempts,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      failedAtTimestamp: job.failedReason ? job.finishedOn : null,
      originalJobData: job.data.originalJobData,
    };

    console.log("✅ [DLQ] DLQ job details fetched", {
      jobId,
      state,
    });

    return res.json({
      status: true,
      data: jobData,
    });
  } catch (error) {
    console.error("❌ [DLQ] Failed to fetch DLQ job", {
      jobId: req.params.jobId,
      error: error.message,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch DLQ job",
      error: error.message,
    });
  }
}

/**
 * Retry a job from DLQ
 */
async function retryDLQJob(req, res) {
  try {
    const { jobId } = req.params;
    const dlq = getDLQ();

    console.log("🔄 [DLQ] Retrying job from DLQ", {
      jobId,
      timestamp: new Date().toISOString(),
    });

    const dlqJob = await dlq.getJob(jobId);

    if (!dlqJob) {
      console.warn("⚠️ [DLQ] Job not found for retry", { jobId });
      return res.status(404).json({
        status: false,
        message: "Job not found in DLQ",
      });
    }

    // Get original job data
    const originalJobData = dlqJob.data.originalJobData;

    if (!originalJobData) {
      console.error("❌ [DLQ] Original job data missing", { jobId });
      return res.status(400).json({
        status: false,
        message: "Original job data not found",
      });
    }

    // Add job back to main queue
    const newJob = await addJobToQueue(originalJobData, {
      priority: 1, // Higher priority for retries
    });

    console.log("✅ [DLQ] Job retried successfully", {
      dlqJobId: jobId,
      newJobId: newJob.id,
    });

    // Optionally remove from DLQ
    if (req.query.removeFromDLQ === "true") {
      await dlqJob.remove();
      console.log("🗑️ [DLQ] Job removed from DLQ", { jobId });
    }

    return res.json({
      status: true,
      message: "Job retried successfully",
      data: {
        dlqJobId: jobId,
        newJobId: newJob.id,
        removedFromDLQ: req.query.removeFromDLQ === "true",
      },
    });
  } catch (error) {
    console.error("❌ [DLQ] Failed to retry job", {
      jobId: req.params.jobId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to retry job",
      error: error.message,
    });
  }
}

/**
 * Clear DLQ (remove all jobs)
 */
async function clearDLQ(req, res) {
  try {
    const dlq = getDLQ();
    const { confirm } = req.query;

    if (confirm !== "true") {
      console.warn("⚠️ [DLQ] Clear DLQ requires confirmation", {
        confirm,
      });
      return res.status(400).json({
        status: false,
        message: "Clear DLQ requires ?confirm=true query parameter",
      });
    }

    console.log("🗑️ [DLQ] Clearing DLQ", {
      timestamp: new Date().toISOString(),
    });

    const [waiting, failed] = await Promise.all([
      dlq.getJobs(["waiting"]),
      dlq.getJobs(["failed"]),
    ]);

    const allJobs = [...waiting, ...failed];
    const count = allJobs.length;

    await Promise.all(allJobs.map((job) => job.remove()));

    console.log("✅ [DLQ] DLQ cleared", {
      jobsRemoved: count,
    });

    return res.json({
      status: true,
      message: "DLQ cleared successfully",
      data: {
        jobsRemoved: count,
      },
    });
  } catch (error) {
    console.error("❌ [DLQ] Failed to clear DLQ", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to clear DLQ",
      error: error.message,
    });
  }
}

/**
 * Get DLQ statistics
 */
async function getDLQStats(req, res) {
  try {
    const dlq = getDLQ();

    console.log("📊 [DLQ] Fetching DLQ statistics", {
      timestamp: new Date().toISOString(),
    });

    const counts = await dlq.getJobCounts();

    const stats = {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      total: counts.waiting + counts.active + counts.completed + counts.failed,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ [DLQ] DLQ statistics fetched", stats);

    return res.json({
      status: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ [DLQ] Failed to fetch DLQ statistics", {
      error: error.message,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch DLQ statistics",
      error: error.message,
    });
  }
}

module.exports = {
  getDLQJobs,
  getDLQJob,
  retryDLQJob,
  clearDLQ,
  getDLQStats,
};

