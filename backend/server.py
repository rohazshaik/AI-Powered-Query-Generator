from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone
import sqlite3
from openai import OpenAI
import json
import re

# Import file handling modules
from file_handler import process_uploaded_file
from db_manager import (
    sanitize_table_name,
    create_table_from_dataframe,
    get_uploaded_tables,
    delete_uploaded_table,
    get_table_schema,
    execute_query_on_uploaded_db,
    UPLOAD_DB_PATH
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (optional - will use in-memory storage if not available)
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
    db = client[os.environ.get('DB_NAME', 'text_to_sql_db')]
    # Test connection
    import asyncio
    async def test_mongo():
        try:
            await client.admin.command('ping')
            return True
        except:
            return False
    MONGO_AVAILABLE = False  # Will be set to True if connection succeeds
except Exception as e:
    logging.warning(f"MongoDB not available: {e}. Using in-memory storage for history.")
    client = None
    db = None
    MONGO_AVAILABLE = False

# In-memory storage for query history when MongoDB is not available
query_history_memory = []

# Create SQLite database with e-commerce schema
DB_PATH = ROOT_DIR / 'ecommerce.db'

# Active database tracking
active_database = "default"  # "default" or table name from uploaded_data.db

def init_sqlite_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            description TEXT
        )
    ''')
    
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            city TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Create orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            order_date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        # Insert sample products
        products = [
            ('Laptop Pro 15', 'Electronics', 1299.99, 25, 'High-performance laptop with 16GB RAM'),
            ('Wireless Mouse', 'Electronics', 29.99, 150, 'Ergonomic wireless mouse'),
            ('USB-C Hub', 'Electronics', 49.99, 80, '7-in-1 USB-C adapter'),
            ('Office Chair', 'Furniture', 299.99, 40, 'Ergonomic office chair with lumbar support'),
            ('Standing Desk', 'Furniture', 599.99, 15, 'Adjustable height standing desk'),
            ('Coffee Maker', 'Appliances', 89.99, 60, 'Programmable coffee maker'),
            ('Water Bottle', 'Accessories', 19.99, 200, 'Insulated stainless steel water bottle'),
            ('Backpack', 'Accessories', 59.99, 100, 'Laptop backpack with multiple compartments'),
            ('Desk Lamp', 'Electronics', 39.99, 75, 'LED desk lamp with adjustable brightness'),
            ('Notebook Set', 'Stationery', 14.99, 300, 'Set of 3 premium notebooks')
        ]
        cursor.executemany('INSERT INTO products (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)', products)
        
        # Insert sample customers
        customers = [
            ('John Smith', 'john.smith@email.com', '555-0101', 'New York', '2024-01-15T10:30:00'),
            ('Emma Johnson', 'emma.j@email.com', '555-0102', 'Los Angeles', '2024-02-20T14:15:00'),
            ('Michael Brown', 'mbrown@email.com', '555-0103', 'Chicago', '2024-03-10T09:45:00'),
            ('Sarah Davis', 'sarah.d@email.com', '555-0104', 'Houston', '2024-04-05T16:20:00'),
            ('James Wilson', 'jwilson@email.com', '555-0105', 'Phoenix', '2024-05-12T11:00:00'),
            ('Lisa Anderson', 'lisa.a@email.com', '555-0106', 'Philadelphia', '2024-06-18T13:30:00'),
            ('David Martinez', 'dmartinez@email.com', '555-0107', 'San Antonio', '2024-07-22T15:45:00'),
            ('Jennifer Taylor', 'jtaylor@email.com', '555-0108', 'San Diego', '2024-08-30T10:15:00')
        ]
        cursor.executemany('INSERT INTO customers (name, email, phone, city, created_at) VALUES (?, ?, ?, ?, ?)', customers)
        
        # Insert sample orders
        orders = [
            (1, 1, 1, 1299.99, '2024-09-01T10:30:00', 'delivered'),
            (1, 2, 2, 59.98, '2024-09-02T14:20:00', 'delivered'),
            (2, 5, 1, 599.99, '2024-09-05T11:15:00', 'shipped'),
            (3, 3, 3, 149.97, '2024-09-08T16:45:00', 'delivered'),
            (4, 6, 1, 89.99, '2024-09-10T09:30:00', 'processing'),
            (5, 1, 1, 1299.99, '2024-09-12T13:00:00', 'delivered'),
            (6, 4, 2, 599.98, '2024-09-15T10:45:00', 'shipped'),
            (7, 8, 5, 299.95, '2024-09-18T15:20:00', 'delivered'),
            (8, 7, 10, 149.90, '2024-09-20T11:30:00', 'processing'),
            (2, 9, 1, 39.99, '2024-09-22T14:15:00', 'delivered')
        ]
        cursor.executemany('INSERT INTO orders (customer_id, product_id, quantity, total_price, order_date, status) VALUES (?, ?, ?, ?, ?, ?)', orders)
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_sqlite_db()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    sql: str
    explanation: str

class ExecuteQueryRequest(BaseModel):
    sql: str

class ExecuteQueryResponse(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int

class QueryHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    sql: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QueryHistoryCreate(BaseModel):
    question: str
    sql: str

class SchemaInfo(BaseModel):
    tables: Dict[str, List[Dict[str, Any]]]

def get_database_schema() -> str:
    """Get the database schema for context."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    schema_str = "Database Schema:\n\n"
    
    for (table_name,) in tables:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        schema_str += f"Table: {table_name}\n"
        schema_str += "Columns:\n"
        for col in columns:
            col_name = col[1]
            col_type = col[2]
            is_pk = col[5]
            schema_str += f"  - {col_name} ({col_type})"
            if is_pk:
                schema_str += " [PRIMARY KEY]"
            schema_str += "\n"
        schema_str += "\n"
    
    conn.close()
    return schema_str

def sanitize_sql(sql: str) -> str:
    """Validate and sanitize SQL query - only allow SELECT statements."""
    sql = sql.strip()
    
    # Remove markdown code blocks if present
    if sql.startswith('```'):
        lines = sql.split('\n')
        sql = '\n'.join(lines[1:-1]) if len(lines) > 2 else lines[1] if len(lines) > 1 else sql
        sql = sql.strip()
    
    # Check if it's a SELECT statement
    if not sql.upper().startswith('SELECT'):
        raise ValueError("Only SELECT queries are allowed")
    
    # Check for dangerous keywords
    dangerous_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE']
    sql_upper = sql.upper()
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            raise ValueError(f"Dangerous SQL keyword detected: {keyword}")
    
    return sql

async def generate_sql_with_llm(question: str) -> dict:
    """Generate SQL query from natural language using Ollama."""
    
    # Get schema for ACTIVE database (not just default)
    if active_database == "default":
        schema = get_database_schema()
        schema_description = """
SCHEMA:
- products table: id, name, category, price, stock, description
- customers table: id, name, email, phone, city, created_at
- orders table: id, customer_id, product_id, quantity, total_price, order_date, status

CRITICAL RULES:
- The primary key column in ALL tables is called "id" (not product_id, not customer_id, not order_id)
- When joining tables, use the foreign key columns: customer_id and product_id in the orders table
"""
    else:
        # Get schema for uploaded database
        uploaded_schema = get_table_schema(active_database)
        if not uploaded_schema or active_database not in uploaded_schema:
            raise ValueError(f"Schema not found for table: {active_database}")
        
        columns = uploaded_schema[active_database]
        schema_cols = ", ".join([f"{col['name']} ({col['type']})" for col in columns])
        schema = f"Table: {active_database}\nColumns: {schema_cols}"
        
        schema_description = f"""
SCHEMA:
- {active_database} table with columns: {schema_cols}

CRITICAL RULES:
- Use ONLY the column names listed above
- All column names are lowercase with underscores
- Query ONLY the {active_database} table
"""
    
    system_message = f"""You are an expert SQL query generator.

Your task is to convert natural language questions into valid SQLite SELECT queries.

{schema}

{schema_description}

GENERAL RULES:
1. ONLY generate SELECT queries - no INSERT, UPDATE, DELETE, DROP, etc.
2. Use ONLY the EXACT column names from the schema above
3. Return ONLY valid SQL code without markdown formatting or code blocks
4. Use proper SQL syntax for SQLite
5. Add ORDER BY, LIMIT when appropriate

Return your response in this exact JSON format:
{{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "Brief explanation of what the query does"
}}
"""
    
    # Use Ollama only
    try:
        logging.info(f"🟢 Generating SQL with Ollama for database: {active_database}...")
        
        client = OpenAI(
            api_key="ollama",  # Dummy key for Ollama
            base_url="http://localhost:11434/v1"
        )
        
        logging.info(f"Question: {question}")
        response = client.chat.completions.create(
            model="qwen2.5:0.5b",  # Lightweight model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": question}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content
        logging.info(f"✅ Ollama response: {response_text[:100]}...")
        
        # Parse response
        try:
            json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = json.loads(response_text)
            
            # Auto-fix common column name mistakes
            sql = result.get('sql', '')
            sql = sql.replace('product_id,', 'id as product_id,')
            sql = sql.replace('customer_id,', 'id as customer_id,')
            sql = sql.replace('order_id,', 'id as order_id,')
            result['sql'] = sql
            
            return result
        except json.JSONDecodeError:
            return {
                "sql": response_text.strip(),
                "explanation": "SQL query generated from natural language"
            }
            
    except Exception as e:
        logging.error(f"❌ Ollama failed: {type(e).__name__}: {str(e)}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Ollama failed. Make sure Ollama is running (ollama serve). Error: {str(e)}"
        )

# API Routes
@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "text-to-sql-api",
        "database": "connected"
    }

@api_router.post("/generate-sql", response_model=QueryResponse)
async def generate_sql(request: QueryRequest):
    """Generate SQL query from natural language."""
    try:
        if not request.question.strip():
            raise HTTPException(status_code=422, detail="Question cannot be empty")
        
        result = await generate_sql_with_llm(request.question)
        # Validate the generated SQL
        sanitize_sql(result['sql'])
        return QueryResponse(sql=result['sql'], explanation=result.get('explanation', ''))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error in generate_sql: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/execute-query", response_model=ExecuteQueryResponse)
async def execute_query(request: ExecuteQueryRequest):
    """Execute SQL query and return results."""
    try:
        # Sanitize and validate SQL
        sql = sanitize_sql(request.sql)
        
        # Execute query on appropriate database
        if active_database == "default":
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute(sql)
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            conn.close()
        else:
            # Execute on uploaded database
            columns, rows = execute_query_on_uploaded_db(sql)
        
        return ExecuteQueryResponse(
            columns=columns,
            rows=rows,
            row_count=len(rows)
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        raise HTTPException(status_code=400, detail=f"SQL Error: {str(e)}")
    except Exception as e:
        logging.error(f"Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/schema", response_model=SchemaInfo)
async def get_schema():
    """Get database schema information."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        schema_info = {}
        
        for (table_name,) in tables:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            schema_info[table_name] = [
                {
                    "name": col[1],
                    "type": col[2],
                    "isPrimaryKey": bool(col[5])
                }
                for col in columns
            ]
        
        conn.close()
        
        return SchemaInfo(tables=schema_info)
    
    except Exception as e:
        logging.error(f"Error getting schema: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/history", response_model=QueryHistory)
async def save_history(input: QueryHistoryCreate):
    """Save query to history."""
    try:
        history_obj = QueryHistory(**input.model_dump())
        
        if db is not None:
            doc = history_obj.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.query_history.insert_one(doc)
        else:
            # Use in-memory storage
            query_history_memory.append(history_obj)
            # Keep only last 50 items
            if len(query_history_memory) > 50:
                query_history_memory.pop(0)
        
        return history_obj
    except Exception as e:
        logging.error(f"Error saving history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=List[QueryHistory])
async def get_history():
    """Get query history."""
    try:
        if db is not None:
            history = await db.query_history.find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
            
            for item in history:
                if isinstance(item['timestamp'], str):
                    item['timestamp'] = datetime.fromisoformat(item['timestamp'])
            
            return history
        else:
            # Return in-memory history
            return sorted(query_history_memory, key=lambda x: x.timestamp, reverse=True)[:50]
    except Exception as e:
        logging.error(f"Error getting history: {str(e)}")
        # Return empty list on error instead of raising exception
        return []

@api_router.get("/sample-data")
async def get_sample_data():
    """Get sample data overview."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get counts
        cursor.execute("SELECT COUNT(*) FROM products")
        products_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM customers")
        customers_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM orders")
        orders_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "products_count": products_count,
            "customers_count": customers_count,
            "orders_count": orders_count
        }
    except Exception as e:
        logging.error(f"Error getting sample data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload-data")
async def upload_data(file: UploadFile = File(...)):
    """Upload CSV/Excel/JSON file and create table."""
    global active_database
    
    try:
        # Validate file size (10MB limit)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls', '.json', '.sql', '.db', '.sqlite')):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload CSV, Excel, JSON, or SQL database files"
            )
        
        logging.info(f"📁 Uploading file: {file.filename}")
        
        # Process the file
        df, schema, preview = process_uploaded_file(file_content, file.filename)
        
        # Create table name
        table_name = sanitize_table_name(file.filename)
        
        # Create table in uploaded database
        create_table_from_dataframe(df, table_name, schema)
        
        # Switch to uploaded database
        active_database = table_name
        
        logging.info(f"✅ File uploaded successfully: {table_name}")
        
        return {
            "success": True,
            "table_name": table_name,
            "display_name": table_name.replace('_', ' ').title(),
            "row_count": len(df),
            "column_count": len(df.columns),
            "schema": schema,
            "preview": preview
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"❌ Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/databases")
async def get_databases():
    """Get list of available databases."""
    databases = [
        {
            "name": "default",
            "display_name": "Default (E-commerce)",
            "type": "default",
            "active": active_database == "default"
        }
    ]
    
    # Add uploaded databases
    uploaded = get_uploaded_tables()
    for table in uploaded:
        table["active"] = active_database == table["name"]
        databases.append(table)
    
    return {"databases": databases, "active": active_database}

@api_router.post("/switch-database")
async def switch_database(db_name: str):
    """Switch active database."""
    global active_database
    
    if db_name == "default":
        active_database = "default"
        return {"success": True, "active_database": "default"}
    
    # Check if uploaded database exists
    uploaded = get_uploaded_tables()
    if any(t["name"] == db_name for t in uploaded):
        active_database = db_name
        return {"success": True, "active_database": db_name}
    
    raise HTTPException(status_code=404, detail="Database not found")

@api_router.delete("/delete-upload/{table_name}")
async def delete_upload(table_name: str):
    """Delete an uploaded table."""
    global active_database
    
    success = delete_uploaded_table(table_name)
    
    if success:
        # Switch to default if deleted table was active
        if active_database == table_name:
            active_database = "default"
        return {"success": True, "message": f"Deleted {table_name}"}
    
    raise HTTPException(status_code=404, detail="Table not found")

@api_router.get("/active-schema")
async def get_active_schema():
    """Get schema for currently active database."""
    if active_database == "default":
        # Return default database schema
        return await get_schema()
    else:
        # Return uploaded database schema
        schema = get_table_schema(active_database)
        return {"tables": schema}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()