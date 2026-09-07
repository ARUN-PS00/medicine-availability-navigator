from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

import backend.main as main_module
from backend.main import app

client = TestClient(app)


class MockModelPipeline:
    def __init__(self, probability: float = 0.85):
        self.proba = probability

    def predict_proba(self, X):
        import numpy as np
        # Return probability array matching length of X
        n = len(X)
        return np.array([[1.0 - self.proba, self.proba] for _ in range(n)])


def test_get_facilities_success():
    mock_fac = MagicMock()
    mock_fac.data = [
        {"id": "F001", "name": "Synthetic District Hospital F001", "type": "District Hospital", "latitude": 12.9716, "longitude": 77.5946},
        {"id": "F002", "name": "Synthetic District Hospital F002", "type": "District Hospital", "latitude": 12.9250, "longitude": 77.5897},
    ]

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = mock_fac

        response = client.get("/facilities")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == "F001"
        assert data[1]["id"] == "F002"


def test_get_facilities_filter_by_type():
    mock_fac = MagicMock()
    mock_fac.data = [
        {"id": "F001", "name": "Synthetic District Hospital F001", "type": "District Hospital", "latitude": 12.9716, "longitude": 77.5946},
    ]

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_supabase.table.return_value.select.return_value.order.return_value.eq.return_value.execute.return_value = mock_fac

        response = client.get("/facilities?type=District%20Hospital")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "District Hospital"


def test_get_medicines_success():
    mock_med = MagicMock()
    mock_med.data = [
        {"id": "M001", "name": "Paracetamol 500mg"},
        {"id": "M002", "name": "Amoxicillin 500mg"},
    ]

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = mock_med

        response = client.get("/medicines")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == "M001"
        assert data[1]["id"] == "M002"


def test_get_inventory_success():
    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Synthetic District Hospital F001"}]

    mock_med = MagicMock()
    mock_med.data = [{"id": "M001", "name": "Paracetamol 500mg"}]

    # Return items in descending order as DB query outputs
    mock_inv = MagicMock()
    mock_inv.data = [
        {"date": "2024-01-02", "opening_stock": 90, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 80, "days_since_restock": 2},
        {"date": "2024-01-01", "opening_stock": 100, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 90, "days_since_restock": 1},
    ]

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                mock_table.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        response = client.get("/inventory/F001/M001?days=30")
        assert response.status_code == 200
        data = response.json()
        assert data["facility_id"] == "F001"
        assert data["facility_name"] == "Synthetic District Hospital F001"
        assert data["medicine_id"] == "M001"
        assert data["medicine_name"] == "Paracetamol 500mg"
        assert data["record_count"] == 2
        # Verify chronological order (date ASC)
        assert data["history"][0]["date"] == "2024-01-01"
        assert data["history"][1]["date"] == "2024-01-02"


def test_get_inventory_invalid_days():
    response = client.get("/inventory/F001/M001?days=0")
    assert response.status_code == 400
    assert "days" in response.json()["detail"]

    response_large = client.get("/inventory/F001/M001?days=500")
    assert response_large.status_code == 400


def test_get_inventory_missing_facility_404():
    mock_fac = MagicMock()
    mock_fac.data = []

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_fac

        response = client.get("/inventory/NONEXISTENT/M001")
        assert response.status_code == 404
        assert "Facility 'NONEXISTENT' not found" in response.json()["detail"]


def test_get_inventory_missing_medicine_404():
    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001"}]
    mock_med = MagicMock()
    mock_med.data = []

    with patch("backend.main.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        response = client.get("/inventory/F001/NONEXISTENT")
        assert response.status_code == 404
        assert "Medicine 'NONEXISTENT' not found" in response.json()["detail"]


def test_dashboard_summary_success():
    main_module.model_loaded = True
    main_module.model = MockModelPipeline(0.85)

    mock_fac = MagicMock()
    mock_fac.data = [
        {"id": "F001", "name": "Hospital F001", "type": "PHC"},
        {"id": "F002", "name": "Hospital F002", "type": "District Hospital"},
    ]

    mock_med = MagicMock()
    mock_med.data = [
        {"id": "M001", "name": "Paracetamol"},
    ]

    mock_date = MagicMock()
    mock_date.data = [{"date": "2024-01-02"}]

    mock_inv = MagicMock()
    mock_inv.data = [
        {"facility_id": "F001", "medicine_id": "M001", "date": "2024-01-01", "opening_stock": 100, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 90, "days_since_restock": 1},
        {"facility_id": "F001", "medicine_id": "M001", "date": "2024-01-02", "opening_stock": 90, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 80, "days_since_restock": 2},
        {"facility_id": "F002", "medicine_id": "M001", "date": "2024-01-01", "opening_stock": 50, "received_quantity": 0, "dispensed_quantity": 50, "closing_stock": 0, "days_since_restock": 5},
        {"facility_id": "F002", "medicine_id": "M001", "date": "2024-01-02", "opening_stock": 0, "received_quantity": 0, "dispensed_quantity": 0, "closing_stock": 0, "days_since_restock": 6},
    ]

    with patch("backend.summary.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                # Handle chain for latest date or history
                mock_table.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_date
                mock_table.select.return_value.order.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        response = client.get("/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_facilities"] == 2
        assert data["total_medicines"] == 1
        assert data["as_of_date"] == "2024-01-02"
        assert data["stockout_count"] == 1
        assert data["high_risk_count"] == 2
        assert len(data["critical_alerts"]) > 0
        alert_item = data["critical_alerts"][0]
        assert "facility_id" in alert_item
        assert "facility_name" in alert_item
        assert "medicine_id" in alert_item
        assert "medicine_name" in alert_item
        assert "closing_stock" in alert_item
        assert "stockout_probability" in alert_item
        assert "risk" in alert_item
