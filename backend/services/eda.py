import json
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

def fig_to_dict(fig):
    """
    Serializes a Plotly figure to a JSON-compatible dict.
    """
    return json.loads(fig.to_json())

def generate_eda_charts(df: pd.DataFrame, target_col: str = "Stress Level"):
    """
    Generates high-contrast corporate charts matching the exact simplified specifications:
    - Bar Charts: Department-wise Stress, Gender-wise Stress, Stress Count by Department
    - Pie Chart: High, Moderate, and Low Stress Distribution
    - Histograms: Working Hours Distribution, Sleep Hours Distribution
    - Correlation Heatmap: Correlation between exact numerical features
    """
    charts = {}
    
    # Colors: Emerald (Low), Amber (Moderate), Red (High)
    color_map = {
        "Low": "#10b981", "Moderate": "#f59e0b", "High": "#ef4444",
        "Low Stress": "#10b981", "Moderate Stress": "#f59e0b", "High Stress": "#ef4444"
    }

    # Helper to find column names
    def find_col(aliases):
        for alias in aliases:
            for col in df.columns:
                if alias.lower() in col.lower():
                    return col
        return None

    dept_col = find_col(["department", "dept"])
    gender_col = find_col(["gender", "sex"])
    age_col = find_col(["age", "years"])
    work_col = find_col(["work", "hour", "working"])
    sleep_col = find_col(["sleep"])
    overtime_col = find_col(["overtime", "ot"])
    leaves_col = find_col(["leave", "vacation", "taken"])
    exp_col = find_col(["experience", "years", "tenure"])
    score_col = find_col(["stress score", "score", "raw stress"])

    # 1. Stress Level Distribution Pie Chart (Low, Moderate, High)
    if target_col in df.columns:
        counts = df[target_col].value_counts().reset_index()
        counts.columns = [target_col, "Count"]
        colors = [color_map.get(str(val), "#6366f1") for val in counts[target_col]]
        
        fig_pie = px.pie(
            counts, 
            names=target_col, 
            values="Count", 
            title="High, Moderate, and Low Stress Distribution",
            color_discrete_sequence=colors
        )
        fig_pie.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", 
            plot_bgcolor="rgba(0,0,0,0)", 
            font_color="#e2e8f0",
            margin=dict(t=50, b=20, l=20, r=20)
        )
        charts["stress_distribution_pie"] = fig_to_dict(fig_pie)

    # 2. Bar Charts
    # A. Department-wise Stress Levels (Grouped Bar Chart)
    if dept_col and target_col in df.columns:
        df_dept_clean = df.dropna(subset=[dept_col, target_col])
        dept_stress = df_dept_clean.groupby([dept_col, target_col]).size().reset_index(name="Count")
        fig_dept = px.bar(
            dept_stress, 
            x=dept_col, 
            y="Count", 
            color=target_col, 
            title="Department-wise Stress Levels",
            barmode="group",
            color_discrete_map=color_map,
            labels={dept_col: "Department", "Count": "Employee Count", target_col: "Stress Level"}
        )
        fig_dept.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#e2e8f0")
        charts["department_stress"] = fig_to_dict(fig_dept)
        
        # B. Stress Count by Department (Stacked Bar Chart)
        fig_dept_count = px.bar(
            dept_stress, 
            x=dept_col, 
            y="Count", 
            color=target_col, 
            title="Stress Count by Department",
            barmode="stack",
            color_discrete_map=color_map,
            labels={dept_col: "Department", "Count": "Employee Count", target_col: "Stress Level"}
        )
        fig_dept_count.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#e2e8f0")
        charts["department_stress_counts"] = fig_to_dict(fig_dept_count)
        
    # C. Gender-wise Stress Distribution (Grouped Bar Chart)
    if gender_col and target_col in df.columns:
        df_gend_clean = df.dropna(subset=[gender_col, target_col])
        gender_stress = df_gend_clean.groupby([gender_col, target_col]).size().reset_index(name="Count")
        fig_gender = px.bar(
            gender_stress, 
            x=gender_col, 
            y="Count", 
            color=target_col, 
            title="Gender-wise Stress Distribution",
            barmode="group",
            color_discrete_map=color_map,
            labels={gender_col: "Gender", "Count": "Employee Count", target_col: "Stress Level"}
        )
        fig_gender.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#e2e8f0")
        charts["gender_stress"] = fig_to_dict(fig_gender)
        
    # 3. Histograms
    # A. Working Hours Distribution
    if work_col:
        df_work_clean = df.dropna(subset=[work_col])
        fig_work_hist = px.histogram(
            df_work_clean,
            x=work_col,
            color=target_col if target_col in df.columns else None,
            title="Working Hours Distribution",
            color_discrete_map=color_map if target_col in df.columns else None,
            labels={work_col: "Daily Working Hours", target_col: "Stress Level"}
        )
        fig_work_hist.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#e2e8f0", barmode="overlay")
        fig_work_hist.update_traces(opacity=0.75)
        charts["working_hours_distribution"] = fig_to_dict(fig_work_hist)
        
    # B. Sleep Hours Distribution
    if sleep_col:
        df_sleep_clean = df.dropna(subset=[sleep_col])
        fig_sleep_hist = px.histogram(
            df_sleep_clean,
            x=sleep_col,
            color=target_col if target_col in df.columns else None,
            title="Sleep Hours Distribution",
            color_discrete_map=color_map if target_col in df.columns else None,
            labels={sleep_col: "Daily Sleep Hours", target_col: "Stress Level"}
        )
        fig_sleep_hist.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#e2e8f0", barmode="overlay")
        fig_sleep_hist.update_traces(opacity=0.75)
        charts["sleep_hours_distribution"] = fig_to_dict(fig_sleep_hist)

    # 4. Correlation Heatmap (Working Hours, Sleep Hours, Overtime, Leaves Taken, Years of Experience, Stress Score)
    corr_cols = {}
    if work_col: corr_cols["Working Hours"] = df[work_col]
    if sleep_col: corr_cols["Sleep Hours"] = df[sleep_col]
    if overtime_col: corr_cols["Overtime"] = df[overtime_col]
    if leaves_col: corr_cols["Leaves Taken"] = df[leaves_col]
    if exp_col: corr_cols["Years of Experience"] = df[exp_col]
    if score_col: corr_cols["Stress Score"] = df[score_col]
    
    if len(corr_cols) > 1:
        corr_df = pd.DataFrame(corr_cols).dropna()
        if not corr_df.empty:
            corr = corr_df.corr().round(2)
            fig_heat = px.imshow(
                corr.values.tolist(),
                x=corr.columns.tolist(),
                y=corr.index.tolist(),
                text_auto=True,
                aspect="auto",
                title="Correlation Heatmap",
                color_continuous_scale="RdBu",
                zmin=-1.0,
                zmax=1.0
            )
            fig_heat.update_layout(
                paper_bgcolor="rgba(0,0,0,0)", 
                plot_bgcolor="rgba(0,0,0,0)", 
                font_color="#e2e8f0",
                margin=dict(t=50, b=20, l=20, r=20)
            )
            charts["correlation_heatmap"] = fig_to_dict(fig_heat)

    return charts

