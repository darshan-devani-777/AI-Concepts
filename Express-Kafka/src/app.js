const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const messageRoutes = require('./routes/message.route');
const requestLogger = require('./middleware/requestLogger');
const producer = require('./kafka/producer');
const { logSystem, logAPI } = require('./utils/log');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestLogger);

app.get('/health', (req, res) => {
  logAPI('HEALTH_CHECK', { status: 'ok' });
  res.json({
    success: true,
    message: 'Express-Kafka API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      kafka: producer.isConnected ? 'connected' : 'disconnected'
    }
  });
});

app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Express-Kafka Demo API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      messages: 'GET /api/messages/info',
      docs: 'See README.md for API documentation'
    }
  });
});

app.use('*', (req, res) => {
  logAPI('NOT_FOUND', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

app.use((error, req, res, next) => {
  logAPI('ERROR', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

const initializeProducer = async () => {
  try {
    await producer.connect();
    logSystem('PRODUCER_INITIALIZED', { status: 'Kafka producer connected successfully' });
  } catch (error) {
    logSystem('PRODUCER_INIT_ERROR', { error: error.message });
  }
};

const startServer = async () => {
  try {
    await initializeProducer();

    app.listen(PORT, () => {
      logSystem('SERVER_STARTED', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        message: `Express-Kafka API server running at http://localhost:${PORT}`
      });
    });
  } catch (error) {
    logSystem('SERVER_START_ERROR', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down server...' });

  try {
    await producer.disconnect();
    logSystem('SHUTDOWN', { message: 'Kafka producer disconnected' });
  } catch (error) {
    logSystem('SHUTDOWN_ERROR', { error: error.message });
  }

  process.exit(0);
});

process.on('SIGTERM', async () => {
  logSystem('SHUTDOWN', { message: 'Shutting down server...' });

  try {
    await producer.disconnect();
    logSystem('SHUTDOWN', { message: 'Kafka producer disconnected' });
  } catch (error) {
    logSystem('SHUTDOWN_ERROR', { error: error.message });
  }

  process.exit(0);
});

startServer();

module.exports = app;
