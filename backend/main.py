import os
import joblib
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, status, Query, UploadFile, File, Depends
from fastapi.responses import JSONResponse

from backend.database import get_supabase_client, get_supabase_service_client
from backend.prediction import predict_stockout
from backend.summary import get_dashboard_summary
from backend.importer import import_inventory_csv, CSVImportError
from backend.auth import (
    PharmacyUser,
    get_current_pharmacy_user,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)

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
    description="FastAPI backend for predicting medicine stockouts and navigating supply availability with Pharmacy Supabase Auth.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
    }


# ------------------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS (Supabase Auth)
# ------------------------------------------------------------------------------

@app.post("/auth/login")
def login(request: LoginRequest):
    """
    Pharmacy Login endpoint using Supabase Auth.
    Authenticates user with email and password, returning session token and authorized facility info.
    """
    try:
        supabase = get_supabase_client()
        res = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password: {str(e)}"
        )

    if not res or not res.session or not res.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id = str(res.user.id)
    access_token = res.session.access_token
    refresh_token = res.session.refresh_token

    # Resolve pharmacy profile
    service_client = get_supabase_service_client()
    profile_res = (
        service_client.table("pharmacy_profiles")
        .select("facility_id, facilities(name)")
        .eq("id", user_id)
        .execute()
    )

    if not profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not associated with an authorized pharmacy profile."
        )

    facility_id = profile_res.data[0].get("facility_id")
    facility_info = profile_res.data[0].get("facilities")
    facility_name = facility_info.get("name") if isinstance(facility_info, dict) else None

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": res.user.email,
            "facility_id": facility_id,
            "facility_name": facility_name
        }
    }



@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_pharmacy(request: RegisterRequest):
    """
    Registers a new pharmacy user linked to an existing MAP facility.
    Maps auth.users.id -> existing MAP facilities.id.
    """
    supabase = get_supabase_client()
    service_client = get_supabase_service_client()

    # 1. Verify facility existence
    fac_res = supabase.table("facilities").select("id, name").eq("id", request.facility_id).execute()
    if not fac_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility '{request.facility_id}' not found in MAP records."
        )
    facility_name = fac_res.data[0]["name"]

    # 2. Check if facility is already linked to a user profile
    existing_prof = service_client.table("pharmacy_profiles").select("id").eq("facility_id", request.facility_id).execute()
    if existing_prof.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Facility '{request.facility_id}' is already registered to an existing account."
        )

    # 3. Create Supabase Auth user
    try:
        auth_res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Supabase Auth signup failed: {str(e)}"
        )

    if not auth_res.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create pharmacy account."
        )

    user_id = str(auth_res.user.id)

    # 4. Insert pharmacy profile mapping
    try:
        service_client.table("pharmacy_profiles").insert({
            "id": user_id,
            "facility_id": request.facility_id,
            "email": request.email
        }).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pharmacy profile mapping: {str(e)}"
        )

    return {
        "status": "success",
        "message": "Pharmacy account registered successfully.",
        "user": {
            "user_id": user_id,
            "email": request.email,
            "facility_id": request.facility_id,
            "facility_name": facility_name
        }
    }


@app.post("/auth/logout")
def logout(current_user: PharmacyUser = Depends(get_current_pharmacy_user)):
    """
    Logs out the current authenticated pharmacy session.
    """
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
    except Exception:
        pass
    return {
        "status": "success",
        "message": "Session logged out successfully."
    }


@app.post("/auth/forgot-password")
def forgot_password(request: ResetPasswordRequest):
    """
    Triggers a password reset request via Supabase Auth.
    """
    try:
        supabase = get_supabase_client()
        supabase.auth.reset_password_for_email(request.email)
    except Exception:
        pass
    return {
        "status": "success",
        "message": "If an account with this email exists, a password reset email has been sent."
    }


@app.get("/auth/me")
def get_me(current_user: PharmacyUser = Depends(get_current_pharmacy_user)):
    """
    Returns the currently authenticated pharmacy user details and authorized facility context.
    """
    return {
        "status": "success",
        "user": current_user
    }


# ------------------------------------------------------------------------------
# PUBLIC CLIENT ENDPOINTS (Preserved)
# ------------------------------------------------------------------------------

@app.get("/facilities")
def get_facilities(type: Optional[str] = Query(None, description="Optional facility type filter")):
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


# ------------------------------------------------------------------------------
# PROTECTED PHARMACY INVENTORY ENDPOINTS
# ------------------------------------------------------------------------------

@app.get("/pharmacy/inventory/{target_facility_id}")
def get_pharmacy_facility_inventory(
    target_facility_id: str,
    current_user: PharmacyUser = Depends(get_current_pharmacy_user)
):
    """
    Protected endpoint allowing an authenticated pharmacy to retrieve facility inventory.
    Strictly verifies that current_user.facility_id matches target_facility_id (Pharmacy A cannot access Pharmacy B's inventory).
    """
    if current_user.facility_id != target_facility_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your account is authorized for facility '{current_user.facility_id}', not '{target_facility_id}'."
        )

    try:
        supabase = get_supabase_client()
        inv_res = (
            supabase.table("inventory")
            .select("date, medicine_id, opening_stock, received_quantity, dispensed_quantity, closing_stock, days_since_restock")
            .eq("facility_id", target_facility_id)
            .order("date", desc=True)
            .execute()
        )
        return {
            "status": "success",
            "facility_id": current_user.facility_id,
            "facility_name": current_user.facility_name,
            "record_count": len(inv_res.data) if inv_res.data else 0,
            "inventory": inv_res.data if inv_res.data else []
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error retrieving pharmacy inventory: {str(e)}"
        )


@app.post("/admin/inventory/upload")
@app.post("/pharmacy/inventory/upload")
async def upload_inventory_csv(
    file: UploadFile = File(...),
    current_user: PharmacyUser = Depends(get_current_pharmacy_user)
):
    """
    Protected endpoint for uploading inventory CSV records.
    Validates CSV header structure, quantities, accounting balance, intra-CSV duplicates,
    AND verifies that all records belong strictly to the authenticated pharmacy's facility_id.
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
        # Enforce authorized_facility_id from authenticated user context
        result = import_inventory_csv(csv_str, authorized_facility_id=current_user.facility_id)
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
        "authorized_facility_id": current_user.facility_id,
        "facilities_processed": result["facilities_upserted"],
        "medicines_processed": result["medicines_upserted"],
        "inventory_rows_processed": result["inventory_records_upserted"]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
