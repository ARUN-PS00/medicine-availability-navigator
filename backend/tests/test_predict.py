from unittest.mock import MagicMock, patch
import pytest
import numpy as np
from fastapi.testclient import TestClient
from fastapi import HTTPException, status

import backend.main as main_module
from backend.main import app
from backend.prediction import predict_stockout, RISK_THRESHOLD

client = TestClient(app)


class MockModelPipeline:
    def __init__(self, probability: float):
        self.proba = probability

    def predict_proba(self, X):
        return np.array([[1.0 - self.proba, self.proba]])


def test_predict_success_high_risk():
    mock_model = MockModelPipeline(0.85)

    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001", "type": "PHC"}]

    mock_med = MagicMock()
    mock_med.data = [{"id": "M001", "name": "Paracetamol"}]

    mock_inv = MagicMock()
    mock_inv.data = [
        {"date": "2024-01-01", "opening_stock": 100, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 90, "days_since_restock": 1},
        {"date": "2024-01-02", "opening_stock": 90, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 80, "days_since_restock": 2},
    ]

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                mock_table.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        result = predict_stockout("F001", "M001", mock_model)

        assert result["facility_id"] == "F001"
        assert result["medicine_id"] == "M001"
        assert result["stockout_probability"] == 0.85
        assert result["risk"] == "HIGH_RISK"


def test_predict_success_low_risk():
    mock_model = MockModelPipeline(0.12)

    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001", "type": "PHC"}]

    mock_med = MagicMock()
    mock_med.data = [{"id": "M001", "name": "Paracetamol"}]

    mock_inv = MagicMock()
    mock_inv.data = [
        {"date": "2024-01-01", "opening_stock": 100, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 90, "days_since_restock": 1},
    ]

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                mock_table.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        result = predict_stockout("F001", "M001", mock_model)

        assert result["stockout_probability"] == 0.12
        assert result["risk"] == "LOW_RISK"


def test_missing_facility_404():
    mock_model = MockModelPipeline(0.50)
    mock_fac = MagicMock()
    mock_fac.data = []

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_fac

        with pytest.raises(HTTPException) as exc_info:
            predict_stockout("NONEXISTENT_FAC", "M001", mock_model)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Facility 'NONEXISTENT_FAC' not found" in exc_info.value.detail


def test_missing_medicine_404():
    mock_model = MockModelPipeline(0.50)
    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001", "type": "PHC"}]

    mock_med = MagicMock()
    mock_med.data = []

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
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

        with pytest.raises(HTTPException) as exc_info:
            predict_stockout("F001", "NONEXISTENT_MED", mock_model)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Medicine 'NONEXISTENT_MED' not found" in exc_info.value.detail


def test_insufficient_historical_data_422():
    mock_model = MockModelPipeline(0.50)
    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001", "type": "PHC"}]

    mock_med = MagicMock()
    mock_med.data = [{"id": "M001", "name": "Paracetamol"}]

    mock_inv = MagicMock()
    mock_inv.data = []

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                mock_table.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        with pytest.raises(HTTPException) as exc_info:
            predict_stockout("F001", "M001", mock_model)

        assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "Insufficient historical inventory data" in exc_info.value.detail


def test_fastapi_predict_endpoint_route():
    # Test FastAPI endpoint route handling with app.state/module model set
    main_module.model_loaded = True
    main_module.model = MockModelPipeline(0.72)

    mock_fac = MagicMock()
    mock_fac.data = [{"id": "F001", "name": "Hospital F001", "type": "PHC"}]

    mock_med = MagicMock()
    mock_med.data = [{"id": "M001", "name": "Paracetamol"}]

    mock_inv = MagicMock()
    mock_inv.data = [
        {"date": "2024-01-01", "opening_stock": 100, "received_quantity": 0, "dispensed_quantity": 10, "closing_stock": 90, "days_since_restock": 1},
    ]

    with patch("backend.prediction.get_supabase_client") as mock_get_supabase:
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "facilities":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_fac
            elif table_name == "medicines":
                mock_table.select.return_value.eq.return_value.execute.return_value = mock_med
            elif table_name == "inventory":
                mock_table.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_inv
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        response = client.get("/predict/F001/M001")
        assert response.status_code == 200
        data = response.json()
        assert data["facility_id"] == "F001"
        assert data["medicine_id"] == "M001"
        assert data["stockout_probability"] == 0.72
        assert data["risk"] == "HIGH_RISK"
