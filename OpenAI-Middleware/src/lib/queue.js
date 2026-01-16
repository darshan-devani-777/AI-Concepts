const { Queue, QueueEvents } = require("bullmq");
const { getBullMQConnection } = require("./redisClient");

let chatQueue;
let dlqQueue;
let chatQueueEvents;
let dlqQueueEvents;

/**
 * Initialize main chat queue with DLQ support
 */
function getChatQueue() {
  if (chatQueue) return chatQueue;

  const redis = getBullMQConnection();

  console.log("📬 [QUEUE] Initializing Chat Queue", {
    queueName: "chat-processing",
    hasRedis: !!redis,
  });

  chatQueue = new Queue("chat-processing", {
    connection: redis,
    defaultJobOptions: {
      attempts: Number(process.env.QUEUE_MAX_ATTEMPTS || 3),
      backoff: {
        type: "exponential",
        delay: Number(process.env.QUEUE_BACKOFF_DELAY || 2000), // 2 seconds
      },
      removeOnComplete: {
        age: Number(process.env.QUEUE_COMPLETE_TTL || 3600), // 1 hour
        count: Number(process.env.QUEUE_COMPLETE_COUNT || 100),
      },
      removeOnFail: false, // Keep failed jobs for DLQ
    },
  });

  // Queue event listeners
  chatQueueEvents = new QueueEvents("chat-processing", {
    connection: getBullMQConnection(),
  });

  chatQueueEvents.on("completed", ({ jobId, returnvalue }) => {
    console.log("✅ [QUEUE] Job completed", {
      jobId,
      queue: "chat-processing",
      result: returnvalue ? "success" : "no result",
    });
  });

  chatQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error("❌ [QUEUE] Job failed", {
      jobId,
      queue: "chat-processing",
      reason: failedReason,
    });
  });

  chatQueueEvents.on("stalled", ({ jobId }) => {
    console.warn("⚠️ [QUEUE] Job stalled", {
      jobId,
      queue: "chat-processing",
    });
  });

  console.log("✅ [QUEUE] Chat Queue initialized");

  return chatQueue;
}

/**
 * Initialize Dead-Letter Queue (DLQ)
 */
function getDLQ() {
  if (dlqQueue) return dlqQueue;

  const redis = getBullMQConnection();

  console.log("💀 [DLQ] Initializing Dead-Letter Queue", {
    queueName: "chat-processing-dlq",
    hasRedis: !!redis,
  });

  dlqQueue = new Queue("chat-processing-dlq", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: false, // Keep DLQ jobs for manual review
      removeOnFail: false,
    },
  });

  // DLQ event listeners
  dlqQueueEvents = new QueueEvents("chat-processing-dlq", {
    connection: getBullMQConnection(),
  });

  dlqQueueEvents.on("completed", ({ jobId }) => {
    console.log("✅ [DLQ] Job retried successfully", {
      jobId,
      queue: "chat-processing-dlq",
    });
  });

  dlqQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error("❌ [DLQ] Retry failed", {
      jobId,
      queue: "chat-processing-dlq",
      reason: failedReason,
    });
  });

  console.log("✅ [DLQ] Dead-Letter Queue initialized");

  return dlqQueue;
}

/**
 * Add job to main queue
 */
async function addJobToQueue(jobData, options = {}) {
  const queue = getChatQueue();

  console.log("📥 [QUEUE] Adding job to queue", {
    jobType: jobData.type || "unknown",
    hasTask: !!jobData.task,
    options: {
      priority: options.priority || "normal",
      delay: options.delay || 0,
    },
  });

  try {
    const job = await queue.add("process-chat", jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      jobId: options.jobId, // Optional custom job ID
      ...options,
    });

    console.log("✅ [QUEUE] Job added successfully", {
      jobId: job.id,
      queue: "chat-processing",
      timestamp: new Date().toISOString(),
    });

    return job;
  } catch (error) {
    console.error("❌ [QUEUE] Failed to add job", {
      error: error.message,
      jobData: {
        type: jobData.type,
        hasTask: !!jobData.task,
      },
    });
    throw error;
  }
}

/**
 * Move failed job to DLQ
 */
async function moveToDLQ(failedJob, error) {
  const dlq = getDLQ();

  const dlqData = {
    originalJobId: failedJob.id,
    originalJobData: failedJob.data,
    failedAt: new Date().toISOString(),
    failureReason: error.message || String(error),
    failureStack: error.stack,
    attemptsMade: failedJob.attemptsMade,
    maxAttempts: failedJob.opts.attempts,
  };

  console.log("💀 [DLQ] Moving job to Dead-Letter Queue", {
    originalJobId: failedJob.id,
    attemptsMade: failedJob.attemptsMade,
    maxAttempts: failedJob.opts.attempts,
    failureReason: error.message,
  });

  try {
    const dlqJob = await dlq.add("failed-chat-job", dlqData, {
      jobId: `dlq-${failedJob.id}-${Date.now()}`,
    });

    console.log("✅ [DLQ] Job moved to DLQ successfully", {
      originalJobId: failedJob.id,
      dlqJobId: dlqJob.id,
      timestamp: new Date().toISOString(),
    });

    return dlqJob;
  } catch (dlqError) {
    console.error("❌ [DLQ] Failed to move job to DLQ", {
      originalJobId: failedJob.id,
      error: dlqError.message,
    });
    throw dlqError;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  const queue = getChatQueue();
  const dlq = getDLQ();

  try {
    const [waiting, active, completed, failed, dlqWaiting, dlqActive] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        dlq.getWaitingCount(),
        dlq.getActiveCount(),
      ]);

    const stats = {
      mainQueue: {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
      },
      dlq: {
        waiting: dlqWaiting,
        active: dlqActive,
        total: dlqWaiting + dlqActive,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("📊 [QUEUE] Queue statistics", stats);

    return stats;
  } catch (error) {
    console.error("❌ [QUEUE] Failed to get queue stats", {
      error: error.message,
    });
    throw error;
  }
}

module.exports = {
  getChatQueue,
  getDLQ,
  addJobToQueue,
  moveToDLQ,
  getQueueStats,
};

