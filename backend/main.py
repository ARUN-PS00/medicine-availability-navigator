import os
import joblib
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse

from backend.database import get_supabase_client
from backend.prediction import predict_stockout
from backend.summary import get_dashboard_summary
from backend.importer import import_inventory_csv, CSVImportError

# Determine paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
MODEL_PATH = os.path.join(PROJECT_ROOT, "ml", "models", "stockout_model.pkl")

model = None
model_loaded = False


def load_model():
    global model, model_loaded
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            model_loaded = True
            print(f"Successfully loaded stockout model from: {MODEL_PATH}")
        except Exception as e:
            model_loaded = False
            print(f"Failed to load stockout model from {MODEL_PATH}: {e}")
    else:
        model_loaded = False
        print(f"Model file not found at: {MODEL_PATH}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    load_model()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Medicine Availability Navigator API",
    description="FastAPI backend for predicting medicine stockouts and navigating supply availability.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
    }


@app.get("/facilities")
def get_facilities(type: str | None = Query(None, description="Optional facility type filter")):
    """
    Returns list of facilities (id, name, type, latitude, longitude), optionally filtered by type.
    """
    try:
        supabase = get_supabase_client()
        query = supabase.table("facilities").select("id, name, type, latitude, longitude").order("id", desc=False)
        if type:
            query = query.eq("type", type)
        res = query.execute()
        return res.data if res.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error retrieving facilities: {str(e)}"
        )


@app.get("/medicines")
def get_medicines():
    """
    Returns list of medicines in essential medicine catalog (id, name).
    """
    try:
        supabase = get_supabase_client()
        res = supabase.table("medicines").select("id, name").order("id", desc=False).execute()
        return res.data if res.data else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error retrieving medicines: {str(e)}"
        )


@app.get("/inventory/{facility_id}/{medicine_id}")
def get_inventory(facility_id: str, medicine_id: str, days: int = Query(30)):
    """
    Retrieves historical inventory records for a given facility and medicine,
    limited to the most recent `days` (default 30, min 1, max 365), returned in chronological order.
    """
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'days' parameter must be an integer between 1 and 365."
        )

    try:
        supabase = get_supabase_client()

        # 1. Validate facility existence
        fac_res = supabase.table("facilities").select("id, name").eq("id", facility_id).execute()
        if not fac_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Facility '{facility_id}' not found."
            )
        facility_name = fac_res.data[0]["name"]

        # 2. Validate medicine existence
        med_res = supabase.table("medicines").select("id, name").eq("id", medicine_id).execute()
        if not med_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine '{medicine_id}' not found."
            )
        medicine_name = med_res.data[0]["name"]

        # 3. Retrieve most recent `days` inventory records
        inv_res = (
            supabase.table("inventory")
            .select("date, opening_stock, received_quantity, dispensed_quantity, closing_stock, days_since_restock")
            .eq("facility_id", facility_id)
            .eq("medicine_id", medicine_id)
            .order("date", desc=True)
            .limit(days)
            .execute()
        )

        raw_history = inv_res.data if inv_res.data else []
        # Return in chronological order (date ASC)
        chronological_history = list(reversed(raw_history))

        return {
            "facility_id": facility_id,
            "facility_name": facility_name,
            "medicine_id": medicine_id,
            "medicine_name": medicine_name,
            "record_count": len(chronological_history),
            "history": chronological_history,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error retrieving inventory: {str(e)}"
        )


@app.get("/predict/{facility_id}/{medicine_id}")
def get_prediction(facility_id: str, medicine_id: str):
    """
    Exposes ML prediction for a given facility_id and medicine_id.
    """
    if not model_loaded or model is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML prediction model is not loaded."
        )
    return predict_stockout(facility_id, medicine_id, model)


@app.get("/dashboard/summary")
def get_summary():
    """
    Returns system-wide dashboard metrics and active critical shortage alerts.
    """
    if not model_loaded or model is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML prediction model is not loaded."
        )
    return get_dashboard_summary(model)


@app.post("/admin/inventory/upload")
async def upload_inventory_csv(file: UploadFile = File(...)):
    """
    Admin endpoint for uploading new or updated inventory CSV records.
    Validates CSV header structure, quantities, accounting equation balance,
    and intra-CSV duplicate keys before performing any database writes.
    """
    if not file.filename.endswith(".csv"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "error",
                "message": "Inventory upload failed validation.",
                "errors": ["Only CSV files (.csv) are accepted."]
            }
        )

    try:
        content_bytes = await file.read()
        csv_str = content_bytes.decode("utf-8")
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "error",
                "message": "Inventory upload failed validation.",
                "errors": [f"Failed to read or decode CSV file: {str(e)}"]
            }
        )

    try:
        result = import_inventory_csv(csv_str)
    except CSVImportError as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "error",
                "message": "Inventory upload failed validation.",
                "errors": [str(e)]
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error during import: {str(e)}"
        )

    if result["status"] == "failed" or result["validation_errors"]:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "message": "Inventory upload failed validation.",
                "errors": result["validation_errors"]
            }
        )

    return {
        "status": "success",
        "message": "Inventory upload completed successfully.",
        "facilities_processed": result["facilities_upserted"],
        "medicines_processed": result["medicines_upserted"],
        "inventory_rows_processed": result["inventory_records_upserted"]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
