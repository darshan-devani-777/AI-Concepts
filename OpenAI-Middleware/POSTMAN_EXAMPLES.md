# Postman Request Examples

## ✅ Correct Request Format

### Option 1: Raw Mode (Easiest for Testing)

**Method:** `POST`  
**URL:** `http://localhost:3000/api/chatGPT`

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-from-env
```

**Body (raw JSON):**
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

**Important:** Notice the `type` field at the **top level** - this is required!

---

### Option 2: Encrypted Mode

**Method:** `POST`  
**URL:** `http://localhost:3000/api/chatGPT`

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-from-env
```

**Body (raw JSON):**
```json
{
  "type": "SC",
  "token": "your-encrypted-token-here"
}
```

---

## ❌ Common Mistakes

### Mistake 1: Missing Top-Level `type`
```json
// ❌ WRONG - Missing "type" at top level
{
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Test"
  }
}
```

```json
// ✅ CORRECT - Has "type" at top level
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Test"
  }
}
```

### Mistake 2: Wrong Content-Type
- ❌ Don't use `form-data` or `x-www-form-urlencoded`
- ✅ Use `raw` with `JSON` selected

### Mistake 3: Missing Required Fields
```json
// ❌ WRONG - Missing sub_type
{
  "type": "SC",
  "task": {
    "type": "SC",
    "user_input": "Test"
  }
}
```

```json
// ✅ CORRECT - All required fields
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Test"
  }
}
```

---

## 📋 Step-by-Step Postman Setup

1. **Create New Request**
   - Click "New" → "HTTP Request"
   - Name it: "ChatGPT API"

2. **Set Method & URL**
   - Method: `POST`
   - URL: `http://localhost:3000/api/chatGPT`

3. **Add Headers**
   - Go to "Headers" tab
   - Add:
     - Key: `Content-Type`, Value: `application/json`
     - Key: `x-api-key`, Value: `your-api-key-from-env`

4. **Set Body**
   - Go to "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste this:
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

5. **Send Request**
   - Click "Send"
   - You should see SSE stream response

---

## 🔍 Validation Rules

The request must have:

1. **Top-level `type`** (required, string)
   - Examples: `"SC"`, `"TC"`

2. **Either:**
   - **Encrypted mode:** `token` field (string)
   - **Raw mode:** `task` object with:
     - `type` (string, required)
     - `sub_type` (string, required) - format: `"tool.variant"` like `"summarizer.long"`
     - `user_input` (string, required, non-empty)

---

## 📸 Postman Screenshot Guide

### Headers Tab Should Look Like:
```
Content-Type: application/json
x-api-key: a10ebd93f73e81a4fa55f1784cc4e1dc...
```

### Body Tab Should Look Like:
- Selected: **raw**
- Dropdown: **JSON**
- Content:
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

---

## 🧪 Test Examples

### Example 1: Short Summary
```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.short",
    "user_input": "The quick brown fox jumps over the lazy dog."
  }
}
```

### Example 2: Long Summary
```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Artificial intelligence is transforming the world in many ways..."
  }
}
```

---

## 🐛 Debugging

If you get validation errors, check:

1. **Server logs** - You'll see:
   ```
   🧩 [VALIDATE] Incoming body shape { hasToken: false, hasType: true, hasTask: true }
   ```

2. **Check your JSON** - Make sure it's valid JSON (no trailing commas, proper quotes)

3. **Check Content-Type** - Must be `application/json`

4. **Check field types** - All string fields must be strings, not numbers

---

## ✅ Quick Copy-Paste Template

```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Replace this with your text"
  }
}
```

---

## 💀 Dead-Letter Queue (DLQ) Examples

### 1. Queue Chat Request (Non-Streaming)

**Method:** `POST`  
**URL:** `http://localhost:3000/api/chatGPT/queue`

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-from-env
```

**Body (raw JSON):**
```json
{
  "type": "SC",
  "task": {
    "type": "SC",
    "sub_type": "summarizer.long",
    "user_input": "Artificial intelligence is transforming the world."
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

**Method:** `GET`  
**URL:** `http://localhost:3000/api/queue/stats`

**Headers:**
```
x-api-key: your-api-key-from-env
```

---

### 3. Get All DLQ Jobs

**Method:** `GET`  
**URL:** `http://localhost:3000/api/dlq/jobs?limit=50&start=0`

**Headers:**
```
x-api-key: your-api-key-from-env
```

---

### 4. Retry DLQ Job

**Method:** `POST`  
**URL:** `http://localhost:3000/api/dlq/jobs/:jobId/retry?removeFromDLQ=true`

**Headers:**
```
x-api-key: your-api-key-from-env
```

---

### 5. Get DLQ Statistics

**Method:** `GET`  
**URL:** `http://localhost:3000/api/dlq/stats`

**Headers:**
```
x-api-key: your-api-key-from-env
```

---

### 6. Clear DLQ (⚠️ Destructive!)

**Method:** `DELETE`  
**URL:** `http://localhost:3000/api/dlq/clear?confirm=true`

**Headers:**
```
x-api-key: your-api-key-from-env
```

**⚠️ Warning:** This permanently deletes all DLQ jobs!

---

See `DLQ_GUIDE.md` for complete DLQ documentation and all response formats!

