import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, AnalysisHistory, Dataset, Report
from routers.auth import get_current_user

router = APIRouter(prefix="/history", tags=["history"])

@router.get("")
def list_history(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Returns previous analyses run by the current authenticated user.
    """
    records = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.upload_date.desc()).all()
    
    output = []
    for rec in records:
        try:
            summary = json.loads(rec.risk_summary_json)
        except Exception:
            summary = {"low": 0, "medium": 0, "high": 0}
            
        output.append({
            "id": rec.id,
            "dataset_name": rec.dataset_name,
            "upload_date": rec.upload_date,
            "accuracy": rec.accuracy,
            "total_employees": rec.total_employees,
            "risk_summary": summary
        })
        
    return output

@router.get("/{history_id}")
def get_history_detail(
    history_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full predictions, metrics, and interactive charts for a past session.
    """
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == history_id, 
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found."
        )
        
    try:
        return json.loads(rec.results_json)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unpack cached results: {str(e)}"
        )

@router.delete("/{history_id}")
def delete_history(
    history_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the past analysis record, database entry, and the locally uploaded CSV file.
    """
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == history_id, 
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found."
        )
        
    # Delete dataset and its local file if present
    dataset = db.query(Dataset).filter(Dataset.id == history_id).first()
    if dataset:
        if os.path.exists(dataset.filepath):
            try:
                os.remove(dataset.filepath)
            except Exception:
                pass
        db.delete(dataset)
        
    # Delete reports associated with this analysis
    reports = db.query(Report).filter(Report.analysis_id == history_id).all()
    for r in reports:
        db.delete(r)
        
    db.delete(rec)
    db.commit()
    
    return {"message": "Analysis history record successfully deleted."}
