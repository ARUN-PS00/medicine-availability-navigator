import io
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.auth import get_current_pharmacy_user, PharmacyUser

client = TestClient(app)

VALID_CSV_HEADER = "date,facility_id,facility_name,facility_type,latitude,longitude,medicine_id,medicine_name,opening_stock,received_quantity,dispensed_quantity,closing_stock,days_since_restock"
F001_ROW = "2024-07-01,F001,Hospital F001,PHC,12.9716,77.5946,M001,Paracetamol,100,0,10,90,1"
F002_ROW = "2024-07-01,F002,Hospital F002,CHC,12.9716,77.5946,M001,Paracetamol,100,0,10,90,1"


# 1. Test Valid Pharmacy Login
def test_login_success():
    mock_session = MagicMock()
    mock_session.access_token = "mock-jwt-token"
    mock_session.refresh_token = "mock-refresh-token"
    
    mock_user = MagicMock()
    mock_user.id = "user-uuid-123"
    mock_user.email = "pharmacy@example.com"

    mock_auth_res = MagicMock()
    mock_auth_res.session = mock_session
    mock_auth_res.user = mock_user

    mock_profile_data = [{"facility_id": "F001", "facilities": {"name": "District Hospital F001"}}]

    with patch("backend.main.get_supabase_client") as mock_supabase, \
         patch("backend.main.get_supabase_service_client") as mock_service:
        
        mock_client = MagicMock()
        mock_client.auth.sign_in_with_password.return_value = mock_auth_res
        mock_supabase.return_value = mock_client

        mock_svc_client = MagicMock()
        mock_svc_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_profile_data
        mock_service.return_value = mock_svc_client

        response = client.post(
            "/auth/login",
            json={"email": "pharmacy@example.com", "password": "securepassword123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "mock-jwt-token"
        assert data["token_type"] == "bearer"
        assert data["user"]["id"] == "user-uuid-123"
        assert data["user"]["facility_id"] == "F001"
        assert data["user"]["email"] == "pharmacy@example.com"


# 2. Test Login for User Without Pharmacy Profile (403 Forbidden)
def test_login_user_without_pharmacy_profile_rejected():
    mock_session = MagicMock()
    mock_session.access_token = "mock-jwt-token"

    mock_user = MagicMock()
    mock_user.id = "user-no-profile-uuid"
    mock_user.email = "noprofile@example.com"

    mock_auth_res = MagicMock()
    mock_auth_res.session = mock_session
    mock_auth_res.user = mock_user

    with patch("backend.main.get_supabase_client") as mock_supabase, \
         patch("backend.main.get_supabase_service_client") as mock_service:

        mock_client = MagicMock()
        mock_client.auth.sign_in_with_password.return_value = mock_auth_res
        mock_supabase.return_value = mock_client

        mock_svc_client = MagicMock()
        # Profile query returns empty list
        mock_svc_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_service.return_value = mock_svc_client

        response = client.post(
            "/auth/login",
            json={"email": "noprofile@example.com", "password": "password123"}
        )

        assert response.status_code == 403
        assert "not associated with an authorized pharmacy" in response.json()["detail"]


# 3. Test Invalid Credentials
def test_login_invalid_credentials():
    with patch("backend.main.get_supabase_client") as mock_supabase:
        mock_client = MagicMock()
        mock_client.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_supabase.return_value = mock_client

        response = client.post(
            "/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "Invalid email or password" in data["detail"]


# 4. Test Unauthenticated Request to Protected Route
def test_unauthenticated_protected_request():
    app.dependency_overrides.clear()
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert "Authentication token required" in response.json()["detail"]

    csv_content = f"{VALID_CSV_HEADER}\n{F001_ROW}\n"
    response_upload = client.post(
        "/admin/inventory/upload",
        files={"file": ("inventory.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    )
    assert response_upload.status_code == 401


# 5. Test Valid Token with No Pharmacy Profile
def test_valid_token_no_pharmacy_profile_rejected():
    app.dependency_overrides.clear()

    mock_user = MagicMock()
    mock_user.id = "user-without-profile"
    mock_user.email = "unlinked@example.com"

    mock_user_res = MagicMock()
    mock_user_res.user = mock_user

    with patch("backend.auth.get_supabase_client") as mock_supabase, \
         patch("backend.auth.get_supabase_service_client") as mock_service:

        mock_client = MagicMock()
        mock_client.auth.get_user.return_value = mock_user_res
        mock_supabase.return_value = mock_client

        mock_svc_client = MagicMock()
        mock_svc_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_service.return_value = mock_svc_client

        response = client.get("/auth/me", headers={"Authorization": "Bearer fake-token-unlinked"})
        assert response.status_code == 403
        assert "not associated with an authorized pharmacy" in response.json()["detail"]


# 6. Test Authenticated Pharmacy Accessing Its Own Inventory
def test_pharmacy_access_own_inventory():
    mock_user = PharmacyUser(
        user_id="uuid-pharmacy-1",
        email="pharmacy1@example.com",
        facility_id="F001",
        facility_name="Pharmacy F001"
    )
    app.dependency_overrides[get_current_pharmacy_user] = lambda: mock_user

    mock_inventory = [
        {
            "date": "2024-07-01",
            "medicine_id": "M001",
            "opening_stock": 100,
            "received_quantity": 0,
            "dispensed_quantity": 10,
            "closing_stock": 90,
            "days_since_restock": 1
        }
    ]

    with patch("backend.main.get_supabase_client") as mock_supabase:
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = mock_inventory
        mock_supabase.return_value = mock_client

        response = client.get("/pharmacy/inventory/F001")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["facility_id"] == "F001"
        assert len(data["inventory"]) == 1

    app.dependency_overrides.clear()


# 7. Test Pharmacy Attempting to Access Another Pharmacy's Inventory (Forbidden)
def test_pharmacy_access_other_pharmacy_inventory_forbidden():
    mock_user = PharmacyUser(
        user_id="uuid-pharmacy-1",
        email="pharmacy1@example.com",
        facility_id="F001",
        facility_name="Pharmacy F001"
    )
    app.dependency_overrides[get_current_pharmacy_user] = lambda: mock_user

    # F001 user attempting to access F002 inventory
    response = client.get("/pharmacy/inventory/F002")
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]
    assert "F001" in response.json()["detail"]

    app.dependency_overrides.clear()


# 8. Test Pharmacy Attempting to Upload Another Facility's Inventory (Validation Error)
def test_pharmacy_upload_other_facility_inventory_rejected():
    mock_user = PharmacyUser(
        user_id="uuid-pharmacy-1",
        email="pharmacy1@example.com",
        facility_id="F001",
        facility_name="Pharmacy F001"
    )
    app.dependency_overrides[get_current_pharmacy_user] = lambda: mock_user

    # CSV contains data for F002, but user is authorized for F001 only
    csv_content = f"{VALID_CSV_HEADER}\n{F002_ROW}\n"
    file_bytes = csv_content.encode("utf-8")

    response = client.post(
        "/pharmacy/inventory/upload",
        files={"file": ("inventory_f002.csv", io.BytesIO(file_bytes), "text/csv")}
    )

    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert "Unauthorized facility 'F002'" in data["errors"][0]

    app.dependency_overrides.clear()


# 9. Test Logout / Session Behavior
def test_logout_behavior():
    mock_user = PharmacyUser(
        user_id="uuid-pharmacy-1",
        email="pharmacy1@example.com",
        facility_id="F001",
        facility_name="Pharmacy F001"
    )
    app.dependency_overrides[get_current_pharmacy_user] = lambda: mock_user

    with patch("backend.main.get_supabase_client") as mock_supabase:
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response = client.post("/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "logged out" in data["message"].lower()

    app.dependency_overrides.clear()


# 10. Test Forgot Password Flow
def test_forgot_password_flow():
    with patch("backend.main.get_supabase_client") as mock_supabase:
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        response = client.post(
            "/auth/forgot-password",
            json={"email": "user@example.com"}
        )
        assert response.status_code == 200
        assert "password reset email has been sent" in response.json()["message"]


# 11. Test Registration / Facility Mapping Success
def test_register_pharmacy_success():
    mock_auth_res = MagicMock()
    mock_auth_res.user = MagicMock(id="new-user-uuid-999")

    with patch("backend.main.get_supabase_client") as mock_supabase, \
         patch("backend.main.get_supabase_service_client") as mock_service:
        
        mock_client = MagicMock()
        # Facility F003 exists in facilities table
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "F003", "name": "Facility F003"}]
        mock_client.auth.sign_up.return_value = mock_auth_res
        mock_supabase.return_value = mock_client

        mock_svc_client = MagicMock()
        # Not already registered
        mock_svc_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_service.return_value = mock_svc_client

        response = client.post(
            "/auth/register",
            json={"email": "newpharmacy@example.com", "password": "Password123!", "facility_id": "F003"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert data["user"]["facility_id"] == "F003"
        assert data["user"]["email"] == "newpharmacy@example.com"


# 12. Test Registration with Nonexistent Facility (404)
def test_register_nonexistent_facility_rejected():
    with patch("backend.main.get_supabase_client") as mock_supabase:
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.return_value = mock_client

        response = client.post(
            "/auth/register",
            json={"email": "test@example.com", "password": "Password123!", "facility_id": "NONEXISTENT"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


# 13. Test Registration with Already Claimed Facility (400)
def test_register_already_claimed_facility_rejected():
    with patch("backend.main.get_supabase_client") as mock_supabase, \
         patch("backend.main.get_supabase_service_client") as mock_service:

        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "F001", "name": "Facility F001"}]
        mock_supabase.return_value = mock_client

        mock_svc_client = MagicMock()
        # Already claimed
        mock_svc_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "existing-uuid"}]
        mock_service.return_value = mock_svc_client

        response = client.post(
            "/auth/register",
            json={"email": "duplicate@example.com", "password": "Password123!", "facility_id": "F001"}
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
