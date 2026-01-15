# 🚀 Free Deployment Guide

## Overview

This guide shows you **3 FREE options** to deploy your Text-to-SQL application online.

---

## ⚠️ Important Note About Ollama

**Ollama runs locally and cannot be deployed to free hosting platforms** because:
- It requires significant CPU/RAM resources
- Free hosting platforms don't support running Ollama
- It needs persistent storage for models

### Solutions:

1. **Option 1 (Recommended):** Deploy frontend only + use a cloud LLM API (OpenAI, Anthropic, Google)
2. **Option 2:** Deploy frontend + backend, replace Ollama with a cloud LLM
3. **Option 3:** Keep Ollama local, deploy frontend only with API proxy

---

## 🎯 Option 1: Frontend + Cloud LLM (Recommended)

### What to Deploy
- **Frontend:** Vercel/Netlify (Free)
- **Backend:** Railway/Render (Free tier)
- **LLM:** OpenAI API (Pay-as-you-go, ~$0.01 per query)

### Steps

#### 1. Replace Ollama with OpenAI

Edit `backend/server.py`:

```python
async def generate_sql_with_llm(question: str) -> dict:
    """Generate SQL query using OpenAI."""
    schema = get_database_schema()
    
    # ... system_message stays the same ...
    
    try:
        logging.info("🔵 Generating SQL with OpenAI...")
        
        client = OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')  # Get from environment
        )
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cheaper model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": question}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content
        # ... rest of parsing logic ...
```

#### 2. Update `.env`

```env
OPENAI_API_KEY=sk-your-openai-key-here
MONGO_URL=mongodb+srv://your-atlas-connection
DB_NAME=text_to_sql_db
CORS_ORIGINS=https://your-frontend.vercel.app
```

#### 3. Deploy Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add environment variables in Railway dashboard
# Deploy
railway up
```

**Railway gives you:**
- ✅ Free 500 hours/month
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ PostgreSQL/MongoDB add-ons

#### 4. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts, set environment variable:
# VITE_API_URL=https://your-backend.railway.app
```

**Vercel gives you:**
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant deployments

---

## 🎯 Option 2: Frontend Only + Backend Proxy

### What to Deploy
- **Frontend:** Vercel/Netlify (Free)
- **Backend:** Keep running locally
- **Proxy:** Use ngrok to expose local backend

### Steps

#### 1. Install ngrok

```bash
# Download from https://ngrok.com/download
# Or use chocolatey on Windows:
choco install ngrok

# Authenticate
ngrok config add-authtoken YOUR_TOKEN
```

#### 2. Expose Backend

```bash
# Start your backend locally
cd backend
py -m uvicorn server:app --reload --port 8000

# In another terminal, expose it
ngrok http 8000
```

You'll get a URL like: `https://abc123.ngrok.io`

#### 3. Update Frontend API URL

Edit `frontend/src/App.jsx`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://abc123.ngrok.io/api';
```

#### 4. Deploy Frontend

```bash
cd frontend
vercel

# Set environment variable:
# VITE_API_URL=https://abc123.ngrok.io/api
```

**Pros:**
- ✅ Keep using Ollama (free)
- ✅ No backend hosting costs

**Cons:**
- ⚠️ Backend must stay running on your PC
- ⚠️ ngrok URL changes on restart (unless paid plan)

---

## 🎯 Option 3: All-in-One with Render

### What to Deploy
- **Frontend + Backend:** Render (Free tier)
- **LLM:** OpenAI/Anthropic API

### Steps

#### 1. Create `render.yaml`

```yaml
services:
  # Backend
  - type: web
    name: text-to-sql-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: MONGO_URL
        sync: false
    
  # Frontend
  - type: web
    name: text-to-sql-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://text-to-sql-backend.onrender.com/api
```

#### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/text-to-sql.git
git push -u origin main
```

#### 3. Deploy on Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Render will auto-deploy both services

**Render gives you:**
- ✅ Free 750 hours/month
- ✅ Auto-deploy on git push
- ✅ Free PostgreSQL database
- ✅ Easy environment variables

---

## 💰 Cost Comparison

| Option | Monthly Cost | Pros | Cons |
|--------|--------------|------|------|
| **Vercel + Railway + OpenAI** | ~$5-10 | Fast, reliable, scalable | Costs money for LLM |
| **Vercel + ngrok + Ollama** | $0 | Completely free | PC must stay on |
| **Render + OpenAI** | ~$5-10 | All-in-one, simple | Costs money for LLM |
| **Local Only** | $0 | Free, private | Not accessible online |

---

## 🔑 Getting API Keys

### OpenAI (Recommended)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Login
3. Go to API Keys → Create new key
4. Cost: ~$0.01 per SQL query (very cheap)

### Anthropic Claude
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Login
3. Get API key
4. Cost: Similar to OpenAI

### Google Gemini (Free Tier!)
1. Go to [ai.google.dev](https://ai.google.dev)
2. Get API key
3. **FREE:** 60 requests/minute
4. Perfect for testing!

---

## 🎯 Recommended Setup for You

Based on your requirements, I recommend:

### **For Testing (Free):**
```
Frontend: Vercel (Free)
Backend: Keep local with ngrok (Free)
LLM: Ollama (Free)
```

### **For Production (Best):**
```
Frontend: Vercel (Free)
Backend: Railway (Free tier)
LLM: Google Gemini API (Free tier)
Database: MongoDB Atlas (Free tier)
```

### **For Maximum Performance:**
```
Frontend: Vercel (Free)
Backend: Railway ($5/month)
LLM: OpenAI GPT-4o-mini ($5-10/month)
Database: MongoDB Atlas (Free tier)
```

---

## 🚀 Quick Start: Deploy in 10 Minutes

### Using Google Gemini (100% Free!)

#### 1. Get Gemini API Key
```bash
# Go to https://ai.google.dev
# Click "Get API Key"
# Copy your key
```

#### 2. Update Backend

Edit `backend/server.py`:

```python
import google.generativeai as genai

async def generate_sql_with_llm(question: str) -> dict:
    """Generate SQL using Google Gemini (Free!)"""
    schema = get_database_schema()
    
    genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""You are an SQL expert. Convert this question to SQL:
    
{schema}

Question: {question}

Return JSON: {{"sql": "...", "explanation": "..."}}
"""
    
    response = model.generate_content(prompt)
    result = json.loads(response.text)
    return result
```

#### 3. Install Dependencies

```bash
pip install google-generativeai
pip freeze > requirements.txt
```

#### 4. Deploy Backend to Railway

```bash
railway login
railway init
railway up
# Add GEMINI_API_KEY in dashboard
```

#### 5. Deploy Frontend to Vercel

```bash
cd frontend
vercel
# Set VITE_API_URL=https://your-backend.railway.app/api
```

**Done! Your app is now live and 100% free!** 🎉

---

## 📝 Summary

| Hosting | Frontend | Backend | LLM | Total Cost |
|---------|----------|---------|-----|------------|
| **Vercel + Railway + Gemini** | Free | Free | Free | **$0/month** ✅ |
| **Vercel + Railway + OpenAI** | Free | Free | ~$5 | **~$5/month** |
| **Render + Gemini** | Free | Free | Free | **$0/month** ✅ |
| **Local + ngrok** | Free | Free | Free | **$0/month** ✅ |

---

## 🎊 Next Steps

1. Choose your deployment option
2. Get API keys if needed
3. Update backend code
4. Deploy!
5. Share your app with the world 🌍

**Need help?** Check the detailed guides above or ask me questions!
