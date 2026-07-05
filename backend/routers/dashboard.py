import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, AnalysisHistory, Dataset
from routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard_kpis(
    dataset_id: str = Query(None, description="Currently active dataset ID to filter by"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Computes overall summary KPIs (Total, Low, Moderate, High, Averages, Accuracy)
    drawn from the specified dataset_id. If no ID is passed, returns a clean workspace.
    """
    # Get all uploaded datasets
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.uploaded_at.desc()).all()
    
    recent_uploads = []
    for d in datasets[:5]: # Top 5 recent uploads
        recent_uploads.append({
            "id": d.id,
            "filename": d.filename,
            "rows": d.row_count,
            "cols": d.col_count,
            "uploaded_at": d.uploaded_at,
            "missing": d.missing_count,
            "duplicates": d.duplicate_count
        })
        
    recent_analyses = []
    analyses = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.upload_date.desc()).all()
    
    for a in analyses[:5]:
        try:
            summary = json.loads(a.results_json).get("summary", {})
        except Exception:
            summary = {}
        recent_analyses.append({
            "id": a.id,
            "dataset_name": a.dataset_name,
            "upload_date": a.upload_date,
            "total_employees": a.total_employees,
            "accuracy": a.accuracy,
            "average_score": summary.get("average_score", 0.0)
        })
        
    # If no active dataset is selected, return a clean empty workspace
    if not dataset_id:
        return {
            "has_data": False,
            "total_employees": 0,
            "avg_stress_score": 0,
            "overall_stress_risk_pct": 0,
            "avg_working_hours": 0.0,
            "avg_sleep_hours": 0.0,
            "risk_distribution": {"low": 0, "medium": 0, "high": 0},
            "model_accuracy": "No models trained",
            "last_upload_time": "N/A",
            "recent_uploads": recent_uploads,
            "recent_reports": recent_analyses
        }
        
    # Check if analysis exists for the specified dataset
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == dataset_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    # If dataset exists but has not been analyzed yet
    if not rec:
        # Check if the dataset itself exists
        ds = db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.user_id == current_user.id
        ).first()
        if ds:
            return {
                "has_data": False,
                "active_dataset_id": ds.id,
                "active_dataset_name": ds.filename,
                "total_employees": ds.row_count,
                "avg_stress_score": 0.0,
                "overall_stress_risk_pct": 0.0,
                "avg_working_hours": 0.0,
                "avg_sleep_hours": 0.0,
                "risk_distribution": {"low": 0, "medium": 0, "high": 0},
                "model_accuracy": "Pending Analysis",
                "last_upload_time": ds.uploaded_at,
                "recent_uploads": recent_uploads,
                "recent_reports": recent_analyses
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found"
            )
        
    try:
        results = json.loads(rec.results_json)
        summary = results.get("summary", {})
        dist = summary.get("risk_distribution", {"low": 0, "medium": 0, "high": 0})
        
        # Calculate working hours and sleep hours averages with custom fallbacks
        avg_wh = summary.get("average_working_hours", 0.0)
        avg_sh = summary.get("average_sleep_hours", 0.0)
        
        if avg_wh == 0.0 or avg_sh == 0.0:
            try:
                employees = results.get("employees", [])
                if employees:
                    wh_list = []
                    sh_list = []
                    for emp in employees:
                        metrics = emp.get("raw_metrics", {})
                        for k, v in metrics.items():
                            kl = k.lower()
                            if ("work" in kl or "hour" in kl) and isinstance(v, (int, float)):
                                wh_list.append(v)
                            if "sleep" in kl and isinstance(v, (int, float)):
                                sh_list.append(v)
                    import numpy as np
                    if wh_list: avg_wh = float(np.round(np.mean(wh_list), 1))
                    if sh_list: avg_sh = float(np.round(np.mean(sh_list), 1))
            except Exception:
                pass
        
        return {
            "has_data": True,
            "active_dataset_id": rec.id,
            "active_dataset_name": rec.dataset_name,
            "total_employees": rec.total_employees,
            "avg_stress_score": summary.get("average_score", 0.0),
            "overall_stress_risk_pct": summary.get("overall_stress_risk_percentage", 0.0),
            "avg_working_hours": avg_wh,
            "avg_sleep_hours": avg_sh,
            "risk_distribution": {
                "low": dist.get("low", 0),
                "medium": dist.get("medium", 0),
                "high": dist.get("high", 0)
            },
            "model_accuracy": rec.accuracy,
            "last_upload_time": rec.upload_date,
            "recent_uploads": recent_uploads,
            "recent_reports": recent_analyses
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate dashboard statistics: {str(e)}"
        )
