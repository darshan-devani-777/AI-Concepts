const connectRabbitMQ = require('./connection');
const config = require('../config/rabbitmq');
const { logDLQ } = require('../utils/log');

let channel;
const DLQ_MAX_RETRIES = 2;

async function startDLQWorker() {
  channel = await connectRabbitMQ();

  logDLQ('DLQ worker started', { dlq: config.dlq });

  channel.consume(config.dlq, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    data.dlqRetryCount = (data.dlqRetryCount || 0) + 1;

    logDLQ('Message received', {
      reportId: data.reportId,
      dlqRetryCount: data.dlqRetryCount
    });

    if (data.dlqRetryCount > DLQ_MAX_RETRIES) {
      logDLQ('Permanently dropped', { reportId: data.reportId });
      channel.ack(msg);
      return;
    }

    data.retryCount = 0;

    logDLQ('Sending back to main queue', {
      reportId: data.reportId
    });

    channel.sendToQueue(
      config.queue,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    channel.ack(msg);
  });
}

startDLQWorker();
