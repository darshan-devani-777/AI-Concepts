<!-- 🚀 AI Backend – Groq Powered (with Auto PDF Converter) -->

A production-ready AI backend built with Node.js + Express, powered by Groq LLMs, featuring role-based prompts, prompt security, token tracking, MongoDB persistence, and an Auto PDF Converter (PDF → PPT / Word / Excel) using a single unified API.

<!-- ✨ Features -->

✅ Groq LLM integration (OpenAI-compatible API)
✅ Role-based AI prompts (admin / user)
✅ Prompt injection protection
✅ Input validation
✅ Token usage tracking (prompt / completion / total)
✅ MongoDB persistence for AI requests
✅ Simple, readable console logs

<!-- 📄 Auto PDF Converter (NEW) -->

✅ Single API for PDF → PPT / Word / Excel
✅ Auto endpoint detection using URL param
✅ AI-based structuring (Groq)
✅ Smart fallback if AI JSON fails
✅ File download URLs generated
✅ Same logging & error behavior as AI APIs

<!-- 🧱 Tech Stack -->

* Backend: Node.js, Express
* LLM: Groq (LLaMA / Mixtral models)
* Database: MongoDB (Mongoose)
* Auth (Demo): Role-based headers
* File Processing:

  * PDF parsing + AI structuring (PDF → Office)
  * Office conversion engine (Office → PDF)
* Logs: Console logs (no external logger)

<!-- 🔹 1️⃣ AI Text Response API -->
<!-- Endpoint -->
POST /api/ai/response

<!-- Headers -->
Content-Type: application/json
x-user-role: user | admin

<!-- 🔹 1️⃣ User Request (Normal User Role) -->
curl -X POST http://localhost:3000/api/ai/response \
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
curl -X POST http://localhost:3000/api/ai/response \
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
curl -X POST http://localhost:3000/api/ai/response \
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
curl -X POST http://localhost:3000/api/ai/response \
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
curl -X POST http://localhost:3000/api/ai/response \
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

<!-- 📄 2️⃣ Auto PDF Converter API (NEW) -->
<!-- Endpoint -->
POST /api/ai/pdf-to/:type

<!-- Supported Types -->
ppt | word | excel

<!-- Headers -->
Content-Type: multipart/form-data

| Key | Type |
| --- | ---- |
| pdf | File |

<!-- 🔹 Convert PDF → PPT -->
curl -X POST http://localhost:3000/api/ai/pdf-to/ppt \
  -F "pdf=@sample.pdf"


<!-- ✅ Response -->

{
  "message": "✅ PPT generated",
  "url": "http://localhost:3000/ppt/generated-file.pptx"
}   

<!-- 🔹 Convert PDF → Word -->
curl -X POST http://localhost:3000/api/ai/pdf-to/word \
  -F "pdf=@sample.pdf"  

<!-- ✅ Response -->  

{
  "message": "✅ WORD generated",
  "url": "http://localhost:3000/docx/generated-file.docx"
}


<!-- 🔹 Convert PDF → Excel -->
curl -X POST http://localhost:3000/api/ai/pdf-to/excel \
  -F "pdf=@sample.pdf"

<!-- ✅ Response -->

{
  "message": "✅ EXCEL generated",
  "url": "http://localhost:3000/xlsx/generated-file.xlsx"
}


<!-- 🧠 Internal Flow (Auto Converter) -->
parsePdf()
   └─ Groq AI structuring
       ├─ generatePPT()
       ├─ generateWord()
       └─ generateExcel()


✔️ If AI returns invalid JSON → smart fallback logic is used
✔️ No flow break, no crash

| Type  | message             | url path       |
| ----- | ------------------- | -------------- |
| PPT   | `✅ PPT generated`   | `/ppt/*.pptx`  |
| Word  | `✅ WORD generated`  | `/docx/*.docx` |
| Excel | `✅ EXCEL generated` | `/xlsx/*.xlsx` |

<!-- 🚀 AI Backend – Groq Powered (with Auto PDF Converter) -->


<!-- ### 🔁 Reverse Conversion Support (NEW) -->

The system now supports **bidirectional conversion** with proper temp handling and clean URLs.

### ✅ What’s New (Reverse Flow Updates)

* 🔄 **Office → PDF conversion added**
  Supports:

  * PPT / PPTX → PDF
  * Word / DOCX → PDF
  * Excel / XLSX → PDF

* 🧹 **Safe temp file lifecycle**

  * Uploaded files are written to `uploads/tmp`
  * Temp files are **auto-deleted immediately after PDF generation**
  * No disk bloat, no orphan files

* 🧠 **Smarter conversion engine**

  * Uses a unified `writeTempAndConvert()` utility
  * Pluggable backend (LibreOffice / Unoconv supported)
  * Cleaner scaling than raw LibreOffice CLI

* 🌐 **Public download URLs logged**

  * Generated file URLs (local / ngrok / prod) are logged
  * Same URL returned to client and printed in server logs

* 🧱 **Single internal pipeline**
  All conversions follow the same flow:

  ```text
  upload → tmp write → convert → final file → tmp cleanup → public URL
  ```

---

<!-- ## 🔁 Conversion Matrix -->

| Direction   | Input      | Output | Endpoint                     |
| ----------- | ---------- | ------ | ---------------------------- |
| PDF → PPT   | .pdf       | .pptx  | /api/ai/pdf-to/ppt           |
| PDF → Word  | .pdf       | .docx  | /api/ai/pdf-to/word          |
| PDF → Excel | .pdf       | .xlsx  | /api/ai/pdf-to/excel         |
| PPT → PDF   | .ppt/.pptx | .pdf   | /api/ai/convert/ppt-to-pdf   |
| Word → PDF  | .docx      | .pdf   | /api/ai/convert/word-to-pdf  |
| Excel → PDF | .xlsx      | .pdf   | /api/ai/convert/excel-to-pdf |

---

<!-- ## 🧠 Internal Flow (Reverse Conversion) -->

```text
office upload
   └─ write to uploads/tmp
        └─ officeToPdf()
             └─ PDF generated
                  └─ temp file deleted
                       └─ public URL returned + logged
```

✔️ No shared state
✔️ No race conditions
✔️ Safe for concurrent requests

---

<!-- ## 🪵 Example Logs (Reverse Flow) -->

```json
{
  "message": "✅ PDF generated",
  "url": "https://xxxx.ngrok-free.app/pdf/1768280177671-file.pdf",
  "durationMs": 241
}
```


