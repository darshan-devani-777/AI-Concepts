<!-- 🧱 Tech Stack -->
Layer	       Technology
Backend	       Node.js, Express
Database	   PostgreSQL
Vector DB	   pgvector
Embeddings	   Xenova/all-MiniLM-L6-v2
Generation	   Xenova/flan-t5-small

<!-- 🐘 PostgreSQL Setup -->
<!-- 1️⃣ Install pgvector extension -->
CREATE EXTENSION IF NOT EXISTS vector;

<!-- 2️⃣ Documents table -->
CREATE TABLE documents (
  doc_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(384)
);

<!-- 3️⃣ Chat logs table -->
CREATE TABLE chat_logs (
  id SERIAL PRIMARY KEY,
  query TEXT,
  answer TEXT,
  source TEXT,
  doc_id TEXT,
  similarity FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

<!-- 🔐 Environment Variables -->

Create a .env file:

DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
PORT=3000

<!-- 📡 API Endpoints -->
➕ Add Document

curl -X POST http://localhost:3000/api/documents/add \
  -H "Content-Type: application/json" \
  -d '{
    "id": "3",
    "text": "pgvector is a PostgreSQL extension that enables efficient vector similarity search using cosine or L2 distance."
  }' | jq

<!-- ✅ Expected Response -->

{
  "message": "Document stored successfully"
}

<!-- 💬 Chat (RAG Query) -->

curl -X POST http://localhost:3000/api/documents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is pgvector?"
  }'

<!-- Response -->

{
  "answer": "pgvector is a PostgreSQL extension that enables vector similarity search...",
  "source": "pgvector is a PostgreSQL extension...",
  "similarity": 0.73
}

<!-- No Match / Low Confidence Case -->

curl -X POST http://localhost:3000/api/documents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Who won the football world cup in 1990?"
  }' | jq

<!-- ❌ Response -->

{
  "answer": "I don't know",
  "source": null,
  "similarity": null
}  
