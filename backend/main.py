from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import json
from datetime import datetime
from typing import List

import models
import schemas
import auth
import rag
from database import engine, get_db, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Chatbot API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_populate_db():
    db = next(get_db())
    # Create Admin demo
    admin_email = "admin@test.com"
    if not db.query(models.User).filter(models.User.email == admin_email).first():
        admin_user = models.User(
            email=admin_email,
            password_hash=auth.get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
    
    # Create Normal User demo
    user_email = "user@test.com"
    if not db.query(models.User).filter(models.User.email == user_email).first():
        normal_user = models.User(
            email=user_email,
            password_hash=auth.get_password_hash("password123"),
            role="user"
        )
        db.add(normal_user)
    
    db.commit()

@app.post("/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Chat Endpoints ---

@app.post("/chat")
def chat(payload: schemas.ChatMessage, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. Get history for context
    history_recs = db.query(models.ChatHistory).filter(models.ChatHistory.session_id == payload.session_id).order_by(models.ChatHistory.timestamp.asc()).all()
    history_list = [{"role": "user", "content": h.message} for h in history_recs]
    
    # 2. Get AI response with sources
    ai_response, sources = rag.get_ai_response(payload.message, history_list)
    
    # 3. Store in history
    chat_entry = models.ChatHistory(
        user_id=current_user.id,
        session_id=payload.session_id,
        message=payload.message,
        response=ai_response,
        sources=json.dumps(sources) if sources else "[]"
    )
    db.add(chat_entry)
    db.commit()
    db.refresh(chat_entry)
    
    return {
        "response": ai_response,
        "session_id": payload.session_id,
        "timestamp": chat_entry.timestamp.isoformat(),
        "sources": sources
    }

@app.post("/chat/stream")
def chat_stream(payload: schemas.ChatMessage, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    def generate():
        full_response = []
        sources = []
        
        for chunk in rag.get_streaming_ai_response(payload.message):
            if chunk.startswith("__SOURCES__:"):
                sources = json.loads(chunk.replace("__SOURCES__:", ""))
                # Don't yield sources to the raw text stream, 
                # or yield them in a special format. 
                # For now, let's yield them as a separate event if using SSE.
                # To keep it simple for raw fetch, we'll just not yield them as text.
                continue
            
            full_response.append(chunk)
            yield chunk

        # After stream ends, store in DB
        final_text = "".join(full_response)
        chat_entry = models.ChatHistory(
            user_id=current_user.id,
            session_id=payload.session_id,
            message=payload.message,
            response=final_text,
            sources=json.dumps(sources) if sources else "[]"
        )
        db.add(chat_entry)
        db.commit()

    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/history", response_model=List[schemas.ChatHistoryResponse])
def get_history(session_id: str = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id)
    if session_id:
        query = query.filter(models.ChatHistory.session_id == session_id)
    
    recs = query.order_by(models.ChatHistory.timestamp.asc()).all()
    
    # Parse JSON sources for each record
    results = []
    for r in recs:
        try:
            r_sources = json.loads(r.sources) if r.sources else []
        except:
            r_sources = []
        
        results.append({
            "id": r.id,
            "message": r.message,
            "response": r.response,
            "timestamp": r.timestamp,
            "session_id": r.session_id,
            "sources": r_sources
        })
    return results

@app.get("/sessions")
def get_user_sessions(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Returns unique sessions with last message preview
    sessions = db.query(
        models.ChatHistory.session_id, 
        models.ChatHistory.message, 
        models.ChatHistory.timestamp
    ).filter(models.ChatHistory.user_id == current_user.id).all()
    
    unique_sessions = {}
    for sid, msg, ts in sessions:
        if sid not in unique_sessions or ts > unique_sessions[sid]['timestamp']:
            unique_sessions[sid] = {"session_id": sid, "preview": msg[:30]+"...", "timestamp": ts}
            
    return sorted(list(unique_sessions.values()), key=lambda x: x['timestamp'], reverse=True)

# --- Admin Endpoints ---

@app.get("/admin/stats", dependencies=[Depends(auth.check_admin)])
def admin_stats():
    return rag.get_stats()

@app.post("/admin/upload", dependencies=[Depends(auth.check_admin)])
async def upload_document(file: UploadFile = File(...)):
    if not os.path.exists("./temp"):
        os.makedirs("./temp")
    
    file_path = f"./temp/{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        chunks_count = rag.process_document(file_path)
        os.remove(file_path)
        
        # Save to database
        db = next(get_db())
        doc = models.UploadedDocument(filename=file.filename, chunks=chunks_count)
        db.add(doc)
        db.commit()
        
        return {"filename": file.filename, "chunks": chunks_count, "status": "success"}
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/admin/clear", dependencies=[Depends(auth.check_admin)])
def clear_db(db: Session = Depends(get_db)):
    if not rag.clear_documents():
        raise HTTPException(status_code=500, detail="Failed to clear vector database modules. System lock detected.")
    db.query(models.UploadedDocument).delete()
    db.commit()
    return {"status": "Database cleared"}

@app.get("/admin/files", dependencies=[Depends(auth.check_admin)])
def list_files(db: Session = Depends(get_db)):
    return db.query(models.UploadedDocument).all()

@app.delete("/admin/documents/{doc_id}", dependencies=[Depends(auth.check_admin)])
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.UploadedDocument).filter(models.UploadedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 1. Delete from Vector DB
    rag.delete_by_filename(doc.filename)
    
    # 2. Delete from SQL DB
    db.delete(doc)
    db.commit()
    
    return {"status": "success", "message": f"Document {doc.filename} deleted"}

@app.get("/admin/all-history", dependencies=[Depends(auth.check_admin)])
def get_all_history(db: Session = Depends(get_db)):
    return db.query(models.ChatHistory).order_by(models.ChatHistory.timestamp.desc()).limit(100).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
