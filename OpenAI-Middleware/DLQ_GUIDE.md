# Dead-Letter Queue (DLQ) Guide

## 📋 Overview

The Dead-Letter Queue (DLQ) system automatically handles failed jobs that couldn't be processed after retries. This ensures:

- **Reliability**: Failed jobs are preserved for manual review
- **Observability**: Track why jobs failed and when
- **Recovery**: Retry failed jobs after fixing issues
- **Logging**: Comprehensive logs for debugging

---

## 🏗️ Architecture

```
Client Request
    ↓
API Gateway (Auth + Rate Limit + Validation)
    ↓
Main Queue (chat-processing)
    ↓
Worker Pool (processes jobs)
    ↓
[Success] → Completed
[Failure] → Retry (up to 3 attempts)
    ↓
[Max Attempts Reached] → Dead-Letter Queue (DLQ)
```

---

## 📊 Queue Flow

1. **Job Added**: Request added to `chat-processing` queue
2. **Worker Picks Up**: Worker processes job with retry logic
3. **Success**: Job marked as completed
4. **Failure**: Job retried (exponential backoff)
5. **Max Attempts**: After 3 failures, job moved to DLQ
6. **DLQ Storage**: Failed job stored with error details
7. **Manual Review**: Admin can view, retry, or clear DLQ jobs

---

## 🔧 Configuration

Add these to your `.env` file:

```env
# Queue Configuration
QUEUE_MAX_ATTEMPTS=3              # Retry attempts before DLQ
QUEUE_BACKOFF_DELAY=2000          # Initial backoff delay (ms)
QUEUE_COMPLETE_TTL=3600           # Keep completed jobs (seconds)
QUEUE_COMPLETE_COUNT=100          # Max completed jobs to keep

# Worker Configuration
WORKER_CONCURRENCY=5              # Jobs processed simultaneously
WORKER_RATE_LIMIT=10              # Jobs per second
WORKER_RATE_DURATION=1000          # Rate limit window (ms)
```

---

## 📡 API Endpoints

### 1. Queue Chat Request (Non-Streaming)

**POST** `/api/chatGPT/queue`

Adds a chat request to the queue for processing by workers.

**Request:**
```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Your text here"
  },
  "priority": 0,
  "delay": 0
}
```

**Response:**
```json
{
  "status": true,
  "message": "Request queued successfully",
  "data": {
    "jobId": "123",
    "estimatedWaitTime": "Processing..."
  }
}
```

---

### 2. Get Queue Statistics

**GET** `/api/queue/stats`

Get statistics about main queue and DLQ.

