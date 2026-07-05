import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
import joblib

def train_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    data_path = os.path.join(project_root, "data", "raw_burnout_data.csv")
    model_output_path = os.path.join(current_dir, "burnout_model.pkl")
    config_output_path = os.path.join(current_dir, "model_config.json")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Raw data file not found at {data_path}. Run fetch_dataset.py first.")
        
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # 1. Map Target to numeric classes: Low -> 0, Medium -> 1, High -> 2
    target_map = {"Low": 0, "Medium": 1, "High": 2}
    df["Stress_encoded"] = df["Stress Level"].map(target_map)
    
    # Drop rows where target mapping failed
    df = df.dropna(subset=["Stress_encoded"])
    
    # 2. Define input features
    feature_columns = [
        "Working Hours",
        "Overtime Hours",
        "Number of Tasks",
        "Meeting Hours",
        "Satisfaction Score",
        "Leave Count"
    ]
    
    # Impute missing values for inputs if any, and store medians
    medians = {}
    for col in feature_columns:
        median_val = df[col].median()
        if pd.isnull(median_val):
            median_val = 0.0
        medians[col] = float(np.round(median_val, 3))
        df[col] = df[col].fillna(median_val)
        
    X = df[feature_columns]
    y = df["Stress_encoded"].astype(int)
    
    # 3. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Compare Classifiers
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "DecisionTree": DecisionTreeClassifier(max_depth=5, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    }
    
    # Try loading XGBoost if available
    try:
        from xgboost import XGBClassifier
        models["XGBoost"] = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
        print("XGBoost is available in the environment; adding it to comparisons.")
    except ImportError:
        print("XGBoost not available; skipping.")
        
    best_name = None
    best_model = None
    best_accuracy = -1.0
    best_f1 = -1.0
    
    print("Evaluating models...")
    for name, clf in models.items():
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="macro")
        print(f" - {name}: Accuracy = {acc:.4f}, Macro-F1 = {f1:.4f}")
        
        if acc > best_accuracy:
            best_accuracy = acc
            best_f1 = f1
            best_name = name
            best_model = clf
            
    print(f"Selected Best Model: {best_name} with Accuracy {best_accuracy:.4f}")
    
    # 5. Save selected model
    joblib.dump(best_model, model_output_path)
    print(f"Saved model to {model_output_path}")
    
    # 6. Extract Feature Importances (or coefficients for Logistic Regression)
    feature_importance_dict = {}
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        feature_importance_dict = {
            feat: float(np.round(imp, 4))
            for feat, imp in zip(feature_columns, importances)
        }
    elif hasattr(best_model, "coef_"):
        # Sum of absolute coefficients per feature across classes
        coefs = np.abs(best_model.coef_).sum(axis=0)
        coefs = coefs / coefs.sum() # normalize to sum to 1.0
        feature_importance_dict = {
            feat: float(np.round(coef, 4))
            for feat, coef in zip(feature_columns, coefs)
        }
    else:
        # Equal fallback if neither exists
        feature_importance_dict = {feat: 1.0 / len(feature_columns) for feat in feature_columns}
        
    # 7. Write model training config
    config = {
        "features": feature_columns,
        "medians": medians,
        "categorical_encodings": {}, # No categorical encodings needed for classification inputs now
        "metrics": {
            "accuracy": float(np.round(best_accuracy, 4)),
            "r2_score": f"{best_accuracy * 100:.1f}%", # keep key to avoid breaking frontend UI expectations
            "mae": f"{best_f1:.3f} F1"
        },
        "feature_importances": feature_importance_dict,
        "reference_date": pd.Timestamp.now().strftime("%Y-%m-%d")
    }
    
    with open(config_output_path, "w") as f:
        json.dump(config, f, indent=4)
    print(f"Saved training config to {config_output_path}")
    
    # 8. Update data source metadata
    metadata_path = os.path.join(project_root, "data", "source_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        metadata["r2_score"] = f"{best_accuracy * 100:.1f}%"
        metadata["mae"] = f"{best_f1:.3f} F1"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

if __name__ == "__main__":
    train_model()
