const { kafka, TOPICS } = require('../config/kafka');
const { logProducer, logSystem } = require('../utils/log');
const { Partitioners } = require('kafkajs');

class KafkaProducer {
  constructor() {
    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner
    });
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      logProducer('CONNECTED', { status: 'Producer connected to Kafka' });
    } catch (error) {
      logProducer('ERROR', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logProducer('DISCONNECTED', { status: 'Producer disconnected from Kafka' });
    } catch (error) {
      logProducer('ERROR', { error: error.message });
    }
  }

  async sendMessage(topic, message, key = null) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const payload = {
        topic,
        messages: [{
          key: key || `msg-${Date.now()}`,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        }],
      };

      const result = await this.producer.send(payload);

      logProducer('MESSAGE_SENT', {
        topic,
        partition: result[0].partition,
        offset: result[0].baseOffset,
        key: payload.messages[0].key,
      });

      return result;
    } catch (error) {
      logProducer('ERROR', {
        topic,
        error: error.message,
        message: JSON.stringify(message)
      });
      throw error;
    }
  }

  async sendBatchMessages(topic, messages) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const kafkaMessages = messages.map((message, index) => ({
        key: message.key || `batch-msg-${Date.now()}-${index}`,
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      }));

      const payload = {
        topic,
        messages: kafkaMessages,
      };

      const result = await this.producer.send(payload);

      logProducer('BATCH_SENT', {
        topic,
        messageCount: messages.length,
        partition: result[0].partition,
        offset: result[0].baseOffset,
      });

      return result;
    } catch (error) {
      logProducer('ERROR', {
        topic,
        error: error.message,
        batchSize: messages.length
      });
      throw error;
    }
  }
}

// Singleton instance
const producer = new KafkaProducer();

// Graceful shutdown
process.on('SIGINT', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down producer...' });
  await producer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down producer...' });
  await producer.disconnect();
  process.exit(0);
});

module.exports = producer;