**Response:**
```json
{
  "status": true,
  "data": {
    "mainQueue": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "total": 110
    },
    "dlq": {
      "waiting": 2,
      "active": 0,
      "total": 2
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 3. Get DLQ Jobs

**GET** `/api/dlq/jobs?limit=50&start=0`

List all jobs in the Dead-Letter Queue.

**Query Parameters:**
- `limit`: Number of jobs to return (default: 50)
- `start`: Starting index (default: 0)

**Response:**
```json
{
  "status": true,
  "data": {
    "jobs": [
      {
        "id": "dlq-123-1234567890",
        "originalJobId": "123",
        "state": "waiting",
        "failedAt": "2024-01-01T12:00:00.000Z",
        "failureReason": "API key decryption failed",
        "attemptsMade": 3,
        "maxAttempts": 3,
        "createdAt": 1234567890000,
        "data": {
          "type": "SC",
          "hasTask": true
        }
      }
    ],
    "pagination": {
      "start": 0,
      "limit": 50,
      "total": 2
    },
    "summary": {
      "waiting": 2,
      "failed": 0,
      "active": 0,
      "completed": 0
    }
  }
}
```

---

### 4. Get DLQ Job Details

**GET** `/api/dlq/jobs/:jobId`

Get detailed information about a specific DLQ job.

**Response:**
```json
{
  "status": true,
  "data": {
    "id": "dlq-123-1234567890",
    "originalJobId": "123",
    "state": "waiting",
    "failedAt": "2024-01-01T12:00:00.000Z",
    "failureReason": "API key decryption failed",
    "failureStack": "Error: ...\n    at ...",
    "attemptsMade": 3,
    "maxAttempts": 3,
    "createdAt": 1234567890000,
    "originalJobData": {
      "type": "SC",
      "task": {
        "type": "SC",
        "sub_type": "summarizer.long",
        "user_input": "Test"
      }
    }
  }
}
```

---

### 5. Retry DLQ Job

**POST** `/api/dlq/jobs/:jobId/retry?removeFromDLQ=true`

Retry a failed job from the DLQ.

**Query Parameters:**
- `removeFromDLQ`: Remove job from DLQ after retry (default: false)

**Response:**
```json
{
  "status": true,
  "message": "Job retried successfully",
  "data": {
    "dlqJobId": "dlq-123-1234567890",
    "newJobId": "456",
    "removedFromDLQ": true
  }
}
```

---

### 6. Get DLQ Statistics

**GET** `/api/dlq/stats`

Get statistics about the Dead-Letter Queue.

**Response:**
```json
{
  "status": true,
  "data": {
    "waiting": 2,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "total": 2,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 7. Clear DLQ

**DELETE** `/api/dlq/clear?confirm=true`

Remove all jobs from the Dead-Letter Queue.

**⚠️ Warning:** This permanently deletes all DLQ jobs!

**Query Parameters:**
- `confirm`: Must be `true` to confirm deletion

**Response:**
```json
{
  "status": true,
  "message": "DLQ cleared successfully",
  "data": {
    "jobsRemoved": 5
  }
}
```

---

## 📝 Logging

The DLQ system provides comprehensive logging:

### Queue Logs
```
📬 [QUEUE] Initializing Chat Queue { queueName: 'chat-processing' }
✅ [QUEUE] Chat Queue initialized
📥 [QUEUE] Adding job to queue { jobType: 'SC', hasTask: true }
✅ [QUEUE] Job added successfully { jobId: '123', queue: 'chat-processing' }
```

### Worker Logs
```
👷 [WORKER] Starting Chat Worker { concurrency: 5 }
✅ [WORKER] Chat Worker started successfully
🔨 [WORKER] Processing chat job { jobId: '123', attempt: 1 }
✅ [WORKER] Job completed successfully { jobId: '123', processingTimeMs: 1500 }
```

### DLQ Logs
```
❌ [WORKER] Job processing failed { jobId: '123', attempt: 3, error: '...' }
💀 [WORKER] Max attempts reached, moving to DLQ { jobId: '123' }
💀 [DLQ] Moving job to Dead-Letter Queue { originalJobId: '123', attemptsMade: 3 }
✅ [DLQ] Job moved to DLQ successfully { originalJobId: '123', dlqJobId: 'dlq-123-...' }
```

### Retry Logs
```
🔄 [DLQ] Retrying job from DLQ { jobId: 'dlq-123-...' }
✅ [DLQ] Job retried successfully { dlqJobId: 'dlq-123-...', newJobId: '456' }
```

---

## 🧪 Testing DLQ

### 1. Create a Job That Will Fail

Send a request with invalid data:

```bash
curl -X POST http://localhost:3000/api/chatGPT/queue \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "type": "INVALID",
    "task": {
      "type": "INVALID",
      "sub_type": "test",
      "user_input": "Test"
    }
  }'
```

This will fail after retries and move to DLQ.

### 2. Check DLQ Jobs

```bash
curl -X GET http://localhost:3000/api/dlq/jobs \
  -H "x-api-key: your-key"
```

### 3. Retry a Failed Job

```bash
curl -X POST http://localhost:3000/api/dlq/jobs/dlq-123-1234567890/retry \
  -H "x-api-key: your-key"
```

---

## 🔍 Monitoring

### Check Queue Health

```bash
# Get queue stats
curl http://localhost:3000/api/queue/stats \
  -H "x-api-key: your-key"

# Get DLQ stats
curl http://localhost:3000/api/dlq/stats \
  -H "x-api-key: your-key"
```

### Watch Logs

Monitor server logs for:
- `📬 [QUEUE]` - Queue operations
- `👷 [WORKER]` - Worker processing
- `💀 [DLQ]` - DLQ operations
- `❌` - Errors
- `✅` - Success

---

## 🛠️ Troubleshooting

### Jobs Stuck in Queue

1. Check worker is running:
   ```bash
   # Look for: "👷 [WORKER] Starting Chat Worker"
   ```

2. Check Redis connection:
   ```bash
   redis-cli ping
   ```

3. Check queue stats:
   ```bash
   curl http://localhost:3000/api/queue/stats
   ```

### Jobs Moving to DLQ Too Quickly

- Increase `QUEUE_MAX_ATTEMPTS` in `.env`
- Check error logs to fix root cause
- Increase `QUEUE_BACKOFF_DELAY` for longer retry delays

### DLQ Growing Too Large

- Review failed jobs: `GET /api/dlq/jobs`
- Fix root causes
- Retry fixed jobs: `POST /api/dlq/jobs/:id/retry`
- Clear old jobs: `DELETE /api/dlq/clear?confirm=true`

---

## 📚 Best Practices

1. **Monitor DLQ Regularly**: Check DLQ stats daily
2. **Investigate Failures**: Review failure reasons in DLQ jobs
3. **Fix Root Causes**: Don't just retry, fix the underlying issue
4. **Set Alerts**: Monitor DLQ size and alert if it grows
5. **Document Patterns**: Track common failure reasons

---

## 🎯 Summary

- **Main Queue**: Processes jobs with retry logic
- **DLQ**: Stores jobs that failed after max attempts
- **Workers**: Process jobs concurrently with rate limiting
- **Logging**: Comprehensive logs for all operations
- **API**: Full CRUD operations for DLQ management

See `POSTMAN_EXAMPLES.md` for Postman collection examples!

