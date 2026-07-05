import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, AnalysisHistory, Report
from routers.auth import get_current_user
from services.reporting import generate_pdf_report, generate_excel_report, generate_csv_report

router = APIRouter(prefix="/report", tags=["reports"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.get("")
def get_report_summary(
    dataset_id: str = Query(..., description="Active analysis session UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the report summary stats and recommendations.
    """
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == dataset_id, 
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis history not found."
        )
        
    try:
        results = json.loads(rec.results_json)
        summary = results.get("summary", {})
        employees = results.get("employees", [])
        
        # Filter high risk list
        high_risk = [e for e in employees if e.get("risk_level") == "High"]
        
        # Recommendations
        recs = [
            "Limit maximum daily working hours to 9.5 hours to mitigate cognitive exhaustion.",
            "Introduce async updates to reduce weekly meeting load by at least 25%.",
            "Establish active check-ins for the flagged High Stress employees.",
            "Encourage immediate PTO usage for employees with low leave balances."
        ]
        
        return {
            "dataset_name": rec.dataset_name,
            "upload_date": rec.upload_date,
            "total_employees": rec.total_employees,
            "risk_summary": json.loads(rec.risk_summary_json),
            "average_score": summary.get("average_score", 0.0),
            "model_name": summary.get("model_name"),
            "accuracy": summary.get("accuracy"),
            "high_risk_count": len(high_risk),
            "high_risk_list": high_risk[:25], # Top 25 high risk employees
            "recommendations": recs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile report: {str(e)}"
        )



@router.get("/download/excel")
def download_excel(
    dataset_id: str = Query(..., description="Active analysis session UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == dataset_id, 
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
        
    try:
        results = json.loads(rec.results_json)
        employees = results.get("employees", [])
        
        excel_path = os.path.join(REPORTS_DIR, f"{dataset_id}.xlsx")
        generate_excel_report(employees, excel_path)
        
        return FileResponse(
            excel_path, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            filename=f"Stress_Risk_Report_{rec.dataset_name.replace('.csv', '')}.xlsx"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {str(e)}")

@router.get("/download/csv")
def download_csv(
    dataset_id: str = Query(..., description="Active analysis session UUID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == dataset_id, 
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
        
    try:
        results = json.loads(rec.results_json)
        employees = results.get("employees", [])
        
        csv_path = os.path.join(REPORTS_DIR, f"{dataset_id}.csv")
        generate_csv_report(employees, csv_path)
        
        return FileResponse(
            csv_path, 
            media_type="text/csv", 
            filename=f"Stress_Risk_Report_{rec.dataset_name.replace('.csv', '')}.csv"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV generation failed: {str(e)}")
