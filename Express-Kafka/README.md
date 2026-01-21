# Express-Kafka Demo Project

A simple Express.js backend demonstrating Apache Kafka integration with proper logging and structured project organization.

## Features

- **Express.js API** with REST endpoints
- **Apache Kafka** producer and consumer implementation
- **Structured logging** with colored console output
- **Error handling** and graceful shutdown
- **Environment configuration**
- **Health checks** and service monitoring

## Project Structure

```
Express-Kafka/
├── src/
│   ├── app.js                 # Main Express application
│   ├── config/
│   │   └── kafka.js          # Kafka configuration
│   ├── kafka/
│   │   ├── producer.js       # Kafka producer implementation
│   │   └── consumer.js       # Kafka consumer implementation
│   ├── routes/
│   │   └── message.route.js  # API routes for message operations
│   ├── middleware/
│   │   └── requestLogger.js  # HTTP request logging middleware
│   └── utils/
│       └── log.js            # Logging utilities
├── package.json
├── README.md
└── .env.example
```

## Prerequisites

- **Node.js** (v14 or higher)
- **Apache Kafka** (running on localhost:9092)

### Setting up Kafka

#### Manual Download (Recommended for your setup)
```bash
# Download Kafka manually (if setup.sh fails)
curl -L -o kafka_2.13-3.6.1.tgz https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz
tar -xzf kafka_2.13-3.6.1.tgz
cd kafka_2.13-3.6.1

# Generate cluster ID (one-time setup)
bin/kafka-storage.sh random-uuid

# Format storage (replace YOUR_CLUSTER_ID with the UUID from above)
bin/kafka-storage.sh format -t YOUR_CLUSTER_ID -c config/kraft/server.properties

# Start Kafka with KRaft mode (no Zookeeper needed)
bin/kafka-server-start.sh config/kraft/server.properties

# Wait for "Kafka Server started" message
```

**Note:** The setup script uses `curl` instead of `wget` since `curl` is typically available on macOS.

#### Alternative: Using Homebrew
```bash
# Install Kafka using Homebrew
brew install kafka

# Start Zookeeper (required for Kafka)
zookeeper-server-start /opt/homebrew/etc/kafka/zookeeper.properties &

# Start Kafka server
kafka-server-start /opt/homebrew/etc/kafka/server.properties &

# Wait for Kafka to be ready
sleep 10
```

## Installation

### Quick Setup (macOS)
```bash
cd Express-Kafka
./setup.sh
```

This will:
- Check for Homebrew installation
- Install Kafka if not present
- Set up environment file
- Install npm dependencies
- Provide next steps

### Manual Setup

1. **Run setup script:**
```bash
./setup.sh
```
This will download Kafka, setup environment, and install dependencies.

2. **Start Kafka (in a separate terminal):**
```bash
cd kafka_2.13-3.6.1

# First time only: Generate cluster ID
bin/kafka-storage.sh random-uuid

# First time only: Format storage (replace YOUR_CLUSTER_ID)
bin/kafka-storage.sh format -t YOUR_CLUSTER_ID -c config/kraft/server.properties

# Start Kafka
bin/kafka-server-start.sh config/kraft/server.properties
```

3. **Start the application (in another terminal):**
```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
```http
GET /health
```

### Service Info
```http
GET /api/messages/info
```

### Send Message
```http
POST /api/messages/send
Content-Type: application/json

{
  "message": "Hello Kafka!",
  "topic": "messages" // optional, defaults to 'messages'
}
```

### Send Batch Messages
```http
POST /api/messages/send-batch
Content-Type: application/json

{
  "messages": [
    {"content": "Message 1"},
    {"content": "Message 2"}
  ],
  "topic": "messages" // optional
}
```

### Send Notification
```http
POST /api/messages/notify
Content-Type: application/json

{
  "title": "System Alert",
  "message": "This is a notification",
  "type": "info", // info, warning, error
  "userId": "user123" // optional
}
```

## Running Components

### 1. Setup (First time only)
```bash
npm run setup
```

### 2. Start Kafka (Terminal 1)
```bash
npm run kafka:start
# या manually: ./kafka-helper.sh start
```

### 3. Start API Server (Terminal 2)
```bash
npm start
# या
npm run dev
```

### 4. Start Consumer (Terminal 3)
```bash
npm run consumer
```

### 5. Test Producer (Terminal 4)
```bash
npm run test
```

### Kafka Management Commands
```bash
npm run kafka:status                # Check if Kafka is running
npm run kafka:topics                # List all topics
npm run kafka:create-topics         # Create default topics
npm run kafka:consume               # View all messages from 'messages' topic
npm run kafka:consume-notifications # View all notifications from 'notifications' topic
npm run check-events                # Check all stored events (formatted output)
```

## Testing the API

### Using cURL

1. **Send a message:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from cURL!"}'
```

