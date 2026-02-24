# Secure# RAG Chatbot

A modern WhatsApp-style RAG (Retrieval-Augmented Generation) chatbot with local LLM integration.

## Features

- **AI-Powered Chat**: Local Ollama LLM integration
- **Document RAG**: ChromaDB vector store with intelligent retrieval
- **WhatsApp-Style UI**: Beautiful, minimal chat interface
- **Document Management**: Upload, process, and manage documents
- **Source Citations**: Automatic source references with page numbers
- **Real-time Streaming**: Instant AI responses
- **Modern Design**: Clean, responsive interface with animations

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database management
- **ChromaDB**: Vector database for document storage
- **LangChain**: Document processing and embeddings
- **Ollama**: Local LLM integration

### Frontend
- **React**: Modern JavaScript framework
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icons

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Ollama (with qwen2.5:1.5b-instruct model)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Rag
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Default Credentials
- **Admin**: admin@test.com / admin123
- **User**: user@test.com / password123

## Project Structure

```
Rag/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── rag.py               # RAG logic and document processing
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── AdminUpload.jsx
│   │   │   └── HistorySidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Login.jsx
│   │   └── utils/
│   │       └── api.js
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

## Configuration

### Environment Variables
- `OLLAMA_URL`: http://localhost:11434
- `CHROMA_DB_DIR`: ./chroma_db
- `MODEL_NAME`: qwen2.5:1.5b-instruct
- `JWT_SECRET`: supersecret

## Features in Detail

### RAG System
- **Document Processing**: Intelligent chunking with semantic awareness
- **Vector Storage**: ChromaDB for fast similarity search
- **Multi-Query Retrieval**: Enhanced accuracy with query expansion
- **Source Attribution**: Automatic citation with page numbers

### Chat Interface
- **WhatsApp-Style**: Familiar messaging interface
- **Real-time Streaming**: Instant response generation
- **Source Toggle**: Collapsible source citations
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Responsive Design**: Works on all devices

### Document Management
- **File Upload**: Support for PDF and text files
- **Batch Processing**: Efficient handling of large documents
- **Admin Panel**: Document statistics and management
- **Clear Function**: Reset vector database

## License

MIT License - feel free to use and modify!
