# Quick Start Guide - Terminal Commands

## 🚀 Complete Setup (Copy & Paste)

### Step 1: Install Redis
```bash
brew install redis
brew services start redis
redis-cli ping  # Should return: PONG
```

### Step 2: Install Node Packages
```bash
cd /Users/jahnavijoshi/Desktop/Projects/OpenAI-Middleware
npm install
```

### Step 3: Generate API Gateway Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add to `.env` as `API_GATEWAY_KEY=...`

### Step 4: Set Up Qdrant Cloud (Optional - No Installation!)
1. Go to: https://cloud.qdrant.io/
2. Sign up (free tier available)
3. Create cluster
4. Copy URL and API key to `.env`:
   ```env
   QDRANT_URL=https://your-cluster-id.qdrant.io
   QDRANT_API_KEY=your-api-key
   ```

### Step 5: Create .env File
```bash
# Create .env file with these variables:
cat > .env << EOF
API_GATEWAY_KEY=your-generated-key-here
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your-api-key-here
CRYPTO_ALGORITHM=aes-256-cbc
SC_CRYPTO_SECRET_KEY=your-existing-key
SC_CRYPTO_IV=your-existing-iv
SC_GROQ_API_KEY_ENCRYPTED=your-existing-encrypted-key
EOF
```

### Step 6: Start Server
```bash
npm run dev
```

---

## ✅ Verification Commands

### Check Redis
```bash
redis-cli ping
# Expected: PONG
```

### Check Qdrant (if using Cloud)
```bash
curl https://your-cluster-id.qdrant.io/health
# Expected: {"status":"ok"}
```

### Test API
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

## 🛠️ Troubleshooting Commands

### Redis Issues
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis

# View Redis logs
brew services info redis

# Stop Redis
brew services stop redis
```

### Port Issues
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

### Check Installed Packages
```bash
npm list --depth=0
```

### Check Node Version
```bash
node --version
# Should be v14+ or v16+
```

---

## 📝 All Terminal Commands Summary

```bash
# ============================================
# INSTALLATION
# ============================================

# Install Redis
brew install redis
brew services start redis

# Install Node packages
npm install

# ============================================
# CONFIGURATION
# ============================================

# Generate API Gateway Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create .env file (edit with your values)
nano .env
# or
code .env

# ============================================
# RUNNING
# ============================================

# Start server (development)
npm run dev

# Start server (production)
npm start

# ============================================
# VERIFICATION
# ============================================

# Check Redis
redis-cli ping

# Check Qdrant (if using Cloud)
curl https://your-cluster-id.qdrant.io/health

# Test API
curl -X POST http://localhost:3000/api/chatGPT \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{"type":"SC","task":{"type":"SC","sub_type":"summarizer.long","user_input":"Test"}}'
```

---

## 🎯 Minimal Setup (Without Qdrant)

If you want to skip Qdrant for now:

```bash
# 1. Install Redis
brew install redis && brew services start redis

# 2. Install packages
npm install

# 3. Create .env (without QDRANT_URL)
# API_GATEWAY_KEY=...
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379
# (your existing keys)

# 4. Start server
npm run dev
```

Everything will work except RAG features (which you can add later).

---

## 📚 More Details

- **Full setup guide:** See `MACOS_SETUP.md`
- **Environment variables:** See `ENV_SETUP.md`
- **API documentation:** See `README.md`

