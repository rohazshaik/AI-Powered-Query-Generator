"""
File handler module for processing uploaded CSV/Excel/JSON files.
Handles parsing, type detection, and data cleaning.
"""

import pandas as pd
import io
from typing import Dict, List, Any, Tuple
import logging

logger = logging.getLogger(__name__)


def detect_column_type(series: pd.Series) -> str:
    """
    Detect SQLite-compatible type for a pandas Series.
    
    Args:
        series: Pandas Series to analyze
        
    Returns:
        SQLite type: INTEGER, REAL, or TEXT
    """
    # Handle empty series
    if series.empty or series.isna().all():
        return "TEXT"
    
    # Drop NaN values for type detection
    series_clean = series.dropna()
    
    if pd.api.types.is_integer_dtype(series_clean):
        return "INTEGER"
    elif pd.api.types.is_float_dtype(series_clean):
        return "REAL"
    elif pd.api.types.is_datetime64_any_dtype(series_clean):
        return "TEXT"  # Store dates as ISO format strings
    elif pd.api.types.is_bool_dtype(series_clean):
        return "INTEGER"  # Store booleans as 0/1
    else:
        return "TEXT"


def parse_csv(file_content: bytes) -> pd.DataFrame:
    """
    Parse CSV file content into DataFrame.
    
    Args:
        file_content: Raw bytes of CSV file
        
    Returns:
        Parsed DataFrame
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
        logger.info(f"✅ Parsed CSV: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"❌ CSV parsing failed: {str(e)}")
        raise ValueError(f"Failed to parse CSV file: {str(e)}")


def parse_excel(file_content: bytes) -> pd.DataFrame:
    """
    Parse Excel file content into DataFrame.
    
    Args:
        file_content: Raw bytes of Excel file
        
    Returns:
        Parsed DataFrame (first sheet)
    """
    try:
        df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
        logger.info(f"✅ Parsed Excel: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"❌ Excel parsing failed: {str(e)}")
        raise ValueError(f"Failed to parse Excel file: {str(e)}")


def parse_json(file_content: bytes) -> pd.DataFrame:
    """
    Parse JSON file content into DataFrame.
    
    Args:
        file_content: Raw bytes of JSON file
        
    Returns:
        Parsed DataFrame
    """
    try:
        df = pd.read_json(io.BytesIO(file_content))
        logger.info(f"✅ Parsed JSON: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"❌ JSON parsing failed: {str(e)}")
        raise ValueError(f"Failed to parse JSON file: {str(e)}")


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean DataFrame for SQLite insertion.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Cleaned DataFrame
    """
    # Remove completely empty rows
    df = df.dropna(how='all')
    
    # Clean column names (remove special characters, spaces)
    df.columns = [
        col.strip()
        .replace(' ', '_')
        .replace('-', '_')
        .replace('/', '_')
        .replace('(', '')
        .replace(')', '')
        .replace('[', '')
        .replace(']', '')
        .lower()
        for col in df.columns
    ]
    
    # Convert datetime columns to ISO format strings
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # Replace NaN with None for SQLite
    df = df.where(pd.notna(df), None)
    
    logger.info(f"✅ Cleaned DataFrame: {len(df)} rows")
    return df


def get_schema_info(df: pd.DataFrame) -> Dict[str, str]:
    """
    Generate schema information from DataFrame.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dictionary mapping column names to SQLite types
    """
    schema = {}
    for col in df.columns:
        col_type = detect_column_type(df[col])
        schema[col] = col_type
    
    logger.info(f"✅ Generated schema: {schema}")
    return schema


def get_preview_data(df: pd.DataFrame, num_rows: int = 5) -> List[Dict[str, Any]]:
    """
    Get preview of first N rows as list of dictionaries.
    
    Args:
        df: Input DataFrame
        num_rows: Number of rows to preview
        
    Returns:
        List of row dictionaries
    """
    preview_df = df.head(num_rows)
    return preview_df.to_dict('records')


def process_uploaded_file(
    file_content: bytes,
    filename: str
) -> Tuple[pd.DataFrame, Dict[str, str], List[Dict[str, Any]]]:
    """
    Main function to process uploaded file.
    
    Args:
        file_content: Raw file bytes
        filename: Original filename
        
    Returns:
        Tuple of (DataFrame, schema_dict, preview_data)
    """
    logger.info(f"📁 Processing file: {filename}")
    
    # Determine file type and parse
    if filename.endswith('.csv'):
        df = parse_csv(file_content)
    elif filename.endswith(('.xlsx', '.xls')):
        df = parse_excel(file_content)
    elif filename.endswith('.json'):
        df = parse_json(file_content)
    else:
        raise ValueError(f"Unsupported file format: {filename}")
    
    # Clean the data
    df = clean_dataframe(df)
    
    # Generate schema
    schema = get_schema_info(df)
    
    # Get preview
    preview = get_preview_data(df)
    
    logger.info(f"✅ File processed successfully: {filename}")
    return df, schema, preview
