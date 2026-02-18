import os
import shutil
from datetime import datetime
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
# Removed deprecated community imports
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHROMA_DB_DIR = "./chroma_db"
MODEL_NAME = "qwen2.5:1.5b-instruct"

# Ensure Chroma directory exists
if not os.path.exists(CHROMA_DB_DIR):
    os.makedirs(CHROMA_DB_DIR)

embeddings = OllamaEmbeddings(base_url=OLLAMA_URL, model=MODEL_NAME)
vector_db = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)

def process_document(file_path: str, progress_callback=None):
    """Chunks and embeds a document into ChromaDB with intelligent chunking."""
    print(f"Processing document: {file_path}")
    
    try:
        # Handle various PDF file extensions
        if file_path.lower().endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file_path.lower().endswith(".txt"):
            loader = TextLoader(file_path)
        else:
            # Try to treat as PDF if it has .pdf in the name
            if ".pdf" in file_path.lower():
                try:
                    loader = PyPDFLoader(file_path)
                except Exception as pdf_error:
                    print(f"PDF loading failed: {pdf_error}")
                    # Fall back to text loader
                    loader = TextLoader(file_path)
            else:
                loader = TextLoader(file_path)
        
        print("Loading documents...")
        documents = loader.load()
        print(f"Loaded {len(documents)} pages")
        
        if not documents:
            print("No documents loaded!")
            return 0
        
        # Check if documents have content
        total_content = sum(len(doc.page_content) for doc in documents)
        print(f"Total content length: {total_content} characters")
        
        if total_content == 0:
            print("No content found in documents!")
            return 0
        
        # Use semantic-aware chunking for better accuracy
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Balanced size for context vs granularity
            chunk_overlap=150,  # Good overlap for context continuity
            separators=["\n\n", "\n", ". ", " ", ""]  # Semantic boundaries
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} chunks")
        
        # Filter out very small chunks that lack context
        meaningful_chunks = [chunk for chunk in chunks if len(chunk.page_content.strip()) > 100]
        print(f"Filtered to {len(meaningful_chunks)} meaningful chunks")
        
        if not meaningful_chunks:
            print("No meaningful chunks found!")
            return 0
        
        # Process in batches to avoid memory issues
        batch_size = 50  # Smaller batches for better error handling
        total_processed = 0
        total_batches = (len(meaningful_chunks) + batch_size - 1) // batch_size
        
        for i in range(0, len(meaningful_chunks), batch_size):
            batch_num = i // batch_size + 1
            batch = meaningful_chunks[i:i + batch_size]
            try:
                vector_db.add_documents(batch)
                total_processed += len(batch)
                print(f"Processed batch {batch_num}/{total_batches}: {len(batch)} chunks")
                
                # Send progress update
                if progress_callback:
                    progress_callback({
                        'type': 'progress',
                        'current': total_processed,
                        'total': len(meaningful_chunks),
                        'batch': batch_num,
                        'total_batches': total_batches,
                        'batch_size': len(batch)
                    })
                    
            except Exception as e:
                print(f"Error processing batch {batch_num}: {e}")
                # Try individual chunks if batch fails
                for chunk in batch:
                    try:
                        vector_db.add_documents([chunk])
                        total_processed += 1
                        # Send progress update for individual chunk
                        if progress_callback:
                            progress_callback({
                                'type': 'progress',
                                'current': total_processed,
                                'total': len(meaningful_chunks),
                                'batch': batch_num,
                                'total_batches': total_batches,
                                'batch_size': 1
                            })
                    except Exception as chunk_error:
                        print(f"Error processing individual chunk: {chunk_error}")
        
        print(f"Successfully processed {total_processed} chunks")
        return total_processed
        
    except Exception as e:
        print(f"Error processing document {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return 0

def build_prompt(question: str, context: str, history: List[dict] = None):
    """Helper to build a unified prompt with history and context."""
    history_context = ""
    if history:
        history_context = "\nCONVERSATION HISTORY (Last 3 turns):\n" + "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history[-3:]]) + "\n"

    return f"""You are an expert AI assistant providing information based ONLY on the provided context.
    {history_context}
CONTEXT (Top Documents):
{context}

QUESTION: {question}

IMPORTANT FORMATTING INSTRUCTIONS:
- Structure your response with clear visual hierarchy
- Use bullet points (• or *) for lists of items
- Use numbered lists (1., 2., 3.) for sequential information
- Use bold text (**important terms**) for key concepts
- Use headers (## Topic Name) for main sections
- Keep paragraphs concise (2-3 sentences max)
- Mix formatting styles for better readability
- Include examples when helpful

RESPONSE GUIDELINES:
1. Start with a clear, direct answer
2. Use bullet points for lists of features, components, or characteristics
3. Use numbered lists for steps, sequences, or ordered information
4. Bold key technical terms and important concepts
5. Use headers to organize major topics
6. Keep sentences clear and concise
7. Mix paragraphs with lists for visual variety

Provide a comprehensive but well-structured response based on the context above."""

def get_streaming_ai_response(question: str, history: List[dict] = None):
    """Generates a streaming AI response and yields text chunks."""
    # 1. Query Expansion (Handle terminology bridging)
    search_queries = [question]
    q_low = question.lower()
    if "harvard" in q_low:
        search_queries.append("split cache")
        search_queries.append("separate instruction and data caches")
    if "neumann" in q_low:
        search_queries.append("IAS computer")
        search_queries.append("stored program concept")

    # 2. Multi-query retrieval with better parameters for accuracy
    all_docs = []
    seen_contents = set()
    for q in search_queries:
        # Use more documents for better coverage, but filter for relevance
        results = vector_db.search(q, search_type="mmr", k=12, fetch_k=50)
        for d in results:
            if d.page_content not in seen_contents and len(d.page_content.strip()) > 50:
                all_docs.append(d)
                seen_contents.add(d.page_content)
    
    # 3. Rank by relevance and take top 15 for context
    context = "\n---\n".join([doc.page_content for doc in all_docs[:15]])
    
    # 4. Build sources (captured for the end of the stream)
    sources = []
    for d in all_docs[:15]:
        src = d.metadata.get('source', 'Unknown')
        page = d.metadata.get('page_label', d.metadata.get('page', ''))
        fname = os.path.basename(src)
        if "_" in fname: fname = "_".join(fname.split("_")[1:])
        source_str = f"{fname}" + (f" (p. {page})" if page else "")
        if source_str not in sources: sources.append(source_str)

    # 5. Build prompt
    prompt = build_prompt(question, context, history)

    # 6. Call Ollama Stream
    payload = {"model": MODEL_NAME, "prompt": prompt, "stream": True}
    
    try:
        response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, stream=True)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                if "response" in chunk:
                    yield chunk["response"]
                if chunk.get("done"):
                    # Yield sources as a special final chunk
                    yield f"__SOURCES__:{json.dumps(sources)}"
    except Exception as e:
        yield f"Error connecting to Ollama: {str(e)}"

