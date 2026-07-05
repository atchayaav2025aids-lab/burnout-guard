import os
import json
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User, Dataset, AnalysisHistory
from routers.auth import get_current_user
from services.cleaning import clean_dataset
from services.ml import run_ml_pipeline, calculate_rule_based_stress
from services.eda import generate_eda_charts, generate_model_evaluation_charts

router = APIRouter(prefix="/analyze", tags=["analysis"])

@router.post("")
def analyze_dataset(
    dataset_id: str = Query(..., description="ID of uploaded dataset"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Coordinates dataset loading, cleaning, prediction training, and interactive visualization generation.
    Saves report details in AnalysisHistory database.
    """
    # 1. Fetch dataset metadata from DB
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded dataset not found or unauthorized access."
        )
        
    if not os.path.exists(dataset.filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset source file was not found on local disk storage."
        )
        
    try:
        # Load raw data
        raw_df = pd.read_csv(dataset.filepath)
        
        # 2. Trigger Preprocessing & Data Cleaning
        cleaned_df, cleaning_log, encodings = clean_dataset(raw_df)
        
        # Check if Stress Level (or target) exists
        target_col = next((col for col in raw_df.columns if "stress level" in col.lower() or "stress_level" in col.lower()), None)
        
        # Prepare evaluation metrics dict
        model_metrics = {}
        predictions = []
        scores = []
        
        # 3. Model Training vs Rule-Based Prediction
        if target_col:
            # Multi-class machine learning classifiers
            predictions, scores, model_metrics = run_ml_pipeline(raw_df, target_col)
            accuracy_display = f"{model_metrics.get('accuracy', 0.0) * 100:.1f}% ({model_metrics.get('model_name')})"
        else:
            # Rule-based stress classifier
            predictions, scores, model_metrics = calculate_rule_based_stress(raw_df)
            accuracy_display = "Rule-Based Expert Classifier"
            
        # Add predictions and scores back to raw data to generate demographics breakdowns
        analysis_df = raw_df.copy()
        analysis_df["Stress Level"] = predictions
        analysis_df["Stress Score"] = scores
        
        # 4. Generate Interactive Plotly Charts
        plotly_charts = generate_eda_charts(analysis_df, "Stress Level")
        
        # Add evaluation charts if trained ML models
        eval_charts = generate_model_evaluation_charts(model_metrics)
        plotly_charts.update(eval_charts)
        
        # 5. Compile Developer prediction metrics
        # Search for Name and ID columns
        id_col = next((c for c in raw_df.columns if "id" in c.lower() or "employee" in c.lower()), "Employee ID")
        name_col = next((c for c in raw_df.columns if "name" in c.lower()), "Employee Name")
        dept_col = next((c for c in raw_df.columns if "department" in c.lower() or "dept" in c.lower()), "Department")
        age_col = next((c for c in raw_df.columns if "age" in c.lower()), "Age")
        gender_col = next((c for c in raw_df.columns if "gender" in c.lower() or "sex" in c.lower()), "Gender")
        
        employees = []
        low_c = 0
        mod_c = 0
        high_c = 0
        
        for idx, row in raw_df.iterrows():
            pred = predictions[idx]
            score = scores[idx]
            
            if pred == "Low":
                low_c += 1
            elif pred == "Moderate" or pred == "Medium":
                mod_c += 1
            else:
                high_c += 1
                
            # Create employee specific recommendations
            wh = float(row.get("Working Hours", row.get("Weekly Working Hours", 40)))
            ot = float(row.get("Overtime Hours", row.get("Overtime", 0)))
            sat = float(row.get("Job Satisfaction", 6.0))
            leaves = float(row.get("Leave Count", row.get("Leaves", 12)))
            
            recs = []
            if pred == "High":
                if wh > 9.5 or wh > 48.0:
                    recs.append("Reduce daily/weekly work hours immediately.")
                if ot > 2.0 or ot > 10.0:
                    recs.append("Initiate overtime bans and redistribute tasks.")
                if leaves < 6:
                    recs.append("Encourage taking immediate personal time off (PTO).")
                if sat < 4:
                    recs.append("Schedule HR check-in to discuss satisfaction issues.")
                if not recs:
                    recs.append("Schedule manager 1:1 consultation this week.")
            elif pred == "Moderate":
                recs.append("Monitor work logs and schedule informal progress check-ins.")
            else:
                recs.append("Maintain current balanced work patterns.")
                
            # Save raw indicators as list
            raw_metrics = {}
            for col in raw_df.columns:
                val = row[col]
                if pd.isnull(val):
                    raw_metrics[col] = "N/A"
                elif isinstance(val, (int, np.integer)):
                    raw_metrics[col] = int(val)
                elif isinstance(val, (float, np.floating)):
                    raw_metrics[col] = float(np.round(val, 1))
                else:
                    raw_metrics[col] = str(val)
                    
            employees.append({
                "id": str(row[id_col]) if id_col in raw_df.columns else f"EMP{idx+1:04d}",
                "name": str(row[name_col]) if name_col in raw_df.columns else f"Employee {idx+1}",
                "department": str(row[dept_col]) if dept_col in raw_df.columns else "Engineering",
                "age": int(row[age_col]) if age_col in raw_df.columns and not pd.isnull(row[age_col]) else 28,
                "gender": str(row[gender_col]) if gender_col in raw_df.columns else "Female",
                "stress_score": int(score),
                "risk_level": pred,
                "recommendation": recs[0] if recs else "Maintain normal schedule.",
                "all_recommendations": recs,
                "raw_metrics": raw_metrics
            })
            
        # Calculate working hours and sleep hours averages from raw_df
        work_col = None
        for col in raw_df.columns:
            if "work" in col.lower() or "hour" in col.lower():
                work_col = col
                break
        avg_wh = float(np.round(raw_df[work_col].mean(), 1)) if work_col is not None and not raw_df[work_col].empty else 8.0

        sleep_col = None
        for col in raw_df.columns:
            if "sleep" in col.lower():
                sleep_col = col
                break
        avg_sh = float(np.round(raw_df[sleep_col].mean(), 1)) if sleep_col is not None and not raw_df[sleep_col].empty else 7.0

        summary = {
            "total_developers": len(raw_df),
            "average_score": float(np.round(np.mean(scores), 1)) if scores else 0.0,
            "average_working_hours": avg_wh,
            "average_sleep_hours": avg_sh,
            "risk_distribution": {
                "low": low_c,
                "medium": mod_c,
                "high": high_c
            },
            "overall_stress_risk_percentage": float(np.round((high_c / len(raw_df)) * 100, 1)) if len(raw_df) > 0 else 0.0,
            "model_name": model_metrics.get("model_name", "Rule-Based Classifier"),
            "accuracy": accuracy_display,
            "test_accuracy": float(model_metrics.get("accuracy", 1.0)),
            "precision": float(model_metrics.get("precision", 1.0)),
            "recall": float(model_metrics.get("recall", 1.0)),
            "f1_score": float(model_metrics.get("f1_score", 1.0)),
            "cleaning_log": cleaning_log
        }
        
        # 6. Save in Analysis History Table (upsert matching dataset_id)
        existing_history = db.query(AnalysisHistory).filter(AnalysisHistory.id == dataset_id).first()
        if existing_history:
            db.delete(existing_history)
            db.commit()
            
        new_history = AnalysisHistory(
            id=dataset_id,
            user_id=current_user.id,
            dataset_name=dataset.filename,
            upload_date=dataset.uploaded_at,
            accuracy=accuracy_display,
            total_employees=len(raw_df),
            risk_summary_json=json.dumps(summary["risk_distribution"]),
            results_json=json.dumps({
                "summary": summary,
                "employees": employees,
                "charts": plotly_charts
            })
        )
        
        db.add(new_history)
        db.commit()
        
        return {
            "summary": summary,
            "employees": employees,
            "charts": plotly_charts
        }
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}"
        )
