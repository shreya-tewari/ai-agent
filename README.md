# 🪄 AI Creative Content Agent

A full-stack AI-powered content generation platform that automatically classifies your prompt and produces the right type of content — blogs, captions, hashtags, video scripts, presentations, or repurposed social posts — all from a single natural-language request.

---

## ✨ Features

### Content Types

| Type | Description |
|---|---|
| **Blog** | Long-form markdown blog post with structured headings |
| **Caption** | Social media caption + 10 relevant hashtags (returned as structured JSON) |
| **Hashtags** | Standalone hashtag list (exactly 10) for any topic |
| **Video Script** | Short-form script with Hook, Main Content, and CTA sections |
| **Presentation** | Slide-by-slide markdown deck |
| **Repurposing** | Turns existing content into LinkedIn, Instagram, and Twitter/X posts simultaneously |

### Generation Controls

- **Tone** — Professional, Creative, or Casual
- **Length** — Short / Medium / Long (maps to concrete word counts, slide counts, or caption line counts so the model doesn't have to guess)
- **Language** — English, Hindi, or Spanish

### Post-Generation Actions

- **Follow-up Q&A** — Ask contextual questions about the generated content; answers are appended inline
- **Refine** — One-click actions to *Expand*, *Rewrite*, or *Improve SEO* on any text output
- **Copy to Clipboard** — Copies text or caption + hashtags with one click

### UI / UX

- **Persistent chat history** — Past generations saved to `localStorage`; searchable and re-loadable
- **Resizable sidebar** — Drag-to-resize history panel (180–450 px)
- **Streaming text output** — Text content streams in chunk-by-chunk for a real-time feel
- **Loading skeletons** — Animated placeholders while content generates
- **Toast notifications** — Non-blocking success/error/info feedback
- **Markdown rendering** — Blog and presentation output rendered with `react-markdown`

---

## 🏗 Architecture

```
creative-content-agent/
├── backend/                  # Python FastAPI service
│   ├── main.py               # API routes: /generate, /followup, /refine
│   ├── graph.py              # LangGraph workflow definition
│   ├── state.py              # AgentState TypedDict (shared data contract)
│   ├── llm_client.py         # Shared Groq LLM client
│   └── agents/
│       ├── planner.py        # Classifies prompt → content_type
│       ├── content.py        # Generates content per content_type
│       └── reviewer.py       # Polishes text output (skipped for CAPTION/HASHTAGS)
└── frontend/                 # React + Vite SPA
    └── src/
        ├── App.jsx           # Main application, all state management
        ├── Toast.jsx         # Toast notification system
        └── LoadingSkeleton.jsx # Animated loading placeholders
```

### Agent Pipeline (LangGraph)

```
User Request
     │
     ▼
┌─────────┐     ┌─────────┐     ┌──────────┐
│ Planner │────▶│  Writer │────▶│ Reviewer │
└─────────┘     └─────────┘     └──────────┘
     │                                │
  Classifies                   Polishes prose
  content_type              (skipped for CAPTION,
                            HASHTAGS)
```

**Planner** uses LLM-based intent classification (not just keyword matching) so phrasing like *"make me a reel"* or *"I need a TikTok script"* both correctly route to `VIDEO_SCRIPT`. A fast keyword fallback runs if the LLM call fails.

**Writer** selects the appropriate prompt template and calls **Groq** (`llama-3.3-70b-versatile`) for all text types.

**Reviewer** polishes grammar and readability for text types; it is explicitly skipped for `CAPTION` and `HASHTAGS` to avoid corrupting structured output.

---

## 🛠 Tech Stack

### Backend

| Technology | Role |
|---|---|
| **Python 3.11+** | Runtime |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **LangGraph** | Agent workflow orchestration |
| **LangChain** | LLM abstraction layer |
| **langchain-groq** | Groq LLM integration |
| **Groq API** (`llama-3.3-70b-versatile`) | Text generation (planner, writer, reviewer, followup, refine) |

| **Pydantic** | Request/response validation |
| **python-dotenv** | Environment variable management |

### Frontend

| Technology | Role |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool and dev server |
| **lucide-react** | Icon library |
| **react-markdown** | Markdown rendering for blog/presentation output |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com/)

### Backend Setup

```bash
cd backend

# Install dependencies (using uv)
pip install uv
uv sync

# Or using pip directly
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> **Note:** The frontend is pre-configured to point at the deployed backend at `https://ai-agent-d7x5.onrender.com`. To use your local backend, update the `API_BASE` constant in `frontend/src/App.jsx`.

---

## 📡 API Reference

### `POST /generate`

Generates content based on the request. Automatically classifies the content type.

**Request body:**
```json
{
  "query": "Write a blog about remote work productivity",
  "tone": "Professional",
  "length": "Medium",
  "language": "English"
}
```

**Response** varies by content type:
- **Text types** (BLOG, VIDEO_SCRIPT, etc.): `text/plain` stream
- **Caption**: `{"type": "caption", "caption": "...", "hashtags": ["#tag1", ...]}`
- **Error**: `{"type": "error", "error": "..."}`

---

### `POST /followup`

Answers a contextual question about previously generated content.

**Request body:**
```json
{
  "content": "...previously generated content...",
  "question": "Can you suggest some tools for the tips mentioned?"
}
```

**Response:**
```json
{ "output": "Here are some tools..." }
```

---

### `POST /refine`

Refines or transforms existing content with a specific instruction.

**Request body:**
```json
{
  "content": "...existing content...",
  "action": "Expand"
}
```

Supported actions used by the UI: `Expand`, `Rewrite`, `Improve SEO`.

**Response:**
```json
{ "output": "...refined content..." }
```

---

## 📁 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Used for all text generation (planner, writer, reviewer, followup, refine) |
