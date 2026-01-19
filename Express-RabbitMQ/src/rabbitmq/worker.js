const connectRabbitMQ = require("./connection");
const config = require("../config/rabbitmq");
const { logWorker } = require("../utils/log");

let channel;

async function startWorker() {
  channel = await connectRabbitMQ();
  channel.prefetch(1);

  logWorker("Worker started", { queue: config.queue });

  channel.consume(config.queue, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    logWorker("PROCESSING", {
      reportId: data.reportId,
      retryCount: data.retryCount,
      correlationId: data.correlationId,
    });

    try {
      throw new Error("Forced failure");
    } catch (err) {
      data.retryCount = (data.retryCount || 0) + 1;

      logWorker("FAILED", {
        reason: err.message,
        retryCount: data.retryCount,
      });

      if (data.retryCount >= config.maxRetries) {
        logWorker("SENT_TO_DLQ", { reportId: data.reportId });
        channel.nack(msg, false, false);
      } else {
        logWorker("REQUEUED", { retryCount: data.retryCount });
        channel.sendToQueue(config.queue, Buffer.from(JSON.stringify(data)), {
          persistent: true,
        });
        channel.ack(msg);
      }
    }
  });
}

startWorker();
