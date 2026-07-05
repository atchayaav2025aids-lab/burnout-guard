import os
import joblib
import pandas as pd
import numpy as np
from services.preprocessing import load_config

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "burnout_model.pkl")

# Human-readable feature names for descriptions
FEATURE_LABELS = {
    "Working Hours": "Daily Working Hours",
    "Overtime Hours": "Daily Overtime Hours",
    "Number of Tasks": "Assigned Tasks",
    "Meeting Hours": "Weekly Meeting Hours",
    "Satisfaction Score": "Job Satisfaction Survey Score",
    "Leave Count": "Leaves Taken",
    "Project Deadlines": "Project Deadlines",
    "Code Commits": "Code Commits",
    "Work-Life Balance Rating": "Work-Life Balance Rating",
    "Response Time": "Response Time"
}

def load_ml_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please train the model first.")
    return joblib.load(MODEL_PATH)

def calculate_burnout_risk(X_processed, raw_meta_df):
    """
    Scores burnout risk for all processed rows.
    Returns:
        results: List of developer risk profiles
        cohort_summary: Overview stats for the upload cohort
    """
    model = load_ml_model()
    config = load_config()
    feature_importances = config["feature_importances"]
    
    # Run prediction (classification: outputs 0, 1, or 2)
    predictions = model.predict(X_processed)
    
    # Compute cohort means and stds for explaining deviations
    cohort_means = X_processed.mean()
    cohort_stds = X_processed.std()
    cohort_stds = cohort_stds.replace(0.0, 1.0).fillna(1.0)
    
    developers = []
    low_count = 0
    medium_count = 0
    high_count = 0
    score_sum = 0
    
    for idx, row_idx in enumerate(X_processed.index):
        dev_id = str(raw_meta_df.loc[row_idx, "Employee ID"])
        pred_class = int(predictions[idx])
        bucket = ["Low", "Medium", "High"][pred_class]
        
        # Increment buckets count
        if bucket == "Low":
            low_count += 1
        elif bucket == "Medium":
            medium_count += 1
        else:
            high_count += 1
            
        # Calculate continuous score from the Burnout Prediction Formula:
        # Stress Score = (Working Hours * 0.3) + (Overtime Hours * 0.2) + (Task Load * 0.2) + (Meeting Hours * 0.1) - (Satisfaction Score * 0.2)
        raw_row = X_processed.loc[row_idx]
        wh = float(raw_row["Working Hours"])
        oth = float(raw_row["Overtime Hours"])
        tasks = float(raw_row["Number of Tasks"])
        meetings = float(raw_row["Meeting Hours"])
        satisfaction = float(raw_row["Satisfaction Score"])
        
        formula_score = (wh * 0.3) + (oth * 0.2) + (tasks * 0.2) + (meetings * 0.1) - (satisfaction * 0.2)
        
        # Scale range [-1.0, 12.0] to [0, 100]
        score = int(np.clip((formula_score + 1.0) / 13.0 * 100, 0.0, 100.0).round())
        score_sum += score
        
        # Compute contributing factors using z-scores relative to cohort
        factors = []
        for feature in X_processed.columns:
            val = float(raw_row[feature])
            mean_val = float(cohort_means[feature])
            std_val = float(cohort_stds[feature])
            importance = feature_importances.get(feature, 0.1)
            
            z_score = (val - mean_val) / std_val
            
            # Protective columns (higher values decrease stress score)
            is_protective = feature in ["Leave Count", "Satisfaction Score"]
            
            if is_protective:
                impact = -z_score * importance
            else:
                impact = z_score * importance
                
            factors.append({
                "feature": feature,
                "value": val,
                "mean": mean_val,
                "z_score": z_score,
                "impact": impact
            })
            
        # Sort factors by absolute impact
        factors.sort(key=lambda x: x["impact"], reverse=True)
        
        # Build explanation strings for top 3 factors
        top_factors = []
        for f in factors[:3]:
            feat = f["feature"]
            val = f["value"]
            mean = f["mean"]
            label = FEATURE_LABELS.get(feat, feat)
            
            if feat == "Satisfaction Score":
                top_factors.append(f"Low job satisfaction ({int(val)}/10 vs team avg {mean:.1f})")
            elif feat == "Leave Count":
                top_factors.append(f"Minimal leave taken ({int(val)} days vs team avg {mean:.1f})")
            elif feat == "Working Hours":
                top_factors.append(f"High working hours ({val:.1f} hrs/day vs team avg {mean:.1f})")
            elif feat == "Overtime Hours":
                top_factors.append(f"High overtime hours ({val:.1f} hrs/day vs team avg {mean:.1f})")
            elif feat == "Meeting Hours":
                top_factors.append(f"High meetings ({val:.1f} hrs/wk vs team avg {mean:.1f})")
            elif feat == "Number of Tasks":
                top_factors.append(f"High task load ({int(val)} assigned tickets vs team avg {mean:.1f})")
            else:
                top_factors.append(f"Deviation in {label} ({val:.1f} vs team avg {mean:.1f})")
                
        # Pad factors list if needed
        if len(top_factors) < 3:
            top_factors.append("Standard work-pattern alignment")
            
        # Compile raw metrics output including optional metadata columns
        raw_metrics = {}
        for col in raw_meta_df.columns:
            val = raw_meta_df.loc[row_idx, col]
            if pd.isnull(val):
                raw_metrics[col] = "N/A"
            elif isinstance(val, (int, np.integer)):
                raw_metrics[col] = int(val)
            elif isinstance(val, (float, np.floating)):
                raw_metrics[col] = float(np.round(val, 1))
            else:
                raw_metrics[col] = str(val)
                
        developers.append({
            "id": dev_id,
            "risk_score": score,
            "risk_bucket": bucket,
            "top_factors": top_factors[:3],
            "raw_metrics": raw_metrics
        })
        
    total = len(X_processed)
    summary = {
        "total_developers": total,
        "risk_distribution": {
            "low": low_count,
            "medium": medium_count,
            "high": high_count
        },
        "average_score": float(np.round(score_sum / total, 1)) if total > 0 else 0.0
    }
    
    return developers, summary
