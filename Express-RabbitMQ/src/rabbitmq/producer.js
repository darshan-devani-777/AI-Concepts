const connectRabbitMQ = require('./connection');
const config = require('../config/rabbitmq');
const crypto = require('crypto');
const { logWorker } = require('../utils/log');

async function publishReport(type) {
  const channel = await connectRabbitMQ();

  const message = {
    reportId: 'RPT-' + Date.now(),
    type,
    retryCount: 0,
    correlationId: crypto.randomUUID()
  };

  channel.sendToQueue(config.queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  logWorker('Queued', message);
}

module.exports = publishReport;
