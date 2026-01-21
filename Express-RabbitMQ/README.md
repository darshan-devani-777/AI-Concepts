# Express + RabbitMQ (with DLQ & Retries)

A sample Node.js application demonstrating **Express API + RabbitMQ** with:

* Producer → Queue
* Worker with retry logic
* Dead Letter Queue (DLQ)
* DLQ reprocessing worker
* Structured logging

This project is useful for understanding **message queues, retries, and failure handling** using RabbitMQ.
Messages flow from API → Queue → Worker; failures retry in main queue, exceed limit go to DLQ, DLQ worker retries once more or drops permanently.

---

## 📦 Tech Stack

* **Node.js**
* **Express** (API layer)
* **RabbitMQ** (Message broker)
* **amqplib** (RabbitMQ client)
* **Chalk** (Colored logs)
* **Nodemon** (Dev reload)

---

## 🗂 Project Structure

```
src/
├── app.js                    # Express server
├── config/
│   └── rabbitmq.js           # RabbitMQ configuration
├── rabbitmq/
│   ├── connection.js         # RabbitMQ connection & queue setup
│   ├── producer.js           # Message producer
│   ├── worker.js             # Main worker with retries
│   └── dlqWorker.js           # DLQ worker
├── routes/
│   └── report.route.js       # API routes
├── utils/
│   └── log.js                # Logging helpers
└── package.json
```

---

## ⚙️ RabbitMQ Configuration

```js
module.exports = {
  url: 'amqp://localhost',
  queue: 'report_queue',
  dlq: 'report_queue_dlq',
  maxRetries: 3
};
```

* **Main Queue:** `report_queue`
* **Dead Letter Queue:** `report_queue_dlq`
* **Max retries (worker):** 3
* **Max retries (DLQ worker):** 2

---

## 🔌 Queue Setup

On startup, the app:

* Creates a durable **main queue**
* Attaches a **DLQ** using `deadLetterRoutingKey`
* Uses manual `ack / nack`

```js
await channel.assertQueue(config.queue, {
  durable: true,
  deadLetterExchange: "",
  deadLetterRoutingKey: config.dlq,
});
```

---

## 🚀 API Usage

### Create Report Job

**Endpoint**

```
POST /api/reports
```

**Body**

```json
{
  "type": "SALES"
}
```
curl -X POST http://localhost:7000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type":"SALES"}' | jq

**Response**

```json
{
  "message": "Message Queue successfully",
  "status": "QUEUED"
}
```

This publishes a message to RabbitMQ.

---

## 📨 Message Format

```json
{
  "reportId": "RPT-173726292",
  "type": "SALES",
  "retryCount": 0,
  "correlationId": "uuid"
}
```

---

## ⚙️ Worker Logic (Main Queue)

1. Consume message
2. Process job
3. On failure:

   * Increment `retryCount`
   * Requeue if retry < maxRetries
   * Send to DLQ if retry limit exceeded

```js
if (data.retryCount >= config.maxRetries) {
  channel.nack(msg, false, false); // send to DLQ
} else {
  channel.sendToQueue(config.queue, Buffer.from(JSON.stringify(data)));
  channel.ack(msg);
}
```

---

## ☠️ Dead Letter Queue (DLQ)

* Messages exceeding retries land in `report_queue_dlq`
* DLQ worker:

  * Retries message up to **2 times**
  * Resets retryCount
  * Sends back to main queue
  * Drops permanently after limit

---

## 🖥 Logging

Color-coded structured logs:

* 🔵 Worker processing
* 🟡 Retries / Requeues
* 🔴 Failures / DLQ
* 🟣 DLQ Worker

Example:

```
[WORKER] FAILED
├─ reason : Forced failure
└─ retryCount : 2
```

---

## ▶️ Running the Project

### 1️⃣ Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management
```

Access UI: [http://localhost:15672](http://localhost:15672)

```
username: guest
password: guest
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Start API Server

