<!-- Set up environment variables: -->

--> **Create a .env file in the root directory**

PORT=PORT

# **Encryption algorithm**
CRYPTO_ALGORITHM=aes-256-cbc

SC_CRYPTO_SECRET_KEY=SC_CRYPTO_SECRET_KEY  
SC_CRYPTO_IV=SC_CRYPTO_KEY             

# **GroqAI API Key**
SC_GROQ_API_KEY_ENCRYPTED=SC_GROQ_API_KEY_ENCRYPTED

  **OR**

# **OpenAI API key** 
SC_OPENAI_API_KEY_ENCRYPTED=SC_OPENAI_API_KEY_ENCRYPTED

# **For TC (Theoretical Content)**
TC_CRYPTO_SECRET_KEY=TC_CRYPTO_SECRET_KEY
TC_CRYPTO_IV=TC_CRYPTO_IV
TC_OPENAI_API_KEY_ENCRYPTED=TC_OPENAI_API_KEY_ENCRYPTED

<!-- Create prompts.json: -->

**In the root directory, create a prompts.json file**

1. **Client Request (Encryption)**
- A client sends a request to the /api/chatGPT endpoint with a token and type.
- The request should contain a token (which is the encrypted version of the request data, including the task with type, sub_type, and user_input).
- The token is decrypted using the SC_CRYPTO_SECRET_KEY and SC_CRYPTO_IV to retrieve the task data.

*The task contains:*

type: Defines the category (e.g., SC for summarization or TC for text corrections).
sub_type: Defines whether the task is long, short, etc.
user_input: The actual content or text that will be processed (e.g., "Artificial intelligence is transforming the world.").

2. **Prompt Generation**
- Based on the type and sub_type, the getPrompt function retrieves the corresponding prompt template from the prompts.json file.
- The user_input is inserted into the prompt template.

3. **OpenAI API Request**
- The generated prompt is sent to OpenAI's GPT-3.5 model using the OpenAI API.
- The model processes the prompt and generates a response.

4. **Encryption of the Response**
- The generated response from OpenAI is encrypted using the same encryption keys and algorithm (SC_CRYPTO_SECRET_KEY, SC_CRYPTO_IV, and CRYPTO_ALGORITHM).
- The encrypted response is sent back to the client.

5. **Client Response (Decryption)**
The client receives the encrypted response and can decrypt it using the same keys to get the final OpenAI-generated response.

<!-- API Endpoints -->
POST /api/chatGPT
POST http://localhost:3000/api/chatGPT

**This endpoint accepts the request body with the following fields:**

token: The encrypted token containing the task data.

type: Type of task (SC or TC).

<!-- Request :- -->
{
  "token": "encrypted-token-here",
  "type": "SC"
}

<!-- Response :- -->
{
  "status": true,
  "message": "The response has been successfully encrypted...",
  "data": "encrypted-response-here"
}

<!-- # Implementation Summary - New Features Added -->

## 🏗️ Architecture Implementation

### API Gateway Layer
- ✅ Created authentication middleware with `x-api-key` header validation
- ✅ Implemented Redis-backed rate limiting middleware with configurable limits
- ✅ Added request validation middleware for chat payloads (encrypted & raw modes)
- ✅ Integrated gateway pipeline: Auth → Rate Limit → Validation → Routes
- ✅ Added comprehensive logging for all gateway operations

### Redis Integration
- ✅ Created Redis client with separate connections for general use and BullMQ
- ✅ Implemented response caching layer with TTL configuration
- ✅ Integrated Redis for rate limiting with sliding window algorithm
- ✅ Added Redis connection health checks and error handling
- ✅ Configured BullMQ-compatible Redis connection (`maxRetriesPerRequest: null`)

### Queue System (BullMQ)
- ✅ Implemented main queue (`chat-processing`) with retry logic
- ✅ Created Dead-Letter Queue (`chat-processing-dlq`) for failed jobs
- ✅ Added queue event listeners for monitoring (completed, failed, stalled)
- ✅ Configured exponential backoff retry mechanism
- ✅ Implemented queue statistics endpoint with detailed job samples
- ✅ Added job status tracking endpoint

### Worker Pool
- ✅ Created worker pool with configurable concurrency
- ✅ Implemented job processing with LLM calls (Groq integration)
- ✅ Added RAG pipeline integration (vector search + re-ranking)
- ✅ Implemented automatic DLQ movement after max retry attempts
- ✅ Added worker rate limiting and error handling
- ✅ Created graceful worker shutdown on SIGTERM/SIGINT

### Dead-Letter Queue (DLQ) Management
- ✅ Implemented DLQ job storage with failure details (reason, stack trace, attempts)
- ✅ Created DLQ job listing endpoint with pagination
- ✅ Added DLQ job details endpoint for debugging
- ✅ Implemented DLQ job retry functionality
- ✅ Added DLQ statistics endpoint
- ✅ Created DLQ clear endpoint (with confirmation)

