"""
Database manager for handling uploaded data.
Creates and manages separate database for user uploads.
"""

import sqlite3
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
import logging
import re

logger = logging.getLogger(__name__)

# Path to uploaded data database
UPLOAD_DB_PATH = Path(__file__).parent / 'uploaded_data.db'


def sanitize_table_name(filename: str) -> str:
    """
    Create a safe table name from filename.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized table name
    """
    # Remove extension
    name = Path(filename).stem
    
    # Replace special characters with underscores
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    
    # Ensure it starts with a letter
    if not name[0].isalpha():
        name = 'table_' + name
    
    # Limit length
    name = name[:50]
    
    return name.lower()


def create_table_from_dataframe(
    df: pd.DataFrame,
    table_name: str,
    schema: Dict[str, str]
) -> None:
    """
    Create SQLite table from DataFrame with specified schema.
    
    Args:
        df: DataFrame to insert
        table_name: Name of table to create
        schema: Dictionary mapping column names to SQLite types
    """
    conn = sqlite3.connect(UPLOAD_DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Drop table if exists
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        
        # Build CREATE TABLE statement
        columns = []
        for col_name, col_type in schema.items():
            columns.append(f"{col_name} {col_type}")
        
        create_sql = f"CREATE TABLE {table_name} ({', '.join(columns)})"
        cursor.execute(create_sql)
        
        logger.info(f"✅ Created table: {table_name}")
        
        # Insert data
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        logger.info(f"✅ Inserted {len(df)} rows into {table_name}")
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Failed to create table: {str(e)}")
        raise
    finally:
        conn.close()


def get_uploaded_tables() -> List[Dict[str, Any]]:
    """
    Get list of all uploaded tables with metadata.
    
    Returns:
        List of table info dictionaries
    """
    if not UPLOAD_DB_PATH.exists():
        return []
    
    conn = sqlite3.connect(UPLOAD_DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        result = []
        for (table_name,) in tables:
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
            # Get column count
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            col_count = len(columns)
            
            result.append({
                "name": table_name,
                "display_name": table_name.replace('_', ' ').title(),
                "row_count": row_count,
                "column_count": col_count,
                "type": "uploaded"
            })
        
        return result
    finally:
        conn.close()


def delete_uploaded_table(table_name: str) -> bool:
    """
    Delete an uploaded table.
    
    Args:
        table_name: Name of table to delete
        
    Returns:
        True if successful
    """
    if not UPLOAD_DB_PATH.exists():
        return False
    
    conn = sqlite3.connect(UPLOAD_DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        conn.commit()
        logger.info(f"✅ Deleted table: {table_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to delete table: {str(e)}")
        return False
    finally:
        conn.close()


def get_table_schema(table_name: str, db_path: Path = UPLOAD_DB_PATH) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get schema information for a specific table.
    
    Args:
        table_name: Name of table
        db_path: Path to database file
        
    Returns:
        Schema dictionary
    """
    if not db_path.exists():
        return {}
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        schema = {
            table_name: [
                {
                    "name": col[1],
                    "type": col[2],
                    "isPrimaryKey": bool(col[5])
                }
                for col in columns
            ]
        }
        
        return schema
    finally:
        conn.close()


def execute_query_on_uploaded_db(sql: str) -> tuple:
    """
    Execute SQL query on uploaded database.
    
    Args:
        sql: SQL query to execute
        
    Returns:
        Tuple of (columns, rows)
    """
    if not UPLOAD_DB_PATH.exists():
        raise ValueError("No uploaded database found")
    
    conn = sqlite3.connect(UPLOAD_DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(sql)
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        return columns, rows
    finally:
        conn.close()
