# Secure RAG Chatbot

A high-performance, local-first RAG (Retrieval-Augmented Generation) chatbot designed for secure document analysis.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ 
- **Python**: v3.9+
- **Ollama**: [Download Ollama](https://ollama.com/) and ensure it is running.

### 2. Setup Ollama
Download the memory-efficient model:
```bash
ollama pull qwen2.5:1.5b-instruct
```

### 3. Run Setup Script (Windows)
```powershell
./setup.ps1
```

### 4. Start Application
**Backend:**
```powershell
cd backend
.\venv\Scripts\activate
python main.py
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **JWT**: Secure authentication
- **Ollama**: Local AI integration (Qwen2.5:1.5B)
- **ChromaDB**: Vector database for embeddings
- **LangChain**: Document processing and RAG pipeline

### Frontend
- **React 18**: Modern UI framework
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Professional icon library
- **Vite**: Fast build tool
- **Axios**: HTTP client with auth

### AI/ML
- **Qwen2.5:1.5B**: Efficient local LLM
- **Chroma Vector Store**: Semantic search capabilities
- **Intelligent chunking**: 1000 char chunks with 150 overlap
- **Multi-query retrieval**: Enhanced context relevance

## Project Structure

```
Rag/
├── backend/                    # FastAPI server
│   ├── main.py               # Main application & API endpoints
│   ├── rag.py                # RAG logic & document processing
│   ├── models.py              # Database models
│   ├── schemas.py             # Pydantic schemas
│   ├── auth.py                # Authentication logic
│   └── database.py            # Database configuration
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx          # Chat interface with markdown rendering
│   │   │   ├── AdminUpload.jsx   # Upload with real-time progress
│   │   │   └── HistorySidebar.jsx # Session management
│   │   ├── utils/
│   │   │   ├── api.js            # API client with auth
│   │   │   └── responseFormatter.jsx # Response formatting utilities
│   │   └── App.jsx             # Main app component
│   └── package.json
├── chroma_db/                  # Vector database storage
├── .gitignore                   # Git ignore rules
└── README.md                   # This file
```

## Quick Start

### Prerequisites
- **Python 3.8+** for backend
- **Node.js 16+** for frontend
- **Ollama** running locally with Qwen2.5:1.5B model

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
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Default Credentials

### Admin Account
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Role**: Full access to all features

### User Account
- **Email**: `user@test.com`
- **Password**: `password123`
- **Role**: Chat access only

## Usage Guide

### For Admins
1. **Upload Documents**: Use the Admin tab to upload PDF/TXT files
2. **Monitor Progress**: Watch real-time chunk processing progress
3. **Manage Documents**: View, delete uploaded documents
4. **Clear Database**: Reset system when needed

### For Users
1. **Start Chat**: Begin asking questions about uploaded documents
2. **View History**: Access previous conversations via sidebar
3. **Manage Sessions**: Create new chat sessions as needed

## Document Processing

### Supported Formats
- **PDF files**: `.pdf` (including complex PDFs like `.djvu.pdf`)
- **Text files**: `.txt`
- **Intelligent chunking**: 1000 characters with 150 overlap
- **Batch processing**: 50 chunks per batch for memory efficiency

### Real-time Progress
- **Start**: "Starting to process: filename.pdf"
- **During**: "Processing batch 1/51: 50/2534 chunks"
- **Complete**: "Successfully processed 2534 chunks"

## Development

### Environment Setup
- **Ollama URL**: Set via `OLLAMA_URL` environment variable
- **Default**: `http://localhost:11434`
- **Model**: `qwen2.5:1.5b-instruct`

### Database
- **SQLite**: For user authentication and chat history
- **ChromaDB**: For vector embeddings
- **Automatic migrations**: Database setup on startup

## Security Features

- **JWT Authentication**: Secure token-based access
- **Role-based Authorization**: Admin vs User permissions
- **Session Management**: Secure session handling
- **Input Validation**: Pydantic schemas for all inputs

## API Endpoints

### Authentication
- `POST /login` - User authentication
- `GET /me` - Get current user info

### Chat
- `POST /chat` - Send message (non-streaming)
- `POST /chat/stream` - Send message (streaming)
- `GET /history` - Get chat history
- `GET /sessions` - Get user sessions

### Admin
- `POST /admin/upload` - Upload document (basic)
- `POST /admin/upload-progress/{id}` - Upload with real-time progress
- `GET /admin/upload-progress/{id}` - Get upload progress
- `GET /admin/stats` - Get system statistics
- `GET /admin/files` - List uploaded documents
- `DELETE /admin/documents/{id}` - Delete document
- `POST /admin/clear` - Clear database

## Recent Improvements

### Progress Tracking Fix
- **Thread-safe communication**: asyncio.Queue for reliable updates
- **Real-time chunk progress**: "21/51" style display
- **Enhanced error handling**: Better cleanup and timeout management
- **Visual progress bar**: Animated progress indicator

### Response Formatting
- **Enhanced prompts**: AI instructions for structured responses
- **Markdown rendering**: Headers, bullets, numbered lists
- **Visual hierarchy**: Better readability and organization
- **Professional presentation**: Clean, modern UI

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes**: Follow existing code style
4. **Test thoroughly**: Ensure all features work
5. **Submit PR**: With clear description of changes

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Ready for production use with real-time progress tracking and enhanced user experience!**
