const producer = require('./src/kafka/producer');
const { logSystem } = require('./src/utils/log');

async function testProducer() {
  try {
    logSystem('TEST_START', { message: 'Starting producer test' });

    await producer.connect();

    await producer.sendMessage('messages', {
      id: 'test-1',
      type: 'test_message',
      content: 'Hello from test producer!',
      timestamp: new Date().toISOString()
    });

    const batchMessages = [
      { content: 'Batch message 1', type: 'batch_test' },
      { content: 'Batch message 2', type: 'batch_test' },
      { content: 'Batch message 3', type: 'batch_test' }
    ];
    await producer.sendBatchMessages('messages', batchMessages);

    await producer.sendMessage('notifications', {
      id: 'notif-test-1',
      type: 'notification',
      notificationType: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from producer',
      timestamp: new Date().toISOString()
    });

    logSystem('TEST_COMPLETE', { message: 'Producer test completed successfully' });

  } catch (error) {
    logSystem('TEST_ERROR', { error: error.message });
  } finally {
    await producer.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  testProducer();
}

module.exports = testProducer;