def get_ai_response(question: str, history: List[dict] = None):
    """Retrieves context and generates AI response with multi-query support."""
    # 1. Query Expansion (Handle terminology bridging like Harvard -> Split Cache)
    search_queries = [question]
    q_low = question.lower()
    if "harvard" in q_low:
        search_queries.append("split cache")
        search_queries.append("separate instruction and data caches")
    if "neumann" in q_low:
        search_queries.append("IAS computer")
        search_queries.append("stored program concept")

    # 2. Multi-query retrieval with better parameters for accuracy
    all_docs = []
    seen_contents = set()
    for q in search_queries:
        # Use more documents for better coverage, but filter for relevance
        results = vector_db.search(q, search_type="mmr", k=12, fetch_k=50)
        for d in results:
            if d.page_content not in seen_contents and len(d.page_content.strip()) > 50:
                all_docs.append(d)
                seen_contents.add(d.page_content)
    
    # 3. Rank by relevance and take top 15 for context
    context = "\n---\n".join([doc.page_content for doc in all_docs[:15]])
    
    # 4. Extract unique sources for citations
    sources = []
    for d in all_docs[:15]:
        src = d.metadata.get('source', 'Unknown')
        page = d.metadata.get('page_label', d.metadata.get('page', ''))
        # Clean up source path to just filename
        fname = os.path.basename(src)
        if "_" in fname: # Handle our UUID prefix
            fname = "_".join(fname.split("_")[1:])
        
        source_str = f"{fname}" + (f" (p. {page})" if page else "")
        if source_str not in sources:
            sources.append(source_str)

    # 5. Build prompt
    prompt = build_prompt(question, context, history)

    # 6. Call Ollama
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
        response.raise_for_status()
        return response.json().get("response", "I couldn't generate a response."), sources
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}", []

def get_stats():
    """Returns basic stats for the dashboard."""
    # This is a bit hacky for Chroma, but works for simple demo
    return {
        "documents_count": len(vector_db.get()['ids']) if vector_db.get() else 0
    }

def delete_by_filename(filename: str):
    """Deletes all chunks associated with a specific filename."""
    global vector_db
    try:
        # 1. We need to find the specific source path used in metadata
        # Since we use uuid_filename in temp/, we might need to search by just the end of the source
        # or better, ensure we store 'filename' in metadata during processing.
        
        # For now, let's search all chunks where 'source' contains the filename
        results = vector_db.get()
        ids_to_delete = []
        for i, meta in enumerate(results['metadatas']):
            source = meta.get('source', '')
            if filename in source:
                ids_to_delete.append(results['ids'][i])
        
        if ids_to_delete:
            vector_db.delete(ids=ids_to_delete)
            return True
        return False
    except Exception as e:
        print(f"Error deleting {filename}: {e}")
        return False

def clear_documents():
    """Deletes all documents from the vector store with robust logging."""
    global vector_db
    log_file = os.path.join(os.getcwd(), "wipe_debug.log")
    
    with open(log_file, "a") as f:
        f.write(f"\n[{datetime.now()}] --- Wipe Sequence Started ---\n")
        try:
            # 1. Clear the SQLAlchemy side (tracked by caller in main.py)
            
            # 2. Clear Chroma side
            f.write(f"Attempting vector_db.delete for all records...\n")
            all_data = vector_db.get()
            ids = all_data['ids']
            f.write(f"Found {len(ids)} documents in vector store.\n")
            
            if ids:
                vector_db.delete(ids=ids)
                f.write("Vector DB internal deletion successful.\n")
            else:
                f.write("Vector store already empty.\n")
            
            # 3. Aggressive directory cleanup (optional but good for consistency)
            # Sometimes delete() leaves files, so we try to rmtree if possible
            f.write("Initiating directory purge...\n")
            vector_db = None # Release reference
            import gc
            gc.collect()
            
            if os.path.exists(CHROMA_DB_DIR):
                # Try to remove the actual files to ensure a fresh start
                shutil.rmtree(CHROMA_DB_DIR, ignore_errors=True)
                f.write("Filesystem purge attempted (shutil.rmtree).\n")
            
            # 4. Re-initialize a clean instance
            os.makedirs(CHROMA_DB_DIR, exist_ok=True)
            vector_db = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
            f.write("Vector engine re-initialized successfully.\n")
            
            return True
        except Exception as e:
            f.write(f"SYSTEM CRITICAL ERROR: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
            # Re-init if it crashed halfway
            if vector_db is None:
                vector_db = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
            return False
