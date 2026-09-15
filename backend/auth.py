from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_supabase_client, get_supabase_service_client

security_scheme = HTTPBearer(auto_error=False)


class PharmacyUser(BaseModel):
    user_id: str
    email: str
    facility_id: str
    facility_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    facility_id: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class AuthResponse(BaseModel):
    status: str
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[PharmacyUser] = None


def get_current_pharmacy_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> PharmacyUser:
    """
    FastAPI dependency that extracts and validates the Supabase JWT Bearer token,
    verifies session validity, and resolves the user's authorized facility_id.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication session: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_response or not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(user_response.user.id)
    email = user_response.user.email or ""

    # Retrieve associated pharmacy profile
    try:
        # Use service client or main client to fetch profile mapping
        service_client = get_supabase_service_client()
        profile_res = (
            service_client.table("pharmacy_profiles")
            .select("facility_id, facilities(name)")
            .eq("id", user_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error querying pharmacy authorization profile: {str(e)}"
        )

    if not profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not associated with an authorized pharmacy facility."
        )

    profile_data = profile_res.data[0]
    facility_id = profile_data.get("facility_id")
    facility_info = profile_data.get("facilities")
    facility_name = facility_info.get("name") if isinstance(facility_info, dict) else None

    return PharmacyUser(
        user_id=user_id,
        email=email,
        facility_id=facility_id,
        facility_name=facility_name,
    )
