import os
import json
import pandas as pd
import numpy as np

# Load model configuration
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "model_config.json")

# Predefined aliases for flexible column mapping
COLUMN_ALIASES = {
    "Employee ID": ["employee id", "employee_id", "id", "dev id", "dev_id", "developer id", "developer_id", "emp id", "empid"],
    "Working Hours": ["working hours", "working_hours", "daily working hours", "daily_working_hours", "hours per day", "hours_per_day", "work hours", "work_hours", "working hours per day", "working_hours_per_day"],
    "Overtime Hours": ["overtime hours", "overtime_hours", "overtime", "daily overtime", "daily_overtime", "extra hours", "extra_hours", "overtime hours per day", "overtime_hours_per_day"],
    "Number of Tasks": ["number of tasks", "number_of_tasks", "tasks", "tasks assigned", "tasks_assigned", "tickets", "tickets assigned", "tickets_assigned", "task load", "task_load", "resource allocation", "resource_allocation"],
    "Meeting Hours": ["meeting hours", "meeting_hours", "meetings", "weekly meetings", "weekly_meetings", "meetings per week", "meetings_per_week", "meeting hours per week", "meeting_hours_per_week"],
    "Satisfaction Score": ["satisfaction score", "satisfaction_score", "satisfaction", "employee satisfaction", "employee_satisfaction", "survey score", "survey_score", "score", "employee satisfaction survey scores", "employee_satisfaction_survey_scores"],
    "Leave Count": ["leave count", "leave_count", "leave taken", "leave_taken", "leaves", "leaves taken", "leaves_taken", "leave records", "leave_records", "time off", "time_off", "leave records"],
    "Project Deadlines": ["project deadlines", "project_deadlines", "deadlines", "deadline count", "deadline_count", "urgent deadlines", "urgent_deadlines"],
    "Code Commits": ["code commits", "code_commits", "commits", "commits per week", "commits_per_week", "commit count", "commit_count", "number of code commits", "number_of_code_commits"],
    "Work-Life Balance Rating": ["work-life balance rating", "work_life_balance_rating", "work life balance", "work_life_balance", "wlb", "balance rating", "balance_rating", "work-life balance ratings", "work_life_balance_ratings"],
    "Response Time": ["response time", "response_time", "email response time", "email_response_time", "message response time", "message_response_time", "response time to emails/messages", "response_time_to_emails_messages"]
}

def load_config():
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Model configuration not found at {CONFIG_PATH}. Please run model training first.")
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

def map_columns(df_cols):
    """
    Fuzzy/alias matching for CSV columns.
    Returns:
        mapping: Dict[expected_col, uploaded_col]
        report: Dict detailing mapped, unmapped and missing features
    """
    mapping = {}
    mapped_uploaded = set()
    
    def normalize(s):
        return "".join(c for c in str(s).lower() if c.isalnum() or c.isspace()).strip()

    # Step 1: Case-insensitive alias matching
    for expected_col, aliases in COLUMN_ALIASES.items():
        found = False
        for uploaded_col in df_cols:
            norm_uploaded = normalize(uploaded_col)
            if norm_uploaded in [normalize(a) for a in aliases] or norm_uploaded == normalize(expected_col):
                mapping[expected_col] = uploaded_col
                mapped_uploaded.add(uploaded_col)
                found = True
                break
        
        # Step 2: Substring matching if not found
        if not found:
            for uploaded_col in df_cols:
                if uploaded_col in mapped_uploaded:
                    continue
                norm_uploaded = normalize(uploaded_col)
                for alias in aliases:
                    if normalize(alias) in norm_uploaded or norm_uploaded in normalize(alias):
                        mapping[expected_col] = uploaded_col
                        mapped_uploaded.add(uploaded_col)
                        found = True
                        break
                if found:
                    break
                    
    # Generate column mapping report
    missing = [col for col in COLUMN_ALIASES.keys() if col not in mapping]
    unmapped = [col for col in df_cols if col not in mapped_uploaded]
    
    report = {
        "mapped": mapping,
        "missing": missing,
        "unmapped": unmapped
    }
    
    return mapping, report

def preprocess_dataframe(raw_df, mapping):
    """
    Transforms the uploaded dataframe into features expected by the ML model.
    """
    config = load_config()
    medians = config["medians"]
    
    processed_df = pd.DataFrame(index=raw_df.index)
    
    # 1. Map Employee ID or create fallback index-based IDs
    emp_id_col = mapping.get("Employee ID")
    if emp_id_col and emp_id_col in raw_df.columns:
        processed_df["Employee ID"] = raw_df[emp_id_col].astype(str)
    else:
        processed_df["Employee ID"] = [f"DEV{i:04d}" for i in range(1, len(raw_df) + 1)]
        
    # 2. Fill all 10 numeric stress indicators (handling imputation from config medians if missing)
    indicators = [
        "Working Hours", "Overtime Hours", "Number of Tasks", "Meeting Hours",
        "Satisfaction Score", "Leave Count", "Project Deadlines", "Code Commits",
        "Work-Life Balance Rating", "Response Time"
    ]
    
    for col in indicators:
        uploaded_name = mapping.get(col)
        # Default fallback medians if not in config
        default_medians = {
            "Working Hours": 8.0,
            "Overtime Hours": 1.0,
            "Number of Tasks": 5,
            "Meeting Hours": 10.0,
            "Satisfaction Score": 7,
            "Leave Count": 12,
            "Project Deadlines": 2,
            "Code Commits": 20,
            "Work-Life Balance Rating": 3,
            "Response Time": 30
        }
        median_val = medians.get(col, default_medians.get(col, 0.0))
        
        if uploaded_name and uploaded_name in raw_df.columns:
            # Convert to numeric, clean formatting, fill NaNs
            series = pd.to_numeric(raw_df[uploaded_name].astype(str).str.replace(r'[^\d\.]', '', regex=True), errors="coerce")
            processed_df[col] = series.fillna(median_val)
        else:
            processed_df[col] = median_val
            
    # 3. Build the final X matrix with correct ordering of features for the ML model (only the 6 inputs)
    feature_order = config["features"]
    X = processed_df[feature_order].copy()
    
    # 4. Keep track of the original columns to reconstruct developer records later
    meta_df = pd.DataFrame(index=raw_df.index)
    meta_df["Employee ID"] = processed_df["Employee ID"]
    
    # Save a representation of all raw inputs for context display
    for col in indicators:
        uploaded_name = mapping.get(col)
        if uploaded_name and uploaded_name in raw_df.columns:
            meta_df[col] = raw_df[uploaded_name]
        else:
            meta_df[col] = np.nan # Mark as missing
            
    return X, meta_df
