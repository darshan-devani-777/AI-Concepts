module.exports = {
  url: 'amqp://localhost',
  queue: 'report_queue',
  dlq: 'report_queue_dlq',
  maxRetries: 3
};
