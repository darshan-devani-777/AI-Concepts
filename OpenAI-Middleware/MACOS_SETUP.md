# macOS Setup Guide (NO Docker Required)

This guide shows you how to set up everything on macOS without Docker.

## 📦 Quick Installation Commands

### 1. Install Redis (Required)

```bash
# Install Redis using Homebrew
brew install redis

# Start Redis service (runs in background)
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**Alternative: Use Redis Cloud (FREE)**
- Sign up at: https://redis.com/try-free/
- Get your Redis URL
- Add to `.env`: `REDIS_URL=redis://your-redis-url`

---

### 2. Install Qdrant Vector DB (Optional)

#### Option A: Qdrant Cloud (EASIEST - Recommended!)

**No installation needed!** Just use the cloud service:

1. **Sign up for free account:**
   - Go to: https://cloud.qdrant.io/
   - Click "Sign Up" (free tier available)

2. **Create a cluster:**
   - After signup, create a new cluster
   - Choose the free tier if available

3. **Get your credentials:**
   - Copy your cluster URL (looks like: `https://xxxxx.qdrant.io`)
   - Copy your API key from the dashboard

4. **Add to `.env` file:**
   ```env
   QDRANT_URL=https://your-cluster-id.qdrant.io
   QDRANT_API_KEY=your-api-key-here
   ```

**That's it!** No Docker, no installation needed.

---

#### Option B: Install Qdrant natively (if you prefer local)

```bash
# Install Qdrant using Homebrew
brew install qdrant

# Start Qdrant (runs on port 6333)
qdrant

# Add to .env:
# QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=  # Leave empty for local
```

---

#### Option C: Skip Qdrant (for now)

- **Don't set `QDRANT_URL` in your `.env`**
- RAG features will be disabled, but everything else works fine
- You can add Qdrant later when needed

---

### 3. Install Node.js Packages

```bash
cd /Users/jahnavijoshi/Desktop/Projects/OpenAI-Middleware
npm install
```

This installs:
- `ioredis` - Redis client
- `bullmq` - Queue system
- `@qdrant/js-client-rest` - Qdrant client
- All other dependencies

---

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Generate API Gateway Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add to `.env`:

```env
# API Gateway
API_GATEWAY_KEY=your-generated-key-here

# Server
PORT=3000

# Redis (local)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# OR Redis Cloud
# REDIS_URL=redis://your-redis-url

# Qdrant Cloud (recommended)
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your-api-key-here

# Your existing encryption keys
CRYPTO_ALGORITHM=aes-256-cbc
SC_CRYPTO_SECRET_KEY=your-key
SC_CRYPTO_IV=your-iv
SC_GROQ_API_KEY_ENCRYPTED=your-encrypted-key
```

---

### 5. Start Your Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

---

## ✅ Verify Everything Works

### Check Redis:
```bash
redis-cli ping
# Should return: PONG
```

### Check Qdrant (if using Cloud):
```bash
curl https://your-cluster-id.qdrant.io/health
# Should return: {"status":"ok"}
```

### Check Your API:
```bash
curl -X POST http://localhost:3000/api/chatGPT \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "SC",
    "task": {
      "type": "SC",
      "sub_type": "summarizer.long",
      "user_input": "Test message"
    }
  }'
```

---

## 🛠️ Troubleshooting

### Redis not connecting?
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
brew services start redis
# or
redis-server
```

### Qdrant not connecting?
- **If using Qdrant Cloud:** Check your URL and API key in `.env`
- **If using local Qdrant:** Make sure `qdrant` is running
- **If skipping Qdrant:** That's fine! Just leave `QDRANT_URL` empty

### Port already in use?
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

---

## 📋 Summary

**Minimum setup (everything works except RAG):**
1. ✅ `npm install` - Already done!
2. ✅ `brew install redis && brew services start redis`
3. ✅ Create `.env` with `API_GATEWAY_KEY` and `REDIS_HOST`
4. ✅ `npm run dev`

**Full setup (with RAG):**
1. ✅ All of the above
2. ✅ Sign up at https://cloud.qdrant.io/
3. ✅ Add `QDRANT_URL` and `QDRANT_API_KEY` to `.env`

**No Docker needed!** 🎉

