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
from backend.prediction import RISK_THRESHOLD


def get_dashboard_summary(model_pipeline: Any) -> Dict[str, Any]:
    """
    Computes high-level dashboard metrics dynamically from Supabase inventory history
    and batch ML inference without N+1 HTTP calls.
    """
    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML prediction model is not loaded."
        )

    supabase = get_supabase_client()

    # 1. Total Facilities count & metadata map
    fac_res = supabase.table("facilities").select("id, name, type").execute()
    facilities_data = fac_res.data if fac_res.data else []
    total_facilities = len(facilities_data)
    facility_meta = {f["id"]: f for f in facilities_data}

    # 2. Total Medicines count & metadata map
    med_res = supabase.table("medicines").select("id, name").execute()
    medicines_data = med_res.data if med_res.data else []
    total_medicines = len(medicines_data)
    medicine_meta = {m["id"]: m for m in medicines_data}

    if total_facilities == 0 or total_medicines == 0:
        return {
            "total_facilities": total_facilities,
            "total_medicines": total_medicines,
            "as_of_date": "",
            "high_risk_count": 0,
            "stockout_count": 0,
            "critical_alerts": []
        }

    # 3. Determine latest available date dynamically
    date_res = supabase.table("inventory").select("date").order("date", desc=True).limit(1).execute()
    if not date_res.data:
        return {
            "total_facilities": total_facilities,
            "total_medicines": total_medicines,
            "as_of_date": "",
            "high_risk_count": 0,
            "stockout_count": 0,
            "critical_alerts": []
        }
    latest_date_str = str(date_res.data[0]["date"])[:10]

    # 4. Query inventory history to build exact features across all facility-medicine pairs
    inv_res = (
        supabase.table("inventory")
        .select("facility_id, medicine_id, date, opening_stock, received_quantity, dispensed_quantity, closing_stock, days_since_restock")
        .order("date", desc=False)
        .execute()
    )

    if not inv_res.data:
        return {
            "total_facilities": total_facilities,
            "total_medicines": total_medicines,
            "as_of_date": latest_date_str,
            "high_risk_count": 0,
            "stockout_count": 0,
            "critical_alerts": []
        }

    df = pd.DataFrame(inv_res.data)
    df["facility_type"] = df["facility_id"].map(lambda fid: facility_meta.get(fid, {}).get("type", "Unknown"))
    df["stockout_next_1_day"] = np.nan

    # 5. Vectorized feature creation using exact ml/src/features.py pipeline
    featured_df = create_features(df)

    # 6. Extract records corresponding to the latest date state
    featured_df["date_str"] = pd.to_datetime(featured_df["date"]).dt.strftime("%Y-%m-%d")
    latest_df = featured_df[featured_df["date_str"] == latest_date_str].copy()

    if latest_df.empty:
        latest_df = featured_df.groupby(["facility_id", "medicine_id"]).last().reset_index()

    feature_cols = get_feature_columns()
    X = latest_df[feature_cols]

    # 7. Batch Model Inference
    try:
        raw_probas = model_pipeline.predict_proba(X)
        stockout_probas = np.asarray(raw_probas)[:, 1]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing batch prediction inference: {str(e)}"
        )

    latest_df["stockout_probability"] = np.round(stockout_probas, 4)
    latest_df["risk"] = np.where(latest_df["stockout_probability"] >= RISK_THRESHOLD, "HIGH_RISK", "LOW_RISK")

    # 8. Compute Summary Metrics & Critical Alerts
    stockout_count = int((latest_df["closing_stock"] == 0).sum())
    high_risk_count = int((latest_df["risk"] == "HIGH_RISK").sum())

    # Critical Alerts: items on latest date that are HIGH_RISK OR have closing_stock == 0
    alert_mask = (latest_df["risk"] == "HIGH_RISK") | (latest_df["closing_stock"] == 0)
    alerts_df = latest_df[alert_mask].sort_values(by=["stockout_probability", "closing_stock"], ascending=[False, True])

    critical_alerts = []
    for _, row in alerts_df.iterrows():
        fac_id = row["facility_id"]
        med_id = row["medicine_id"]
        critical_alerts.append({
            "facility_id": fac_id,
            "facility_name": facility_meta.get(fac_id, {}).get("name", fac_id),
            "medicine_id": med_id,
            "medicine_name": medicine_meta.get(med_id, {}).get("name", med_id),
            "closing_stock": int(row["closing_stock"]),
            "stockout_probability": float(row["stockout_probability"]),
            "risk": row["risk"],
        })

    return {
        "total_facilities": total_facilities,
        "total_medicines": total_medicines,
        "as_of_date": latest_date_str,
        "high_risk_count": high_risk_count,
        "stockout_count": stockout_count,
        "critical_alerts": critical_alerts,
    }