def generate_model_evaluation_charts(metrics: dict):
    """
    Generates evaluation charts like Confusion Matrix and ROC Curve.
    """
    charts = {}
    
    # 1. Confusion Matrix Heatmap
    cm = metrics.get("confusion_matrix")
    classes = metrics.get("classes", ["Low", "Moderate", "High"])
    if cm is not None:
        fig_cm = px.imshow(
            cm,
            text_auto=True,
            x=classes,
            y=classes,
            labels=dict(x="Predicted Label", y="True Label"),
            title="Confusion Matrix",
            color_continuous_scale="Blues"
        )
        fig_cm.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", 
            plot_bgcolor="rgba(0,0,0,0)", 
            font_color="#e2e8f0",
            margin=dict(t=40, b=40, l=40, r=40)
        )
        charts["confusion_matrix"] = fig_to_dict(fig_cm)
        
    # 2. ROC Curve
    roc = metrics.get("roc_curve")
    if roc is not None:
        fig_roc = go.Figure()
        fig_roc.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode="lines", line=dict(dash="dash", color="#64748b"), name="Random Guess"))
        
        for cls_name, curve_data in roc.items():
            fpr = curve_data.get("fpr", [])
            tpr = curve_data.get("tpr", [])
            auc = curve_data.get("auc", 0.0)
            fig_roc.add_trace(go.Scatter(x=fpr, y=tpr, mode="lines", line=dict(width=2), name=f"{cls_name} (AUC = {auc:.2f})"))
            
        fig_roc.update_layout(
            title="Receiver Operating Characteristic (ROC) Curve",
            xaxis_title="False Positive Rate",
            yaxis_title="True Positive Rate",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#e2e8f0",
            legend=dict(x=0.6, y=0.15, bgcolor="rgba(15,23,42,0.6)", bordercolor="#1e293b", borderwidth=1),
            margin=dict(t=50, b=50, l=50, r=50)
        )
        charts["roc_curve"] = fig_to_dict(fig_roc)
        
    # 3. Feature Importance Bar Chart (Horizontal Bar Chart)
    importances = metrics.get("feature_importances")
    if importances:
        feats = list(importances.keys())
        scores = list(importances.values())
        
        sorted_idx = np.argsort(scores)
        sorted_feats = [feats[i] for i in sorted_idx]
        sorted_scores = [scores[i] for i in sorted_idx]
        
        fig_feat = px.bar(
            x=sorted_scores,
            y=sorted_feats,
            orientation="h",
            text=[f"{(s * 100):.1f}%" for s in sorted_scores],
            title="Feature Importance Analysis",
            labels=dict(x="Relative Importance Contribution", y="Feature")
        )
        fig_feat.update_traces(textposition='outside')
        fig_feat.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", 
            plot_bgcolor="rgba(0,0,0,0)", 
            font_color="#e2e8f0",
            margin=dict(t=40, b=40, l=40, r=40)
        )
        charts["feature_importance"] = fig_to_dict(fig_feat)
        
    return charts
