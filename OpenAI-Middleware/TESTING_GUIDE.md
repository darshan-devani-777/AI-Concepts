# Queue & DLQ Testing Guide

## 🚀 Quick Start Testing

### 1. Start Your Server

```bash
npm run dev
```

Make sure you see:
```
✅ BullMQ Redis Connected...
✅ [QUEUE] Chat Queue initialized
✅ [DLQ] Dead-Letter Queue initialized
✅ [WORKER] Chat Worker started successfully
```

### 2. Run the Test Script

```bash
# Set your API key in .env or pass it
export API_GATEWAY_KEY=your-api-key-here
node test-queue.js
```

Or edit `test-queue.js` and set:
```javascript
const API_KEY = "your-api-key-here";
const BASE_URL = "http://localhost:9090";
```

---

## 📋 Manual Testing Steps

### Step 1: Add a Job to Queue

```bash
curl -X POST http://localhost:9090/api/chatGPT/queue \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "SC",
    "task": {
      "type": "SC",
      "sub_type": "summarizer.long",
      "user_input": "Artificial intelligence is transforming the world."
    }
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Request queued successfully",
  "data": {
    "jobId": "1",
    "estimatedWaitTime": "Processing..."
  }
}
```

**Check Server Logs:**
```
📥 [QUEUE] Queue chat request received { type: 'SC', hasTask: true }
📬 [QUEUE] Adding job to queue { jobType: 'SC', hasTask: true }
✅ [QUEUE] Job added successfully { jobId: '1' }
🔨 [WORKER] Processing chat job { jobId: '1', attempt: 1 }
✅ [WORKER] Job completed successfully { jobId: '1' }
```

---

### Step 2: Check Queue Statistics

```bash
curl http://localhost:9090/api/queue/stats \
  -H "x-api-key: your-api-key"
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "mainQueue": {
      "waiting": 0,
      "active": 0,
      "completed": 1,
      "failed": 0,
      "total": 1
    },
    "dlq": {
      "waiting": 0,
      "active": 0,
      "total": 0
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "samples": {
      "waiting": [],
      "active": [],
      "failed": []
    }
  }
}
```

---

### Step 3: Check Job Status

```bash
# Replace JOB_ID with the jobId from Step 1
curl http://localhost:9090/api/queue/jobs/JOB_ID \
  -H "x-api-key: your-api-key"
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "id": "1",
    "state": "completed",
    "data": {
      "type": "SC",
      "hasTask": true
    },
    "progress": null,
    "attemptsMade": 1,
    "timestamp": 1234567890000,
    "processedOn": 1234567891000,
    "finishedOn": 1234567892000,
    "failedReason": null,
    "returnValue": {
      "success": true,
      "responseLength": 150,
      "processingTimeMs": 1000
    }
  }
}
```

---

### Step 4: Test DLQ (Dead-Letter Queue)

Add a job that will fail:

```bash
curl -X POST http://localhost:9090/api/chatGPT/queue \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "INVALID_TYPE",
    "task": {
      "type": "INVALID_TYPE",
      "sub_type": "test",
      "user_input": "This will fail"
    }
  }'
```

**Wait for retries** (default: 3 attempts with exponential backoff)

**Check DLQ:**
```bash
curl http://localhost:9090/api/dlq/jobs \
  -H "x-api-key: your-api-key"
```

**Expected Response:**
```json
{
  "status": true,
  "data": {
    "jobs": [
      {
        "id": "dlq-2-1234567890",
        "originalJobId": "2",
        "state": "waiting",
        "failedAt": "2024-01-01T12:00:00.000Z",
        "failureReason": "Task type is missing (encrypted or raw)",
        "attemptsMade": 3,
        "maxAttempts": 3
      }
    ],
    "pagination": {
      "start": 0,
      "limit": 50,
      "total": 1
    }
  }
}
```

---

### Step 5: Retry a DLQ Job

```bash
# Replace DLQ_JOB_ID with the DLQ job ID from Step 4
curl -X POST http://localhost:9090/api/dlq/jobs/DLQ_JOB_ID/retry \
  -H "x-api-key: your-api-key"
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Job retried successfully",
  "data": {
    "dlqJobId": "dlq-2-1234567890",
    "newJobId": "3",
    "removedFromDLQ": false
  }
}
```

---

## 🧪 Complete Test Scenarios

### Scenario 1: Normal Processing Flow

1. ✅ Add valid job → Should process successfully
2. ✅ Check queue stats → Should show completed job
3. ✅ Check job status → Should show "completed" state

