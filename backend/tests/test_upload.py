import io
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

VALID_CSV_HEADER = "date,facility_id,facility_name,facility_type,latitude,longitude,medicine_id,medicine_name,opening_stock,received_quantity,dispensed_quantity,closing_stock,days_since_restock"

VALID_ROW_1 = "2024-07-01,F001,Hospital F001,PHC,12.9716,77.5946,M001,Paracetamol,100,0,10,90,1"
VALID_ROW_2 = "2024-07-02,F001,Hospital F001,PHC,12.9716,77.5946,M001,Paracetamol,90,0,10,80,2"

VALID_CSV_WITH_TARGET = VALID_CSV_HEADER + ",stockout_next_1_day\n" + VALID_ROW_1 + ",1\n"


def test_upload_valid_csv_success():
    csv_content = f"{VALID_CSV_HEADER}\n{VALID_ROW_1}\n{VALID_ROW_2}\n"
    file_bytes = csv_content.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["facilities_processed"] == 1
        assert data["medicines_processed"] == 1
        assert data["inventory_rows_processed"] == 2
        assert mock_supabase.table.call_count >= 3


def test_upload_invalid_accounting_equation():
    # opening (100) + received (0) - dispensed (10) = 90, but closing = 999
    invalid_row = "2024-07-01,F001,Hospital F001,PHC,12.9716,77.5946,M001,Paracetamol,100,0,10,999,1"
    csv_content = f"{VALID_CSV_HEADER}\n{invalid_row}\n"
    file_bytes = csv_content.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 422
        data = response.json()
        assert data["status"] == "error"
        assert "Accounting equation violation" in data["errors"][0]
        # ZERO database writes
        mock_supabase.table.assert_not_called()


def test_upload_negative_quantity():
    # opening (-50) < 0
    negative_row = "2024-07-01,F001,Hospital F001,PHC,12.9716,77.5946,M001,Paracetamol,-50,0,10,90,1"
    csv_content = f"{VALID_CSV_HEADER}\n{negative_row}\n"
    file_bytes = csv_content.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 422
        data = response.json()
        assert data["status"] == "error"
        assert "Negative inventory quantity" in data["errors"][0]
        # ZERO database writes
        mock_supabase.table.assert_not_called()


def test_upload_duplicate_inventory_key():
    # Duplicate (F001, M001, 2024-07-01) within same CSV
    csv_content = f"{VALID_CSV_HEADER}\n{VALID_ROW_1}\n{VALID_ROW_1}\n"
    file_bytes = csv_content.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 422
        data = response.json()
        assert data["status"] == "error"
        assert "Duplicate record detected in CSV" in data["errors"][0]
        # ZERO database writes
        mock_supabase.table.assert_not_called()


def test_upload_malformed_missing_columns():
    bad_header = "date,facility_id,opening_stock"
    csv_content = f"{bad_header}\n2024-07-01,F001,100\n"
    file_bytes = csv_content.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 400
        data = response.json()
        assert data["status"] == "error"
        assert "Missing required CSV columns" in data["errors"][0]
        # ZERO database writes
        mock_supabase.table.assert_not_called()


def test_upload_target_exclusion():
    file_bytes = VALID_CSV_WITH_TARGET.encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 200
        # Find inventory upsert payload
        inv_upsert_args = mock_supabase.table.return_value.upsert.call_args_list
        inserted_payloads = []
        for call_item in inv_upsert_args:
            args, kwargs = call_item
            if isinstance(args[0], list) and len(args[0]) > 0 and "facility_id" in args[0][0]:
                inserted_payloads = args[0]
                break

        assert len(inserted_payloads) == 1
        assert "stockout_next_1_day" not in inserted_payloads[0]


def test_upload_idempotency_upsert():
    file_bytes = f"{VALID_CSV_HEADER}\n{VALID_ROW_1}\n".encode("utf-8")

    with patch("backend.importer.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        response = client.post(
            "/admin/inventory/upload",
            files={"file": ("test_inventory.csv", io.BytesIO(file_bytes), "text/csv")},
        )

        assert response.status_code == 200
        assert mock_supabase.table.return_value.upsert.call_count >= 3