```bash
npm start
```

Server runs at:

```
http://localhost:7000
```

---

### 4️⃣ Start Worker

```bash
npm run worker
```

(Optional) Start DLQ worker in another terminal:

```bash
node src/rabbitmq/dlqWorker.js
```

---

## 📌 Use Cases

* Background job processing
* Report generation
* Email/SMS workers
* Retry & failure handling
* Understanding queues vs workers vs DLQ

---

## 📖 Learning Notes

* RabbitMQ does **not** retry automatically
* Retries must be implemented in consumer logic
* DLQ helps isolate poison messages
* `ack`, `nack`, and `prefetch` are critical

---

+--------+
| Client |
+--------+
     |
     |  POST /api/reports
     v
+---------------------+
|   Express API       |
|  (Producer)         |
+---------------------+
     |
     | sendToQueue()
     v
+---------------------+
|  RabbitMQ           |
|  Main Queue         |
|  report_queue       |
+---------------------+
     |
     | consume
     v
+---------------------+
|  Main Worker        |
|  (Retry Logic)      |
+---------------------+
     |
     |----------------------+
     |                      |
     v                      v
+-----------+        +-------------------+
|  Success  |        |   Failure         |
|  ack()    |        | retryCount++      |
+-----------+        +-------------------+
                            |
                            |
                retryCount < maxRetries ?
                      |             |
                     YES            NO
                      |             |
                      v             v
        +-------------------+   +----------------------+
        | Requeue to        |   | Dead Letter Queue    |
        | report_queue      |   | report_queue_dlq     |
        +-------------------+   +----------------------+
                                         |
                                         | consume
                                         v
                              +----------------------+
                              | DLQ Worker           |
                              | dlqRetryCount++      |
                              +----------------------+
                                         |
                             dlqRetryCount <= limit ?
                                   |             |
                                  YES            NO
                                   |             |
                                   v             v
                    +-----------------------+   +-------------------+
                    | Send back to main     |   | Permanently Drop  |
                    | queue (retry reset)  |   | ack()             |
                    +-----------------------+   +-------------------+


**RabbitMQ vs BullMQ vs Kafka**

| Feature        | **RabbitMQ**               | **BullMQ**                    | **Kafka**                            |
| -------------- | -------------------------- | ----------------------------- | ------------------------------------ |
| Category       | Traditional Message Broker | Redis-based Job Queue         | Distributed Event Streaming Platform |
| Primary Use    | Message passing & routing  | Background jobs & task queues | Event streaming & log processing     |
| Storage        | In-memory + disk (Erlang)  | Redis                         | Disk (commit log)                    |
| Message Model  | Push-based                 | Pull-based (workers)          | Pull-based                           |
| Ordering       | Per queue                  | Per queue                     | Per partition                        |
| Language Focus | Multi-language             | Node.js-centric               | Multi-language                       |

**When to Use What (Rule of Thumb)**

<!-- Use BullMQ if: -->
You are using Node.js
You need background jobs
You want retries, delays, cron
You want minimal infrastructure

Example: Email sending, image processing, report generation

<!-- Use RabbitMQ if: -->
You need complex routing
You have multiple consumers
You want low-latency messaging

Example: Microservice communication, notifications

<!-- Use Kafka if: -->
You need event streaming
You need replayable history
You process millions of events

Example: Analytics pipelines, audit logs, CDC

**One-liner summary**
“Do this work” → BullMQ
Task-oriented, job execution
Background jobs, retries, delays, cron, rate limiting
→ “Run this function, make sure it finishes”

“Send this message” → RabbitMQ
Message-oriented, delivery-focused
Routing, fanout, pub/sub, low-latency communication
→ “Deliver this message to the right consumer(s)”

“This happened” → Kafka
Event-oriented, fact recording
Immutable logs, replay, high throughput, event streams
→ “Record this fact forever; consumers can react now or later”