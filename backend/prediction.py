import os
import sys
from typing import Dict, Any
import numpy as np
import pandas as pd
from fastapi import HTTPException, status

# Ensure project root & ml/src are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
ML_SRC_DIR = os.path.join(PROJECT_ROOT, "ml", "src")

for path_entry in [PROJECT_ROOT, ML_SRC_DIR]:
    if path_entry not in sys.path:
        sys.path.insert(0, path_entry)

from features import create_features, get_feature_columns
from backend.database import get_supabase_client

RISK_THRESHOLD = 0.50


def predict_stockout(facility_id: str, medicine_id: str, model_pipeline: Any) -> Dict[str, Any]:
    """
    Retrieves historical inventory for (facility_id, medicine_id) from Supabase,
    reconstructs features using ml/src/features.py, and computes 3-day stockout risk prediction.
    """
    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML prediction model is not loaded."
        )

    supabase = get_supabase_client()

    # 1. Verify Facility existence & get facility_type
    fac_res = supabase.table("facilities").select("id, name, type").eq("id", facility_id).execute()
    if not fac_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility '{facility_id}' not found."
        )
    facility_info = fac_res.data[0]

    # 2. Verify Medicine existence
    med_res = supabase.table("medicines").select("id, name").eq("id", medicine_id).execute()
    if not med_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine '{medicine_id}' not found."
        )
    medicine_info = med_res.data[0]

    # 3. Retrieve Historical Inventory from Supabase
    inv_res = (
        supabase.table("inventory")
        .select("date, opening_stock, received_quantity, dispensed_quantity, closing_stock, days_since_restock")
        .eq("facility_id", facility_id)
        .eq("medicine_id", medicine_id)
        .order("date", desc=False)
        .execute()
    )

    if not inv_res.data or len(inv_res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Insufficient historical inventory data for facility '{facility_id}' and medicine '{medicine_id}'."
        )

    # 4. Construct DataFrame for Feature Engineering
    df = pd.DataFrame(inv_res.data)
    df["facility_id"] = facility_id
    df["facility_type"] = facility_info["type"]
    df["medicine_id"] = medicine_id
    # Target placeholder so features.py target cleanup doesn't fail
    df["stockout_next_3_days"] = np.nan

    # 5. Run exact feature engineering logic from ml/src/features.py
    featured_df = create_features(df)

    # 6. Extract feature columns for the most recent date state
    latest_row = featured_df.iloc[-1]
    as_of_date = str(latest_row["date"])[:10]

    feature_cols = get_feature_columns()
    X = pd.DataFrame([latest_row[feature_cols]])

    # 7. Model Inference
    try:
        raw_proba = model_pipeline.predict_proba(X)
        stockout_proba = float(np.asarray(raw_proba)[0, 1])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing model prediction inference: {str(e)}"
        )

    # 8. Determine Risk Category based on P4 Operational Threshold (0.50)
    risk = "HIGH_RISK" if stockout_proba >= RISK_THRESHOLD else "LOW_RISK"

    return {
        "facility_id": facility_id,
        "facility_name": facility_info["name"],
        "facility_type": facility_info["type"],
        "medicine_id": medicine_id,
        "medicine_name": medicine_info["name"],
        "as_of_date": as_of_date,
        "stockout_probability": round(stockout_proba, 4),
        "risk": risk,
        "days_of_stock_remaining": round(float(latest_row["days_of_stock_remaining"]), 2),
        "closing_stock": int(latest_row["closing_stock"]),
    }
