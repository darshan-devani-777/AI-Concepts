<!-- ✨ Features -->

✅ Groq LLM integration (OpenAI-compatible API)

✅ Role-based AI prompts (admin / user)

✅ Prompt injection protection

✅ Input validation

✅ Token usage tracking (prompt / completion / total)

✅ MongoDB persistence for AI requests

✅ Simple, readable console logs

<!-- 🧱 Tech Stack -->

Backend: Node.js, Express

- LLM: Groq (LLaMA / Mixtral models)
- Database: MongoDB (Mongoose)
- Auth (Demo): Role-based headers
- Logs: Console logs (no external logger)

<!-- 🔹 1️⃣ User Request (Normal User Role) -->
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -H "x-user-role: user" \
  -d '{
    "prompt": "Explain recursion like I am 5 years old."
  }' | jq

✅ Expected Response
{
  "response": "Recursion is like when you tell a story...",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 45,
    "total_tokens": 60
  }
}

<!-- 🔹 2️⃣ Admin Request (Admin Role) -->
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "prompt": "Explain recursion with a programming example."
  }' | jq

✅ Expected Response
{
  "response": "Recursion is when a function calls itself. Example in JavaScript:\n\nfunction countDown(n) {\n  if (n === 0) return;\n  console.log(n);\n  countDown(n - 1);\n}",
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 65,
    "total_tokens": 85
  }
}

<!-- 🔹 3️⃣ Invalid Role (Security Check) -->
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -H "x-user-role: guest" \
  -d '{
    "prompt": "Hello"
  }' | jq

❌ Response
{
  "error": "Invalid role"
}

<!-- 🔹 4️⃣ Prompt Injection Blocked -->
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -H "x-user-role: user" \
  -d '{
    "prompt": "DROP TABLE users; explain recursion"
  }' | jq

❌ Response
{
  "error": "Prompt contains forbidden patterns."
}

<!-- 🔹 5️⃣ Missing Prompt (Validation Check) -->
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -H "x-user-role: user" \
  -d '{}' | jq

❌ Response
{
  "error": "Prompt is required and must be a string."
}

<!-- 🔹 6️⃣ Logs You’ll See (Example) -->
{
  "message": "Sending to Groq API",
  "prompt": "Explain recursion like I am 5 years old.",
  "role": "user",
  "timestamp": "2026-01-08T10:00:00Z"
}
{
  "message": "Received from Groq API",
  "output": "Recursion is like when you tell a story...",
  "promptTokens": 15,
  "completionTokens": 45,
  "totalTokens": 60
}
{
  "message": "AI request completed",
  "role": "user",
  "statusCode": 200,
  "durationMs": 342
}
   

