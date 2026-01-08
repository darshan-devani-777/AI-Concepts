<!-- 🚀 Features -->

✅ Generate text embeddings using Xenova/all-MiniLM-L6-v2

✅ Store embeddings in Qdrant vector database

✅ Perform semantic search (Cosine similarity)

✅ Reject irrelevant queries using similarity thresholds

✅ Confidence gap logic to avoid ambiguous results

✅ REST API built with Express

<!-- 🧠 Architecture Overview -->
Client
  │
  ├─ POST /add       → Generate embedding → Store in Qdrant
  │
  └─ POST /chat    → Generate embedding → Vector search → Best match

  <!-- 🛠️ Tech Stack -->

Node.js (ES Modules)

Express

@xenova/transformers – Local embedding generation

Qdrant – Vector database

Cosine Similarity

Nodemon – Dev workflow

<!-- ✅ Checklist before running curl -->

✔ Qdrant running → ./qdrant
✔ Backend running → node server.js
✔ Using 127.0.0.1 in vectorStore
✔ await searchVector() present

<!-- 🎯 Similarity Logic -->

Similarity Threshold: 0.45
Confidence Gap: 0.05

<!-- A result is rejected if: -->
Best score < threshold
Difference between best and second-best score is too small
Payload text is missing

<!-- This helps avoid: -->
Hallucinations
Weak semantic matches
Ambiguous results

<!-- 🧠 Embedding Model -->

Model: Xenova/all-MiniLM-L6-v2
Vector Size: 384
Pooling: Mean
Normalization: Enabled
Embeddings are generated locally, no external API calls.

User Question
   ↓
Embedding
   ↓
Vector Search (Context)
   ↓
Prompt Construction
   ↓
LLM Answer (grounded in context)

<!-- 🧠 Chat with Documents (RAG) -->
Endpoint
POST /api/documents/chat

✅ Example: Valid Question
curl -X POST http://localhost:3000/api/documents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is a Large Language Model?"
  }' | jq

<!-- Response -->
{
  "answer": "A Large Language Model is a powerful AI system that understands and generates human-like text.",
  "source": "Large Language Models are powerful AI systems.",
  "similarity": 0.72
}

<!-- 🚫 Example: Irrelevant Question -->
curl -X POST http://localhost:3000/api/documents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to cook pasta?"
  }' | jq

<!-- Response -->
{
  "answer": "I don't know",
  "source": null
}  

<!-- 🧪 Complete Flow Using curl -->
<!-- 1️⃣ Add Document -->
curl -X POST http://localhost:3000/api/documents/add \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "text": "Large Language Models are powerful AI systems used for natural language understanding."
  }' | jq

<!-- 2️⃣ Chat with RAG -->
curl -X POST http://localhost:3000/api/documents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are LLMs used for?"
  }' | jq
