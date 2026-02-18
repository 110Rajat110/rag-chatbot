echo "Setting up Backend..."
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo "Setting up Frontend..."
cd frontend
npm install
cd ..

echo "Pulling Ollama Model..."
ollama pull qwen2.5:1.5b-instruct

echo "Setup Complete!"
