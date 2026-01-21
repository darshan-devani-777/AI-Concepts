const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'express-kafka-demo',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
};

const kafka = new Kafka(kafkaConfig);

const TOPICS = {
  MESSAGES: process.env.KAFKA_TOPIC_MESSAGES || 'messages',
  NOTIFICATIONS: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notifications',
};

const CONSUMER_GROUPS = {
  MESSAGE_PROCESSOR: 'message-processor-group',
  NOTIFICATION_HANDLER: 'notification-handler-group',
};

module.exports = {
  kafka,
  TOPICS,
  CONSUMER_GROUPS,
  kafkaConfig,
};
