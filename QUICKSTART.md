# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Ollama
```bash
# Windows: Download from https://ollama.com/download
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start Ollama & Pull Model
```bash
# Terminal 1
ollama serve

# Terminal 2
ollama pull qwen2.5:0.5b
```

### 3. Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open Browser
```
http://localhost:3000
```

## 📝 Example Queries

Try these natural language questions:

1. "Show me all products in the Electronics category"
2. "What are the top 5 most expensive products?"
3. "List all customers from New York"
4. "Count how many products are in each category"
5. "Show me all orders with customer names and product names"

## 🎥 Video Walkthrough

For a complete video tutorial, see: [LINK TO YOUR VIDEO]

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.
