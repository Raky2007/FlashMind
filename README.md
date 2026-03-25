# 🧠 FlashMind — AI-Powered Flashcard & Quiz Generator

> Upload notes → AI generates smart flashcards → Quiz yourself → Track progress.  
> Privacy-first. No paid APIs. 100% local AI with Ollama.

![FlashMind](https://img.shields.io/badge/FlashMind-AI_Learning-black?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?style=flat-square)
![Antd](https://img.shields.io/badge/Ant_Design-5.x-blue?style=flat-square)

---

## ✨ Features

| Feature | Details |
| :--- | :--- |
| 📤 **Multi-Input** | Paste text, upload PDF, image/handwriting (OCR), or voice recording (STT) |
| 🤖 **AI Flashcards** | Auto-generate Q&A, cloze, and MCQ cards with difficulty tagging |
| 🧠 **Smart Quiz** | Timed sessions, auto-grading (fuzzy matching), and streak tracking |
| 📊 **Dashboard** | **Learning Momentum** charts and **Quiz History** with full review/download |
| ✨ **Modern UI** | Premium **Indigo Glassmorphism** with animated **Nebula backgrounds** |
| 💡 **AI Explanations** | Level-adapted explanations (Scholar/Engineer/Pro) with TTS |
| 📦 **Export** | Professional JSON, CSV, and Anki-compatible formats |
| 💾 **Persistence** | **100% Local** — No database needed (all data saved in browser and local files) |

---

## 🏗 Tech Stack

| Layer | Tech |
| :--- | :--- |
| Frontend | React 18, TypeScript, Ant Design 5, Framer Motion, Chart.js |
| Backend | Python 3.11+, FastAPI, PyMuPDF, EasyOCR, faster-whisper |
| AI | Ollama (**Phi-3 3.8B**) — Optimized for local CPU performance |
| DevOps | Vite, Docker, uvicorn |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.11+** and **pip**
- **Ollama** installed ([https://ollama.com](https://ollama.com))

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```

### 3. Setup the AI Brain (Crucial)

FlashMind uses **Phi-3** locally. Download it via Ollama:

```bash
ollama pull phi3
```

### 4. Open the App

Visit **http://localhost:5174** (or the port shown in your terminal).

---

## 🎮 Demo Flow

1. **Create Tab** → Paste study material or upload a PDF/image/voice note
2. **Select** your level (Scholar/Engineer/Pro), difficulty, and subject
3. **Click "Generate Flashcards"** → AI creates 10-20 smart cards
4. **Study Tab** → Flip animated cards, listen with TTS, get AI explanations
5. **Quiz Tab** → Timed quiz with auto-grading, streaks, and star ratings
6. **Dashboard** → View progress charts, export cards, track your learning

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, export endpoints
│   │   ├── models.py        # Pydantic schemas
│   │   ├── ai_service.py    # Ollama AI for flashcards
│   │   ├── session_store.py # In-memory session fallback
│   │   └── routers/
│   │       ├── upload.py    # PDF, image, voice, text upload
│   │       ├── generate.py  # Flashcard generation & explanations
│   │       └── quiz.py      # Quiz sessions, grading, ratings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main app shell with tabs & dark mode
│   │   ├── components/
│   │   │   ├── UploadForm.tsx       # Multi-input upload form
│   │   │   ├── FlashcardViewer.tsx  # 3D animated card viewer
│   │   │   ├── QuizMode.tsx         # Timed quiz with grading
│   │   │   └── Dashboard.tsx        # Progress charts & history
│   │   ├── services/api.ts  # Axios API client + LocalStorage persistence
│   │   ├── theme/themeConfig.ts     # Antd v5 theme tokens
│   │   └── utils/aiPrompts.ts       # AI prompt templates
│   └── package.json
├── Dockerfile
└── README.md
```

---

## 🐳 Docker

```bash
docker build -t flashmind .
docker run -p 8000:8000 flashmind

# Open http://localhost:8000
```

---

## 🎯 Versatility

| Audience | Adaptation |
| :--- | :--- |
| 🎒 **Scholar** | Simple Q&A, fun analogies, emoji-rich, easy difficulty |
| ⚙️ **Engineer** | Technical depth, formulas, code snippets, hard mode |
| 📊 **Pro (MBA)** | Case studies, real-world frameworks, business context |

---

## 📝 License

MIT — Built for hackathons, learning, and open education. 🚀