### Vector Database (Qdrant)
- ✅ Integrated Qdrant client with Cloud and local support
- ✅ Created RAG pipeline utilities (search, store, re-rank)
- ✅ Added Qdrant health check functionality
- ✅ Configured graceful fallback when Qdrant unavailable

### API Endpoints
- ✅ `/api/chatGPT` - Streaming endpoint (existing, enhanced with gateway)
- ✅ `/api/chatGPT/queue` - Queue endpoint (non-streaming, uses worker pool)
- ✅ `/api/queue/stats` - Queue statistics with job samples
- ✅ `/api/queue/jobs/:jobId` - Get job status
- ✅ `/api/dlq/jobs` - List DLQ jobs
- ✅ `/api/dlq/jobs/:jobId` - Get DLQ job details
- ✅ `/api/dlq/jobs/:jobId/retry` - Retry DLQ job
- ✅ `/api/dlq/stats` - DLQ statistics
- ✅ `/api/dlq/clear` - Clear DLQ (with confirmation)

### Logging & Monitoring
- ✅ Added structured logging throughout all components
- ✅ Implemented queue operation logs (add, process, complete, fail)
- ✅ Added worker processing logs with timing information
- ✅ Created DLQ operation logs (move, retry, clear)
- ✅ Added gateway logs (auth, rate limit, validation)
- ✅ Implemented Redis connection logs
- ✅ Added error logging with stack traces

### Configuration & Environment
- ✅ Added `API_GATEWAY_KEY` for authentication
- ✅ Configured Redis connection options (`REDIS_HOST`, `REDIS_PORT`, `REDIS_URL`)
- ✅ Added queue configuration (`QUEUE_MAX_ATTEMPTS`, `QUEUE_BACKOFF_DELAY`)
- ✅ Configured worker settings (`WORKER_CONCURRENCY`, `WORKER_RATE_LIMIT`)
- ✅ Added Qdrant configuration (`QDRANT_URL`, `QDRANT_API_KEY`)
- ✅ Configured cache TTL (`CACHE_TTL_SECONDS`)
- ✅ Added rate limit configuration (`RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX`)

### Testing & Documentation
- ✅ Created comprehensive test script (`test-queue.js`)
- ✅ Added testing guide with manual test scenarios
- ✅ Created DLQ guide with API documentation
- ✅ Added Postman examples for all endpoints
- ✅ Created environment setup guide
- ✅ Added troubleshooting documentation
- ✅ Created macOS setup guide (no Docker)

### Error Handling
- ✅ Implemented graceful Redis failure handling (fail-open for rate limiter)
- ✅ Added Qdrant fallback when unavailable
- ✅ Created retry logic with exponential backoff
- ✅ Implemented DLQ for permanently failed jobs
- ✅ Added comprehensive error logging
- ✅ Created validation error responses

### Server Integration
- ✅ Integrated worker pool auto-start on server initialization
- ✅ Added graceful shutdown handlers (SIGTERM, SIGINT)
- ✅ Configured CORS for API endpoints
- ✅ Added static file serving
- ✅ Implemented request body parsing

---

## 📊 Summary Statistics

- **New Files Created**: 15+
- **New Endpoints**: 9
- **New Middleware**: 3 (Auth, Rate Limit, Validation)
- **New Libraries Integrated**: 3 (BullMQ, ioredis, @qdrant/js-client-rest)
- **Lines of Code Added**: ~2000+
- **Documentation Files**: 6

---

## 🔄 Flow Comparison

### Before (Existing):
```
Client → Express → Chat Controller → Groq API → SSE Stream → Client
```

### After (New Implementation):
```
Client
  ↓
API Gateway
  ├── Auth (x-api-key)
  ├── Rate Limiting (Redis)
  └── Request Validation
       ↓
Node.js API (Stateless)
  ├── Redis (cache + rate limit)
  ├── Vector DB (Qdrant)
  ├── Queue (BullMQ)
  └── SSE Streaming
       ↓
Worker Pool
  ├── LLM Calls
  ├── RAG Pipeline
  ├── Re-ranking
  └── Response Cache
       ↓
Dead-Letter Queue (DLQ)
  └── Failed Jobs Management
```

---

## ✅ Key Features

1. **API Gateway**: Auth, rate limiting, validation
2. **Queue System**: Async job processing with retry logic
3. **Worker Pool**: Concurrent processing with rate limiting
4. **Dead-Letter Queue**: Failed job management and retry
5. **Vector DB**: Qdrant integration for RAG
6. **Caching**: Redis-based response caching
7. **Monitoring**: Comprehensive logging and statistics
8. **Error Handling**: Graceful degradation and DLQ

---

## 🎯 Implementation Status

✅ **Completed**: All requested features implemented
✅ **Tested**: Test scripts and guides provided
✅ **Documented**: Comprehensive documentation created
✅ **Production Ready**: Error handling and logging in place

<!-- System Flow Diagram -->

┌────────────┐
│   Client   │
└─────┬──────┘
      │ HTTP Request
      ▼
