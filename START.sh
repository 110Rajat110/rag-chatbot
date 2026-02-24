#!/bin/bash
echo "Setting up RAG Chatbot..."

echo ""
echo "[1/3] Installing Backend Dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Backend installation failed!"
    exit 1
fi

echo ""
echo "[2/3] Installing Frontend Dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Frontend installation failed!"
    exit 1
fi

echo ""
echo "[3/3] Starting Services..."
echo ""
echo "Starting Backend..."
gnome-terminal -- bash -c "cd ../backend && python main.py" &

echo "Starting Frontend..."
sleep 3
gnome-terminal -- bash -c "cd ../frontend && npm run dev" &

echo ""
echo "Services are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Setup complete!"
