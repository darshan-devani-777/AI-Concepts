const express = require('express');
const producer = require('../kafka/producer');
const { TOPICS } = require('../config/kafka');
const { logAPI, logProducer } = require('../utils/log');

const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { message, topic = TOPICS.MESSAGES, key } = req.body;

    if (!message) {
      logAPI('VALIDATION_ERROR', { error: 'Message is required' });
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const messageData = {
      id: `msg-${Date.now()}`,
      type: 'user_message',
      content: message,
      timestamp: new Date().toISOString(),
      ...message
    };

    await producer.sendMessage(topic, messageData, key);

    logAPI('MESSAGE_SENT', {
      id: messageData.id,
      topic,
      type: messageData.type
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: messageData.id,
        topic,
        timestamp: messageData.timestamp
      }
    });

  } catch (error) {
    logAPI('ERROR', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.message
    });
  }
});

router.post('/send-batch', async (req, res) => {
  try {
    const { messages, topic = TOPICS.MESSAGES } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      logAPI('VALIDATION_ERROR', { error: 'Messages array is required and cannot be empty' });
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and cannot be empty'
      });
    }

    const messageData = messages.map((msg, index) => ({
      id: `batch-msg-${Date.now()}-${index}`,
      type: 'batch_message',
      content: msg,
      timestamp: new Date().toISOString(),
      ...msg
    }));

    await producer.sendBatchMessages(topic, messageData);

    logAPI('BATCH_SENT', {
      count: messages.length,
      topic,
      type: 'batch_message'
    });

    res.json({
      success: true,
      message: `${messages.length} messages sent successfully`,
      data: {
        count: messages.length,
        topic,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logAPI('ERROR', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send batch messages',
      details: error.message
    });
  }
});

router.post('/notify', async (req, res) => {
  try {
    const { title, message, type = 'info', userId } = req.body;

    if (!title || !message) {
      logAPI('VALIDATION_ERROR', { error: 'Title and message are required' });
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const notificationData = {
      id: `notif-${Date.now()}`,
      type: 'notification',
      notificationType: type,
      title,
      message,
      userId,
      timestamp: new Date().toISOString(),
      read: false
    };

    await producer.sendMessage(TOPICS.NOTIFICATIONS, notificationData, userId);

    logAPI('NOTIFICATION_SENT', {
      id: notificationData.id,
      type: notificationData.notificationType,
      userId
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        id: notificationData.id,
        type: notificationData.notificationType,
        timestamp: notificationData.timestamp
      }
    });

  } catch (error) {
    logAPI('ERROR', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

router.get('/health', (req, res) => {
  logAPI('HEALTH_CHECK', { status: 'ok' });
  res.json({
    success: true,
    message: 'Message service is healthy',
    timestamp: new Date().toISOString(),
    services: {
      kafka: producer.isConnected ? 'connected' : 'disconnected'
    }
  });
});

router.get('/info', (req, res) => {
  const info = {
    service: 'Express-Kafka Demo API',
    version: '1.0.0',
    endpoints: [
      'POST /api/messages/send - Send a message',
      'POST /api/messages/send-batch - Send batch messages',
      'POST /api/messages/notify - Send notification',
      'GET /api/messages/health - Health check',
      'GET /api/messages/info - Service info'
    ],
    topics: {
      messages: TOPICS.MESSAGES,
      notifications: TOPICS.NOTIFICATIONS
    }
  };

  logAPI('INFO_REQUEST', { endpoint: '/info' });
  res.json({
    success: true,
    data: info
  });
});

module.exports = router;
