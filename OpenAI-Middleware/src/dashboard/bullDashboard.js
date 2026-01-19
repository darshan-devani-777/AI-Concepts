const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { getChatQueue, getDLQ } = require("../lib/queue");

/**
 * Initialize Bull Board dashboard for monitoring BullMQ queues
 * @param {Express} app - Express application instance
 */
function setupBullDashboard(app) {
  try {
    console.log("📊 [DASHBOARD] Initializing Bull Board...");

    // Get queue instances
    const chatQueue = getChatQueue();
    const dlqQueue = getDLQ();

    // Create BullMQ adapters for each queue
    const chatQueueAdapter = new BullMQAdapter(chatQueue);
    const dlqQueueAdapter = new BullMQAdapter(dlqQueue);

    // Create Express adapter for Bull Board
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    // Create Bull Board with both queues
    createBullBoard({
      queues: [chatQueueAdapter, dlqQueueAdapter],
      serverAdapter: serverAdapter,
    });

    // Mount the dashboard at /admin/queues
    app.use("/admin/queues", serverAdapter.getRouter());

    console.log("✅ [DASHBOARD] Bull Board initialized successfully");
    console.log("📊 [DASHBOARD] Dashboard available at: http://localhost:" + (process.env.PORT || 3000) + "/admin/queues");
    console.log("📋 [DASHBOARD] Monitoring queues:");
    console.log("   - chat-processing (Main Queue)");
    console.log("   - chat-processing-dlq (Dead Letter Queue)");

    return serverAdapter;
  } catch (error) {
    console.error("❌ [DASHBOARD] Failed to initialize Bull Board:", error.message);
    console.error("❌ [DASHBOARD] Error stack:", error.stack);
    throw error;
  }
}

module.exports = {
  setupBullDashboard,
};

