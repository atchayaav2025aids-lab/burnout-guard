import os
import json
from fastapi import APIRouter

router = APIRouter(tags=["metadata"])

METADATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "source_metadata.json"
)

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.get("/model-info")
def get_model_info():
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
            
    # Default fallback if file is missing
    return {
        "source": "unknown",
        "description": "Model metadata is unavailable.",
        "r2_score": "N/A",
        "mae": "N/A"
    }
