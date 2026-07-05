import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder

def validate_dataset(df: pd.DataFrame):
    """
    Performs data validation on the raw dataframe.
    Returns a dictionary summarizing validation anomalies.
    """
    total_rows = len(df)
    duplicate_rows = int(df.duplicated().sum())
    
    # Missing values validation
    missing_report = df.isnull().sum().to_dict()
    total_missing = sum(missing_report.values())
    
    # Outliers detection (numerical cols only)
    outliers_report = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        col_clean = df[col].dropna()
        if len(col_clean) > 0:
            q25 = np.percentile(col_clean, 25)
            q75 = np.percentile(col_clean, 75)
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            outliers_count = int(((col_clean < lower_bound) | (col_clean > upper_bound)).sum())
            outliers_report[col] = outliers_count
            
    # Check data consistency
    consistency_issues = []
    
    # Check working hours boundaries
    wh_col = next((c for c in df.columns if "work" in c.lower() and "hour" in c.lower()), None)
    if wh_col:
        bad_hours = int((df[wh_col] < 0).sum() + (df[wh_col] > 24).sum() if df[wh_col].dtype in [np.float64, np.int64] else 0)
        if bad_hours > 0:
            consistency_issues.append(f"Found {bad_hours} rows with daily working hours outside [0, 24].")
            
    # Check sleep hours
    sleep_col = next((c for c in df.columns if "sleep" in c.lower()), None)
    if sleep_col:
        bad_sleep = int((df[sleep_col] < 0).sum() + (df[sleep_col] > 24).sum() if df[sleep_col].dtype in [np.float64, np.int64] else 0)
        if bad_sleep > 0:
            consistency_issues.append(f"Found {bad_sleep} rows with sleep hours outside [0, 24].")

    return {
        "total_rows": total_rows,
        "duplicate_rows": duplicate_rows,
        "total_missing": total_missing,
        "missing_by_column": missing_report,
        "outliers_by_column": outliers_report,
        "consistency_issues": consistency_issues,
        "is_valid": len(consistency_issues) == 0
    }

def clean_dataset(df: pd.DataFrame):
    """
    Cleans the dataset by:
    1. Removing duplicate rows
    2. Imputing missing values (medians for numerical, modes for categoricals)
    3. Trimming/capping outliers (Z-score thresholds)
    4. Label encoding categoricals
    5. Normalizing numerical features
    Returns:
        cleaned_df: Cleaned dataframe ready for model training
        cleaning_report: Details of what was cleaned
    """
    cleaning_report = []
    
    # 1. Remove duplicate records
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        cleaning_report.append(f"Removed {dup_count} duplicate records.")
    else:
        cleaning_report.append("No duplicate records found.")
        
    cleaned_df = df.copy()
    
    # Identify column types
    numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = cleaned_df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # 2. Impute missing values
    imputed_count = 0
    for col in numeric_cols:
        null_mask = cleaned_df[col].isnull()
        null_count = int(null_mask.sum())
        if null_count > 0:
            median_val = cleaned_df[col].median()
            if pd.isnull(median_val):
                median_val = 0.0
            cleaned_df.loc[null_mask, col] = median_val
            imputed_count += null_count
            
    for col in categorical_cols:
        null_mask = cleaned_df[col].isnull()
        null_count = int(null_mask.sum())
        if null_count > 0:
            mode_val = cleaned_df[col].mode().iloc[0] if not cleaned_df[col].mode().empty else "Unknown"
            cleaned_df.loc[null_mask, col] = mode_val
            imputed_count += null_count
            
    if imputed_count > 0:
        cleaning_report.append(f"Imputed {imputed_count} missing values.")
    else:
        cleaning_report.append("No missing values found.")
        
    # 3. Outlier handling (Cap outliers beyond 3 std devs)
    capped_outliers = 0
    for col in numeric_cols:
        col_mean = cleaned_df[col].mean()
        col_std = cleaned_df[col].std()
        if col_std > 0:
            lower_bound = col_mean - 3 * col_std
            upper_bound = col_mean + 3 * col_std
            
            # Count outliers
            outliers_mask = (cleaned_df[col] < lower_bound) | (cleaned_df[col] > upper_bound)
            outliers_count = int(outliers_mask.sum())
            if outliers_count > 0:
                cleaned_df[col] = np.clip(cleaned_df[col], lower_bound, upper_bound)
                capped_outliers += outliers_count
                
    if capped_outliers > 0:
        cleaning_report.append(f"Capped {capped_outliers} outliers using 3-Standard-Deviation threshold.")
    else:
        cleaning_report.append("No critical outliers detected.")
        
    # 4. Label Encoding categoricals
    encodings = {}
    encoded_cols = []
    for col in categorical_cols:
        # Ignore ID columns
        if "id" in col.lower() or "employee" in col.lower():
            continue
        le = LabelEncoder()
        cleaned_df[col] = le.fit_transform(cleaned_df[col].astype(str))
        encodings[col] = {label: int(idx) for idx, label in enumerate(le.classes_)}
        encoded_cols.append(col)
        
    if encoded_cols:
        cleaning_report.append(f"Label encoded categorical columns: {', '.join(encoded_cols)}.")
        
    # 5. Normalization/Standardization
    scaler = MinMaxScaler()
    scaling_cols = [c for c in numeric_cols if c not in ["Employee ID", "Employee Name", "Department", "Gender"]]
    if scaling_cols:
        cleaned_df[scaling_cols] = scaler.fit_transform(cleaned_df[scaling_cols])
        cleaning_report.append("Normalized numerical features to scale [0, 1].")
        
    return cleaned_df, cleaning_report, encodings