2. **Send batch messages:**
```bash
curl -X POST http://localhost:3000/api/messages/send-batch \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"content": "Batch message 1"},
      {"content": "Batch message 2"},
      {"content": "Batch message 3"}
    ]
  }'
```

3. **Send notification:**
```bash
curl -X POST http://localhost:3000/api/messages/notify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "info"
  }'
```

### Using Postman

Import the following collection or create requests manually:

**Collection: Express-Kafka Demo**

1. **GET Health Check**
   - URL: `http://localhost:3000/health`
   - Method: GET

2. **POST Send Message**
   - URL: `http://localhost:3000/api/messages/send`
   - Method: POST
   - Body: `{"message": "Hello from Postman!"}`

3. **POST Send Batch Messages**
   - URL: `http://localhost:3000/api/messages/send-batch`
   - Method: POST
   - Body: `{"messages": [{"content": "Message 1"}, {"content": "Message 2"}]}`

4. **POST Send Notification**
   - URL: `http://localhost:3000/api/messages/notify`
   - Method: POST
   - Body: `{"title": "Alert", "message": "Test alert", "type": "warning"}`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker addresses |
| `KAFKA_CLIENT_ID` | `express-kafka-demo` | Kafka client ID |
| `KAFKA_TOPIC_MESSAGES` | `messages` | Messages topic name |
| `KAFKA_TOPIC_NOTIFICATIONS` | `notifications` | Notifications topic name |

## Logging

The application uses structured logging with colored console output:

- **🔵 [KAFKA]** - Kafka operations
- **🟢 [SYSTEM]** - System events
- **🟡 [API]** - API requests/responses
- **🟣 [CONSUMER]** - Message consumption
- **🔵 [PRODUCER]** - Message production

## Error Handling

- Graceful shutdown on SIGINT/SIGTERM
- Automatic Kafka reconnection
- Comprehensive error logging
- HTTP error responses with proper status codes

## Development

### Adding New Routes
1. Create new route file in `src/routes/`
2. Import and use in `src/app.js`
3. Follow the existing pattern with proper logging

### Adding New Kafka Topics
1. Update `TOPICS` in `src/config/kafka.js`
2. Add environment variables
3. Update route handlers as needed

### Extending Consumer Logic
1. Modify `defaultMessageHandler` in `src/kafka/consumer.js`
2. Add custom message processors
3. Implement topic-specific handlers

## Troubleshooting

### Kafka Installation Issues (Manual Setup)
```bash
# Check if Kafka directory exists
ls -la kafka_2.13-3.6.1/

# Check if Java is available
java -version

# Check if Kafka is running (from Kafka directory)
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# View Kafka logs in the terminal where it's running
# Look for "Kafka Server started" message

# Manual start (from kafka_2.13-3.6.1 directory)
bin/kafka-server-start.sh config/kraft/server.properties
```

### Kafka Connection Issues
- Ensure Kafka is running on the specified port
- Check broker addresses in `.env`
- Verify network connectivity
- Test Kafka connection: `telnet localhost 9092`

### Consumer Not Receiving Messages
- Check topic names match between producer and consumer
- Ensure consumer group is properly configured
- Verify message serialization/deserialization
- Check if topics exist: `kafka-topics --list --bootstrap-server localhost:9092`

### API Returns 500 Errors
- Check application logs for detailed error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Check if Kafka producer is connected

### Checking Stored Events

#### Method 1: Using npm scripts (Recommended)
```bash
# Check all stored events in both topics
npm run check-events

# View raw messages from messages topic
npm run kafka:consume

# View raw notifications from notifications topic
npm run kafka:consume-notifications
```

#### Method 2: Using Kafka Helper Script
```bash
# Check Kafka status
./kafka-helper.sh status

# List topics
./kafka-helper.sh topics

# Create default topics (if needed)
./kafka-helper.sh create-topics

# View messages from messages topic
./kafka-helper.sh consume

# View notifications from notifications topic
./kafka-helper.sh consume-notifications
```

#### Method 3: Manual Kafka Commands
```bash
# Create topics manually (if needed)
cd kafka_2.13-3.6.1
bin/kafka-topics.sh --create --topic messages --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
bin/kafka-topics.sh --create --topic notifications --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# List topics
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# View messages from messages topic
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic messages --from-beginning --property print.key=true --property key.separator=" | "

# View notifications
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic notifications --from-beginning --property print.key=true --property key.separator=" | "
```

#### Method 4: Via Node.js Consumer
```bash
# In a separate terminal, run consumer to see live events
npm run consumer
```

# Start Kafka (with automatic setup)
./kafka-helper.sh start
```