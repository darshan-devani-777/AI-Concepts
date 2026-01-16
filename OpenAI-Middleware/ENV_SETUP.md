# Environment Variables Setup Guide

## 🔑 API_GATEWAY_KEY - Where to Get It

**You create this yourself!** It's not fetched from anywhere. Here are your options:

### Option 1: Generate a Secure Random Key (Recommended)

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a random 64-character hex string like:
```
a10ebd93f73e81a4fa55f1784cc4e1dc923a4ac6471a3254aeb17a3636c8ce18
```

Copy this value and add it to your `.env` file.

### Option 2: Use a Custom Key

You can use any string you want, for example:
```
API_GATEWAY_KEY=my-secret-api-key-123
```

### Option 3: Skip Auth for Local Development

**Leave `API_GATEWAY_KEY` empty or don't set it** - the middleware will automatically skip authentication. This is useful for local testing.

```env
# API_GATEWAY_KEY=  # Commented out = auth disabled
```

---

## 📝 Complete .env File Template

Create a `.env` file in the root directory with these variables:

```env
# ============================================
# API GATEWAY CONFIGURATION
# ============================================
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_GATEWAY_KEY=a10ebd93f73e81a4fa55f1784cc4e1dc923a4ac6471a3254aeb17a3636c8ce18

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000

# ============================================
# REDIS CONFIGURATION (for caching & rate limiting)
# ============================================
# Option 1: Use Redis URL (recommended for production)
# REDIS_URL=redis://localhost:6379

# Option 2: Use host/port (for local development)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cache TTL in seconds (default: 600 = 10 minutes)
CACHE_TTL_SECONDS=600

# Rate limiting configuration
RATE_LIMIT_WINDOW_SEC=60
RATE_LIMIT_MAX=60

# ============================================
# QUEUE CONFIGURATION (BullMQ + DLQ)
# ============================================
# Maximum retry attempts before moving to DLQ
QUEUE_MAX_ATTEMPTS=3

# Backoff delay in milliseconds (exponential backoff)
QUEUE_BACKOFF_DELAY=2000

# Keep completed jobs for this many seconds (default: 3600 = 1 hour)
QUEUE_COMPLETE_TTL=3600

# Keep last N completed jobs (default: 100)
QUEUE_COMPLETE_COUNT=100

# Worker concurrency (how many jobs to process simultaneously)
WORKER_CONCURRENCY=5

# Worker rate limit (jobs per duration)
WORKER_RATE_LIMIT=10
WORKER_RATE_DURATION=1000

# ============================================
# QDRANT CONFIGURATION (Vector DB for RAG)
# ============================================
# Option 1: Qdrant Cloud (FREE tier available - NO Docker needed!)
# Sign up at: https://cloud.qdrant.io/
# Get your cluster URL and API key from the dashboard
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key-here

# Option 2: Local Qdrant (if you install it natively)
# QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=  # Leave empty for local

# ============================================
# ENCRYPTION CONFIGURATION
# ============================================
CRYPTO_ALGORITHM=aes-256-cbc

# For SC (Summarization Content)
SC_CRYPTO_SECRET_KEY=your-sc-secret-key-here
SC_CRYPTO_IV=your-sc-iv-here
SC_GROQ_API_KEY_ENCRYPTED=your-encrypted-groq-key-here

# For TC (Theoretical Content) - optional
TC_CRYPTO_SECRET_KEY=your-tc-secret-key-here
TC_CRYPTO_IV=your-tc-iv-here
TC_GROQ_API_KEY_ENCRYPTED=your-encrypted-groq-key-here
```

---

## 🧪 Testing Without API Key (Local Development)

If you want to test without authentication:

1. **Don't set `API_GATEWAY_KEY` in your `.env`** (or comment it out)
2. The auth middleware will automatically skip authentication
3. You'll see this log: `🛡️ [AUTH] No API_GATEWAY_KEY configured, skipping auth`

---

## 🧪 Testing With API Key

1. **Set `API_GATEWAY_KEY` in your `.env`** (use one of the methods above)
2. **In Postman**, add this header:
   - Header name: `x-api-key`
   - Header value: (the same value from your `.env` file)

Example:
```
x-api-key: a10ebd93f73e81a4fa55f1784cc4e1dc923a4ac6471a3254aeb17a3636c8ce18
```

---

## 📋 Quick Setup Steps

1. **Create `.env` file** in the root directory
2. **Copy your existing environment variables** (SC_CRYPTO_SECRET_KEY, etc.)
3. **Add the new variables**:
   - `API_GATEWAY_KEY` (generate using the command above)
   - `REDIS_HOST` and `REDIS_PORT` (if using local Redis)
   - `RATE_LIMIT_WINDOW_SEC` and `RATE_LIMIT_MAX` (optional, defaults provided)
   - `CACHE_TTL_SECONDS` (optional, defaults to 600)
   - `QDRANT_URL` and `QDRANT_API_KEY` (for Qdrant Cloud - see below)
4. **Restart your server**

---

## 🚀 Installation Guide (macOS - NO Docker Required)

### 1. Install Redis (Required for caching & rate limiting)

**Using Homebrew (Recommended):**
```bash
# Install Redis
brew install redis

# Start Redis (runs in background)
brew services start redis

# Or run manually in foreground
redis-server

# Verify it's working
redis-cli ping
# Should return: PONG
```

**Alternative: Use Redis Cloud (FREE tier)**
- Sign up at: https://redis.com/try-free/
- Get your Redis URL
- Add to `.env`: `REDIS_URL=redis://your-redis-url`

### 2. Install Qdrant (Vector DB - Optional)

**Option A: Qdrant Cloud (EASIEST - No installation needed!)**
1. Go to https://cloud.qdrant.io/
2. Sign up for free account
3. Create a cluster (free tier available)
4. Copy your cluster URL and API key
5. Add to `.env`:
   ```env
   QDRANT_URL=https://your-cluster-id.qdrant.io
   QDRANT_API_KEY=your-api-key-here
   ```

**Option B: Install Qdrant natively on macOS**
```bash
# Install using Homebrew
brew install qdrant

# Start Qdrant
qdrant

# It will run on http://localhost:6333
# Add to .env:
# QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=  # Leave empty for local
```

**Option C: Skip Qdrant (for now)**
- Leave `QDRANT_URL` empty in `.env`
- RAG features will be disabled, but everything else works
- You can add Qdrant later when needed

### 3. Install Node.js packages

```bash
npm install
```

### 4. Start your server

```bash
npm run dev
```

---

## 🔒 Security Notes

- **Never commit `.env` to version control** (it should be in `.gitignore`)
- **Use different keys for development and production**
- **Keep your API keys secure** - anyone with the key can access your API
- **Rotate keys periodically** in production

