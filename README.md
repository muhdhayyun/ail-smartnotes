d# SmartNotes AI

A RAG-powered study notes assistant. Add notes, index them into a vector store, and ask natural-language questions answered strictly from your own content.

## Architecture

```
AI-smartnotes/
├── backend/   Python 3.11 + FastAPI + ChromaDB + SQLAlchemy → Neon Postgres
└── frontend/  Next.js 14 (App Router, TypeScript, Tailwind)
```

**RAG pipeline:** Notes are chunked (~500 chars, 50-char overlap) → embedded with `all-MiniLM-L6-v2` (via ChromaDB) → stored in a local Chroma vector store. At query time the question is embedded, the top-3 closest chunks are retrieved, and OpenRouter/GPT-4o-mini generates a grounded answer.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| Neon Postgres | any (free tier works) |
| OpenRouter account | any (free tier works) |

---

## 1. Create a Neon Database

1. Sign up at <https://neon.tech>
2. Create a new project
3. Copy the **connection string** from the dashboard — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > If your provider gives a `postgres://` URL, change the scheme to `postgresql://` before pasting it into `.env`.

---

## 2. Get an OpenRouter API Key

1. Sign up at <https://openrouter.ai>
2. Go to **Keys** and create a new key

---

## 3. Backend Setup

```bash
cd backend

# Copy and fill in env vars
cp .env.example .env
# Edit .env:  set DATABASE_URL and OPENROUTER_API_KEY

# Install dependencies (use a venv)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
# → http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

The backend creates the `notes` table automatically on first startup and stores the Chroma vector index in `./chroma_data/`.

---

## 4. Frontend Setup

```bash
cd frontend

cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different port

npm install
npm run dev
# → http://localhost:3000
```

---

## 5. Quick End-to-End Test

1. Open <http://localhost:3000>
2. **Add a note** — paste a paragraph of study material, click **Save Note**
   - You'll see the status: `Saving… → Embedding… → ✓ Saved and indexed (N chunks)`
3. **Ask a question** — type a question about the material, click **Ask**
   - The AI answers using only your notes, and shows the source chunks

---

## 6. Docker (Backend)

```bash
cd backend

docker build -t smartnotes-backend .

# Mount a volume for persistent Chroma data
docker run -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/chroma_data:/app/chroma_data \
  smartnotes-backend
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | — | Neon Postgres connection string |
| `OPENROUTER_API_KEY` | yes | — | OpenRouter API key |
| `LLM_MODEL` | no | `openai/gpt-4o-mini` | Any OpenRouter model slug |
| `CHROMA_DIR` | no | `./chroma_data` | On-disk path for the Chroma vector store |
| `FRONTEND_ORIGIN` | no | `http://localhost:3000` | Allowed CORS origin |

Frontend:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notes` | Create a note |
| `GET` | `/notes` | List all notes (newest first) |
| `POST` | `/notes/{id}/embed` | Chunk + embed a note (idempotent) |
| `POST` | `/chat` | Ask a question; returns answer + source chunks |

Interactive docs at `http://localhost:8000/docs` once the backend is running.
