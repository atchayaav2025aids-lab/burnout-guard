import os
import io
import json
import uuid
import pandas as pd
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, Dataset
from routers.auth import get_current_user
from services.cleaning import validate_dataset

router = APIRouter(prefix="/upload", tags=["upload"])

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Handles CSV and Excel uploads, runs validation, saves metadata in DB, and caches raw file.
    """
    filename = file.filename.lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Only CSV or Excel (.xlsx) files are supported."
        )
        
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 15MB limit."
            )
            
        # Parse DataFrame
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed file. Could not read tabular structure: {str(e)}"
        )
        
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no rows."
        )
        
    # Run data validations (duplicates, missing, inconsistencies)
    validation_report = validate_dataset(df)
    
    # Generate unique dataset session ID
    dataset_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_DIR, f"{dataset_id}.csv")
    
    # Save the dataframe as CSV locally
    df.to_csv(filepath, index=False)
    
    # Store schema detail as JSON
    schema_info = {col: str(dtype) for col, dtype in df.dtypes.items()}
    
    # Record metadata in SQLite Datasets Table
    new_dataset = Dataset(
        id=dataset_id,
        user_id=current_user.id,
        filename=file.filename,
        row_count=len(df),
        col_count=len(df.columns),
        filepath=filepath,
        columns_json=json.dumps(schema_info),
        missing_count=validation_report["total_missing"],
        duplicate_count=validation_report["duplicate_rows"]
    )
    
    db.add(new_dataset)
    db.commit()
    
    # Create first 15 rows preview
    preview_df = df.head(15).replace({pd.NA: None, float('nan'): None, np.nan: None})
    preview_records = preview_df.to_dict(orient="records")
    
    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": list(df.columns),
        "data_types": schema_info,
        "validation_report": validation_report,
        "preview": preview_records
    }

@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the dataset metadata and raw preview from SQLite and the local file.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    if not os.path.exists(dataset.filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found."
        )
        
    try:
        df = pd.read_csv(dataset.filepath)
        preview_df = df.head(15).replace({pd.NA: None, float('nan'): None, np.nan: None})
        preview_records = preview_df.to_dict(orient="records")
        
        # Load columns_json
        try:
            schema_info = json.loads(dataset.columns_json)
        except Exception:
            schema_info = {col: "float64" for col in df.columns}
            
        return {
            "dataset_id": dataset.id,
            "filename": dataset.filename,
            "row_count": dataset.row_count,
            "col_count": dataset.col_count,
            "columns": list(df.columns),
            "data_types": schema_info,
            "validation_report": {
                "total_rows": dataset.row_count,
                "duplicate_rows": dataset.duplicate_count,
                "total_missing": dataset.missing_count,
                "is_valid": dataset.missing_count == 0 and dataset.duplicate_count == 0,
                "consistency_issues": []
            },
            "preview": preview_records
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}"
        )
