# Troubleshooting: "Unauthorized: invalid API key"

## 🔍 Problem
You're getting this error:
```json
{
    "status": false,
    "message": "Unauthorized: invalid API key"
}
```

## ✅ Solutions

### Solution 1: Add `x-api-key` Header in Postman

1. **Open Postman**
2. **Create/Edit your request** to `POST http://localhost:3000/api/chatGPT`
3. **Go to Headers tab**
4. **Add this header:**
   - **Key:** `x-api-key`
   - **Value:** (the value from your `.env` file's `API_GATEWAY_KEY`)

**Example:**
```
x-api-key: a10ebd93f73e81a4fa55f1784cc4e1dc923a4ac6471a3254aeb17a3636c8ce18
```

### Solution 2: Check Your .env File

Make sure your `.env` file has `API_GATEWAY_KEY` set:

```bash
# Check what's in your .env
grep API_GATEWAY_KEY .env
```

If it's empty or wrong, generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update `.env`:
```env
API_GATEWAY_KEY=your-generated-key-here
```

**Important:** Restart your server after changing `.env`!

### Solution 3: Disable Auth Temporarily (For Testing)

If you want to test without authentication:

1. **Comment out or remove** `API_GATEWAY_KEY` from `.env`:
   ```env
   # API_GATEWAY_KEY=  # Commented out = auth disabled
   ```

2. **Restart your server:**
   ```bash
   # Stop server (Ctrl+C)
   # Then restart
   npm run dev
   ```

3. **You'll see this log:**
   ```
   🛡️ [AUTH] No API_GATEWAY_KEY configured, skipping auth
   ```

4. **Now you can test without the header!**

---

## 📋 Complete Postman Setup

### Request Configuration:

**Method:** `POST`  
**URL:** `http://localhost:3000/api/chatGPT`

### Headers:
```
Content-Type: application/json
x-api-key: your-api-key-from-env-file
```

### Body (JSON):
```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Artificial intelligence is transforming the world."
  }
}
```

---

## 🔍 Debug Steps

1. **Check server logs** - You should see:
   ```
   🛡️ [AUTH] Incoming request { path: '/chatGPT', method: 'POST', hasApiKeyHeader: true/false }
   ```

2. **If `hasApiKeyHeader: false`** - You're not sending the header

3. **If `hasApiKeyHeader: true` but still getting error** - The key doesn't match

4. **Check your .env value:**
   ```bash
   node -e "require('dotenv').config(); console.log('API Key:', process.env.API_GATEWAY_KEY)"
   ```

5. **Make sure server restarted** after changing `.env`

---

## ✅ Quick Fix Commands

```bash
# 1. Check if API_GATEWAY_KEY exists in .env
grep API_GATEWAY_KEY .env

# 2. Generate a new key if needed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Restart server
# Stop: Ctrl+C
# Start: npm run dev

# 4. Test with curl (replace YOUR_KEY with actual key)
curl -X POST http://localhost:3000/api/chatGPT \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"type":"SC","task":{"type":"SC","sub_type":"summarizer.long","user_input":"Test"}}'
```

---

## 🔴 Error: "Field 'type' is required and must be a string"

### Problem
You're getting:
```json
{
    "status": false,
    "message": "Field 'type' is required and must be a string."
}
```

### Solution
Your request body is missing the **top-level `type` field**.

### ✅ Correct Request Body (Raw Mode)

**In Postman Body tab:**
- Select **raw**
- Select **JSON** from dropdown
- Use this format:

```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Your text here"
  }
}
```

**Important:** Notice the `"type": "SC"` at the **top level** - this is required!

### ❌ Wrong Format (Missing Top-Level Type)

```json
{
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Test"
  }
}
```

This will fail because there's no `type` at the top level.

### 📋 Complete Postman Setup

1. **Method:** `POST`
2. **URL:** `http://localhost:3000/api/chatGPT`
3. **Headers:**
   - `Content-Type: application/json`
   - `x-api-key: your-key-from-env`
4. **Body (raw JSON):**
   ```json
   {
     "type": "SC",
     "task": {
       "type": "SC",
       "sub_type": "summarizer.long",
       "user_input": "Artificial intelligence is transforming the world."
     }
   }
   ```

See `POSTMAN_EXAMPLES.md` for more examples!

---

## 🎯 Most Common Issues

1. **Forgot to add `x-api-key` header** → Add it in Postman Headers tab
2. **Wrong key value** → Copy exact value from `.env` file
3. **Server not restarted** → Restart after changing `.env`
4. **Typo in header name** → Must be exactly `x-api-key` (lowercase, with hyphen)
5. **Extra spaces** → Make sure no spaces before/after the key value

