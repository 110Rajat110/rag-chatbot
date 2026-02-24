@echo off
echo Setting up RAG Chatbot...

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo Backend installation failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Frontend Dependencies...
cd ../frontend
npm install
if errorlevel 1 (
    echo Frontend installation failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Services...
echo.
echo Starting Backend...
start cmd /k "cd ../backend && python main.py"

echo Starting Frontend...
timeout /t 3 >nul
start cmd /k "cd ../frontend && npm run dev"

echo.
echo Services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
