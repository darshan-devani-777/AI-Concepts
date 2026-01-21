const { kafka, TOPICS, CONSUMER_GROUPS } = require('../config/kafka');
const { logConsumer, logSystem } = require('../utils/log');

class KafkaConsumer {
  constructor(groupId = CONSUMER_GROUPS.MESSAGE_PROCESSOR) {
    this.consumer = kafka.consumer({ groupId });
    this.isConnected = false;
    this.isRunning = false;
  }

  async connect() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      logConsumer('CONNECTED', { groupId: this.consumer.groupId, status: 'Consumer connected to Kafka' });
    } catch (error) {
      logConsumer('ERROR', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      this.isRunning = false;
      await this.consumer.disconnect();
      this.isConnected = false;
      logConsumer('DISCONNECTED', { status: 'Consumer disconnected from Kafka' });
    } catch (error) {
      logConsumer('ERROR', { error: error.message });
    }
  }

  async subscribe(topics = [TOPICS.MESSAGES]) {
    try {
      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logConsumer('SUBSCRIBED', { topic });
      }
    } catch (error) {
      logConsumer('ERROR', { error: error.message, topics: topics.join(', ') });
      throw error;
    }
  }

  async startConsuming(messageHandler = this.defaultMessageHandler) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      this.isRunning = true;

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageData = {
              key: message.key?.toString(),
              value: JSON.parse(message.value.toString()),
              topic,
              partition,
              offset: message.offset,
              timestamp: message.timestamp,
            };

            logConsumer('MESSAGE_RECEIVED', {
              topic,
              partition,
              offset: message.offset,
              key: messageData.key,
            });

            await messageHandler(messageData);
          } catch (error) {
            logConsumer('MESSAGE_PROCESSING_ERROR', {
              topic,
              partition,
              offset: message.offset,
              error: error.message,
            });
          }
        },
      });

      logConsumer('STARTED', { status: 'Consumer started and listening for messages' });
    } catch (error) {
      logConsumer('ERROR', { error: error.message });
      throw error;
    }
  }

  async defaultMessageHandler(messageData) {
    logConsumer('PROCESSING_MESSAGE', {
      type: messageData.value.type || 'unknown',
      id: messageData.value.id || 'no-id',
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    logConsumer('MESSAGE_PROCESSED', {
      type: messageData.value.type || 'unknown',
      id: messageData.value.id || 'no-id',
    });
  }

  async seekToBeginning(topics = [TOPICS.MESSAGES]) {
    try {
      for (const topic of topics) {
        const partitions = await this.consumer.assignment();
        for (const partition of partitions) {
          if (partition.topic === topic) {
            await this.consumer.seek({ topic, partition: partition.partition, offset: 'earliest' });
          }
        }
      }
      logConsumer('SEEK_TO_BEGINNING', { topics: topics.join(', ') });
    } catch (error) {
      logConsumer('ERROR', { error: error.message });
    }
  }
}

const consumer = new KafkaConsumer();

process.on('SIGINT', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down consumer...' });
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down consumer...' });
  await consumer.disconnect();
  process.exit(0);
});

if (require.main === module) {
  (async () => {
    try {
      await consumer.connect();
      await consumer.subscribe();
      await consumer.startConsuming();

      logSystem('CONSUMER_READY', { message: 'Consumer is ready and listening for messages' });
    } catch (error) {
      logConsumer('STARTUP_ERROR', { error: error.message });
      process.exit(1);
    }
  })();
}

module.exports = consumer;
