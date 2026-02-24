# RAG Chatbot - Clean Project Setup

## Quick Setup Instructions

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173/
- Backend API: http://localhost:8000/
- API Docs: http://localhost:8000/docs

### 5. Default Login Credentials
- Admin: admin@test.com / admin123
- User: user@test.com / password123

## Features
- WhatsApp-style chat interface
- RAG (Retrieval-Augmented Generation) with ChromaDB
- Local Ollama LLM integration
- Document upload and management
- Source citations with page numbers
- Real-time streaming responses
- Beautiful minimal UI

## Tech Stack
- Backend: FastAPI, SQLAlchemy, ChromaDB, LangChain
- Frontend: React, TailwindCSS, Axios
- LLM: Ollama (qwen2.5:1.5b-instruct)
- Vector Store: ChromaDB
