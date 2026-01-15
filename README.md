# 🤖 Text-to-SQL GenAI System

> **Transform natural language into SQL queries using local AI - completely free!**

[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000000?logo=ai)](https://ollama.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

A modern full-stack application that converts natural language questions into SQL queries using **Ollama** (local LLM). Built with a beautiful, responsive UI and powered by FastAPI backend.

**Perfect for:**
- Learning SQL through natural language
- Quick database exploration
- Demonstrating AI/LLM integration
- Portfolio projects

**Key Highlights:**
- ✅ **100% Free** - No API costs, runs completely locally
- ✅ **Privacy-First** - All data stays on your machine
- ✅ **Production-Ready** - Includes security, validation, and error handling
- ✅ **Beautiful UI** - Modern design with dark mode and animations

---

## ✨ Features

- 🤖 **AI-Powered SQL Generation** - Convert natural language to SQL using Ollama (local LLM)
- 📁 **File Upload** - Upload your own CSV/Excel/JSON files and query them
- 🔄 **Database Switching** - Toggle between default database and uploaded data
- 💎 **Modern UI** - Beautiful dark mode interface with glassmorphism and smooth animations
- 📊 **Interactive Results** - View query results in formatted, responsive tables
- 📜 **Query History** - Save and reload previous queries
- 🗄️ **Schema Viewer** - Browse database structure with collapsible tables
- ⚡ **Real-time Execution** - Execute generated queries instantly
- 🔒 **Secure** - Only SELECT queries allowed, with SQL injection protection

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Monaco Editor** | SQL syntax highlighting |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API framework |
| **Ollama** | Local LLM for SQL generation |
| **SQLite** | Database |
| **Motor** | Async MongoDB (optional) |
| **Pydantic** | Data validation |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** 18+ and npm ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/downloads/))
- **Ollama** ([Download](https://ollama.com/download))

### Optional
- **MongoDB** (for persistent query history)
- **Git** (for version control)

---

## 🚀 Installation & Setup

### Step 1: Install Ollama

#### Windows
```bash
# Download from https://ollama.com/download
# Or use winget:
winget install Ollama.Ollama
```

#### macOS
```bash
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Pull the LLM Model

```bash
# Start Ollama service
ollama serve

# In a new terminal, pull the model
ollama pull qwen2.5:0.5b
```

> **Note:** `qwen2.5:0.5b` is a lightweight model (~400MB). For better accuracy, you can use `llama3.2` (~2GB).

### Step 3: Clone the Repository

```bash
git clone https://github.com/yourusername/text-to-sql-genai.git
cd text-to-sql-genai
```

### Step 4: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional - for MongoDB)
# The app works without MongoDB using in-memory storage
echo "MONGO_URL=mongodb://localhost:27017" > .env
echo "DB_NAME=text_to_sql_db" >> .env
echo "CORS_ORIGINS=*" >> .env
```

### Step 5: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

---

## 🎮 Usage

### Starting the Application

You need **3 terminals** open:

#### Terminal 1: Start Ollama
```bash
ollama serve
```
> Keep this running in the background

#### Terminal 2: Start Backend
```bash
cd backend
# Activate venv if not already activated
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Start FastAPI server
python -m uvicorn server:app --reload --port 8000
```
> Backend will be available at: http://localhost:8000

#### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
```
>The frontend will be available at `http://localhost:3000`

## 📁 Upload Your Own Data

### Supported Formats
- **CSV** (.csv)
- **Excel** (.xlsx, .xls)
- **JSON** (.json)

### How to Upload

1. **Click the "Upload Data" button** in the header

2. **Drag and drop your file** or click to browse
   - Maximum file size: 10MB
   - The system will automatically detect column types

3. **Preview your data**
   - See the first 5 rows
   - Review the detected schema
   - Check row and column counts

4. **Start querying**
   - The database will automatically switch to your uploaded data
   - Use natural language to query your own data
   - Example: "Show me the top 10 rows"

### Database Switching

- Use the **Database Selector** dropdown to switch between:
  - Default (E-commerce) database
  - Your uploaded databases
- Delete uploaded databases when no longer needed
- Schema viewer updates automatically when switching databases

### Example Upload

Create a CSV file `sales_data.csv`:
```csv
date,product,quantity,revenue,region
2024-01-15,Laptop,5,6499.95,North
2024-01-16,Mouse,20,599.80,South
2024-01-17,Keyboard,15,1499.85,East
```

Then ask:
- "What's the total revenue by region?"
- "Which product sold the most quantity?"
- "Show me sales from January 2024"

### Using the Application

1. **Open your browser** to `http://localhost:3000`

2. **View the database schema** in the left sidebar to see available tables

3. **Enter a natural language question**, for example:
   - "Show me all products in the Electronics category"
   - "What are the top 5 most expensive products?"
   - "List all customers from New York"
   - "Count how many products are in each category"
   - "Show me all orders with their customer names and product names"

4. **Click "Generate SQL Query"** - Wait ~5-10 seconds for Ollama to process

5. **Review the generated SQL** in the Monaco Editor

6. **Click "Execute Query"** to run the SQL and see results

7. **View query history** in the sidebar to reload previous queries

---

## 📁 Project Structure

```
text-to-sql-genai/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (create this)
│   └── ecommerce.db          # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── index.css         # Tailwind styles
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
│
├── .gitignore
├── README.md
└── DEPLOYMENT.md             # Deployment guide
```

---


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/rohazshaik/AI-Powered-Query-Generator.git/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rohazshaik/AI-Powered-Query-Generator.git/discussions)

---

## 🎯 What's Next?

Potential improvements:
- [ ] Add support for multiple databases (PostgreSQL, MySQL)
- [ ] Implement query optimization suggestions
- [ ] Add data visualization charts
- [ ] Support for INSERT/UPDATE queries (with proper auth)
- [ ] Multi-language support
- [ ] Export results to CSV/JSON
- [ ] Query performance metrics

---

**Built with ❤️ using free and open-source technologies**

**Star ⭐ this repo if you find it helpful!**