### Scenario 2: Multiple Jobs

1. ✅ Add 5 jobs quickly
2. ✅ Check queue stats → Should show jobs processing/completed
3. ✅ Monitor logs → Should see workers processing jobs

### Scenario 3: Failed Jobs → DLQ

1. ✅ Add invalid job → Should fail after retries
2. ✅ Check DLQ stats → Should show failed job
3. ✅ Check DLQ jobs → Should see job details
4. ✅ Retry DLQ job → Should create new job

### Scenario 4: Queue Monitoring

1. ✅ Add multiple jobs
2. ✅ Monitor queue stats every 2 seconds
3. ✅ Watch jobs move from waiting → active → completed

---

## 📊 Understanding Queue States

- **waiting**: Jobs waiting to be processed
- **active**: Jobs currently being processed by workers
- **completed**: Jobs that finished successfully
- **failed**: Jobs that failed (will retry, then move to DLQ)
- **DLQ waiting**: Jobs in Dead-Letter Queue

---

## 🔍 Debugging Tips

### Jobs Not Processing?

1. **Check worker is running:**
   ```
   Look for: "✅ [WORKER] Chat Worker started successfully"
   ```

2. **Check Redis connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Check queue stats:**
   ```bash
   curl http://localhost:9090/api/queue/stats -H "x-api-key: your-key"
   ```

### Jobs Stuck in Waiting?

- Check worker concurrency: `WORKER_CONCURRENCY=5` in `.env`
- Check rate limit: `WORKER_RATE_LIMIT=10` in `.env`
- Check server logs for errors

### Jobs Not Moving to DLQ?

- Check max attempts: `QUEUE_MAX_ATTEMPTS=3` in `.env`
- Wait for retries to complete (exponential backoff)
- Check server logs for failure reasons

---

## 📝 Test Script Usage

The `test-queue.js` script runs all tests automatically:

```bash
node test-queue.js
```

It will:
1. ✅ Add a job to queue
2. ✅ Check queue stats
3. ✅ Check DLQ stats
4. ✅ Add multiple jobs
5. ✅ Monitor queue processing
6. ✅ Add failing job for DLQ testing
7. ✅ Show final statistics

---

## 🎯 Expected Logs

### When Adding Job:
```
📥 [QUEUE] Queue chat request received { type: 'SC', hasTask: true }
📬 [QUEUE] Adding job to queue { jobType: 'SC', hasTask: true }
✅ [QUEUE] Job added successfully { jobId: '1' }
```

### When Processing:
```
🔨 [WORKER] Processing chat job { jobId: '1', attempt: 1 }
🔑 [WORKER] Crypto config loaded { jobId: '1', type: 'SC' }
✅ [WORKER] API key decrypted { jobId: '1' }
🧩 [WORKER] Prompt generated { jobId: '1', promptLength: 150 }
🤖 [WORKER] Calling LLM { jobId: '1', model: 'llama-3.1-8b-instant' }
✅ [WORKER] Job completed successfully { jobId: '1', processingTimeMs: 1500 }
```

### When Job Fails:
```
❌ [WORKER] Job processing failed { jobId: '2', attempt: 3, error: '...' }
💀 [WORKER] Max attempts reached, moving to DLQ { jobId: '2' }
💀 [DLQ] Moving job to Dead-Letter Queue { originalJobId: '2', attemptsMade: 3 }
✅ [DLQ] Job moved to DLQ successfully { originalJobId: '2', dlqJobId: 'dlq-2-...' }
```

---

## ✅ Success Criteria

Your queue system is working correctly if:

1. ✅ Jobs are added to queue successfully
2. ✅ Jobs are processed by workers
3. ✅ Queue stats show correct counts
4. ✅ Failed jobs move to DLQ after retries
5. ✅ DLQ jobs can be viewed and retried
6. ✅ Server logs show all operations

---

## 🐛 Common Issues

### Issue: Queue stats always show 0

**Solution:**
- Make sure worker is running
- Check Redis connection
- Add a job and wait a few seconds
- Check server logs for errors

### Issue: Jobs not processing

**Solution:**
- Check `WORKER_CONCURRENCY` in `.env`
- Restart server
- Check Redis connection
- Look for errors in server logs

### Issue: DLQ not receiving failed jobs

**Solution:**
- Wait for retries to complete (default: 3 attempts)
- Check `QUEUE_MAX_ATTEMPTS` in `.env`
- Verify job actually fails (check logs)
- Check DLQ stats after retries complete

---

Happy Testing! 🚀