┌──────────────────────────────┐
│        API Gateway           │
│ ───────────────────────────  │
│ 1. Auth (x-api-key)          │
│ 2. Rate Limit (Redis)        │
│ 3. Request Validation        │
│ 4. Logging                   │
└─────┬────────────────────────┘
      │
      ├───────────────┐
      │               │
      ▼               ▼
┌──────────────┐   ┌────────────────────┐
│ Redis Cache  │   │ BullMQ Queue       │
│ (TTL based)  │   │ chat-processing    │
└─────┬────────┘   └──────────┬─────────┘
      │ Cache Miss              │
      ▼                         ▼
┌────────────────────────────────────────┐
│              Worker Pool               │
│ ────────────────────────────────────── │
│ • Concurrency Control                  │
│ • Rate Limiting                        │
│ • Retry + Backoff                      │
└───────────┬────────────────────────────┘
            │
            ▼
┌──────────────────────────────┐
│        RAG Pipeline          │
│ ───────────────────────────  │
│ • Qdrant Vector Search       │
│ • Re-ranking                 │
│ • Fallback Handling          │
└───────────┬──────────────────┘
            │
            ▼
┌──────────────────────────────┐
│        Groq LLM API          │
│ (OpenAI-compatible)          │
└───────────┬──────────────────┘
            │
      ┌─────▼─────┐
      │ Success   │
      │ Response  │
      └─────┬─────┘
            │
            ▼
        Client

Failure Path:
────────────
Worker Failure
      │
      ▼
┌──────────────────────────────┐
│   Dead Letter Queue (DLQ)    │
│ • Error Reason               │
│ • Stack Trace                │
│ • Retry Count                │
└──────────────────────────────┘

👇

<!-- 🔄 Overall System Flow (High Level) -->

Client → API Gateway → (Cache / Queue) → Worker → LLM + RAG → Response

<!-- 1️⃣ Client Request Flow -->

Client /api/chatGPT ya /api/chatGPT/queue hit karta hai

Request API Gateway pe aati hai

<!-- 2️⃣ API Gateway Pipeline Flow -->

Order strictly follow hota hai:

Authentication Middleware

x-api-key header validate hota hai

Invalid key → ❌ request reject

Rate Limiting (Redis)

Sliding window algorithm use hota hai

Limit exceed → ❌ 429 Too Many Requests

Request Validation

Payload schema validate hota hai

Encrypted / Raw mode check

Invalid payload → ❌ error response

Logging

Har step ka structured log (auth, rate, validation)

<!-- 3️⃣ Route Decision -->
🔹 A. Streaming Route (/api/chatGPT)

Cache check (Redis)

✅ Cache hit → direct response

❌ Cache miss → LLM call

Groq LLM call (streaming)

Optional RAG (Qdrant search + re-rank)

Response stream back to client

Cache update (TTL based)

🔹 B. Queue Route (/api/chatGPT/queue)

Request BullMQ queue (chat-processing) mein add hoti hai

Client ko Job ID milta hai

Client /api/queue/jobs/:jobId se status check karta hai

<!-- 4️⃣ Queue Processing Flow (BullMQ) -->

Job queue mein wait karti hai

Worker free hota hai → job pick karta hai

Queue events fire hote hain:

- active
- completed
- failed
- stalled

<!-- 5️⃣ Worker Execution Flow -->

Worker rate limit check

Job process start

RAG Pipeline

Qdrant vector search

Re-ranking

Fallback if Qdrant down

Groq LLM call

Response generate

Job success → ✅ completed

<!-- 6️⃣ Retry & Failure Flow -->

Job fail hui ❌

Exponential backoff retry

Max attempts cross → job DLQ mein move

<!-- 7️⃣ Dead Letter Queue (DLQ) Flow -->

Failed job DLQ mein store hoti hai

Failure details saved:

- Error reason
- Stack trace
- Attempt count

APIs available:

- List DLQ jobs
- View job details
- Retry job
- Clear DLQ (confirmation ke saath)

<!-- 8️⃣ Monitoring & Observability -->

- Gateway logs
- Redis health logs
- Queue stats
- Worker execution time
- DLQ activity logs
- Error stack traces

<!-- 🔁 Summary One-Line Flow -->

Client → Gateway (Auth → Rate → Validate) → Cache / Queue → Worker → RAG + Groq → Response / DLQ


<!-- BullMQ Dashboard -->
**Installed packages: @bull-board/api and @bull-board/express (v6.16.2)**

**Created src/dashboard/bullDashboard.js:**
Sets up Bull Board for BullMQ queues
Monitors both chat-processing and chat-processing-dlq
Uses BullMQAdapter for each queue
Mounts the dashboard at /admin/queues

**Integrated into server.js:**
Added import and setup call
Added dashboard URL to startup logs

**Dashboard features**
Real-time queue monitoring
Job status (waiting, active, completed, failed)
Job details and retry information
Queue statistics
Both queues visible in one dashboard

**Access**
After starting the server, access the dashboard at:
http://localhost:9090/admin/queues/
