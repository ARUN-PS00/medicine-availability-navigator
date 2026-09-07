import csv
import io
import os
import sys
from typing import List, Dict, Any, Union

# Ensure project root is in sys.path for backend imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import get_supabase_client

REQUIRED_COLUMNS = {
    "date",
    "facility_id",
    "facility_name",
    "facility_type",
    "latitude",
    "longitude",
    "medicine_id",
    "medicine_name",
    "opening_stock",
    "received_quantity",
    "dispensed_quantity",
    "closing_stock",
    "days_since_restock",
}

DEFAULT_BATCH_SIZE = 1000


class CSVImportError(Exception):
    """Custom exception raised when CSV validation or import fails."""
    pass


def validate_and_parse_csv_content(csv_content: Union[str, io.StringIO], batch_name: str = "CSV"):
    """
    Validates CSV header structure, row data types, negative quantities,
    inventory accounting equation integrity, and duplicate detection.

    Returns:
        tuple: (facilities_list, medicines_list, inventory_records, validation_errors)
    """
    if isinstance(csv_content, str):
        reader = csv.DictReader(io.StringIO(csv_content))
    else:
        reader = csv.DictReader(csv_content)

    if not reader.fieldnames:
        raise CSVImportError(f"{batch_name} is empty or unreadable.")

    missing_cols = REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing_cols:
        raise CSVImportError(f"Missing required CSV columns: {sorted(list(missing_cols))}")

    facilities_map: Dict[str, Dict[str, Any]] = {}
    medicines_map: Dict[str, Dict[str, Any]] = {}
    inventory_records: List[Dict[str, Any]] = []
    seen_inventory_keys = set()
    validation_errors: List[str] = []

    for row_idx, row in enumerate(reader, start=2):  # Line 1 is header
        fac_id = row.get("facility_id", "").strip()
        med_id = row.get("medicine_id", "").strip()
        date_str = row.get("date", "").strip()

        if not fac_id or not med_id or not date_str:
            validation_errors.append(f"Row {row_idx}: Missing required identifier (facility_id, medicine_id, or date).")
            continue

        # Rule 1: Detect and report duplicate (facility_id, medicine_id, date) within the CSV
        record_key = (fac_id, med_id, date_str)
        if record_key in seen_inventory_keys:
            validation_errors.append(
                f"Row {row_idx}: Duplicate record detected in CSV for facility '{fac_id}', medicine '{med_id}', date '{date_str}'."
            )
            continue
        seen_inventory_keys.add(record_key)

        # Extract Facility Metadata
        if fac_id not in facilities_map:
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                facilities_map[fac_id] = {
                    "id": fac_id,
                    "name": row["facility_name"].strip(),
                    "type": row["facility_type"].strip(),
                    "latitude": lat,
                    "longitude": lon,
                }
            except ValueError:
                validation_errors.append(f"Row {row_idx}: Invalid latitude/longitude format for facility {fac_id}.")

        # Extract Medicine Metadata
        if med_id not in medicines_map:
            medicines_map[med_id] = {
                "id": med_id,
                "name": row["medicine_name"].strip(),
            }

        # Parse numeric quantities
        try:
            opening = int(row["opening_stock"])
            received = int(row["received_quantity"])
            dispensed = int(row["dispensed_quantity"])
            closing = int(row["closing_stock"])
            days_since = int(row["days_since_restock"])
        except ValueError:
            validation_errors.append(f"Row {row_idx}: Non-integer quantity detected for {fac_id}/{med_id} on {date_str}.")
            continue

        # Rule 2: Reject negative quantities
        if opening < 0 or received < 0 or dispensed < 0 or closing < 0 or days_since < 0:
            validation_errors.append(
                f"Row {row_idx}: Negative inventory quantity rejected for {fac_id}/{med_id} on {date_str} "
                f"(opening={opening}, received={received}, dispensed={dispensed}, closing={closing}, days_since_restock={days_since})."
            )
            continue

        # Rule 3: Validate inventory accounting equation (opening + received - dispensed == closing)
        expected_closing = opening + received - dispensed
        if expected_closing != closing:
            validation_errors.append(
                f"Row {row_idx}: Accounting equation violation for {fac_id}/{med_id} on {date_str}. "
                f"opening ({opening}) + received ({received}) - dispensed ({dispensed}) = {expected_closing}, but closing = {closing}."
            )
            continue

        # Rule 4: Construct payload (explicitly excluding stockout_next_3_days)
        inventory_records.append({
            "facility_id": fac_id,
            "medicine_id": med_id,
            "date": date_str,
            "opening_stock": opening,
            "received_quantity": received,
            "dispensed_quantity": dispensed,
            "closing_stock": closing,
            "days_since_restock": days_since,
        })

    return (
        list(facilities_map.values()),
        list(medicines_map.values()),
        inventory_records,
        validation_errors,
    )


def import_inventory_csv(
    csv_file_or_path: Union[str, io.StringIO],
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> Dict[str, Any]:
    """
    Reusable import function that processes inventory CSV data.
    Enforces STRICT validation: if ANY validation error occurs during CSV parsing,
    database mutation is completely aborted (ZERO DB writes).
    """
    if isinstance(csv_file_or_path, str) and os.path.isfile(csv_file_or_path):
        with open(csv_file_or_path, mode="r", encoding="utf-8") as f:
            csv_str = f.read()
        batch_name = os.path.basename(csv_file_or_path)
    elif isinstance(csv_file_or_path, str):
        csv_str = csv_file_or_path
        batch_name = "Uploaded CSV Content"
    else:
        csv_str = csv_file_or_path.read()
        batch_name = "Uploaded CSV Stream"

    facilities, medicines, inventory_records, validation_errors = validate_and_parse_csv_content(
        csv_str, batch_name=batch_name
    )

    # STRICT GUARANTEE: If any validation errors exist, abort immediately with ZERO database mutations.
    if validation_errors:
        return {
            "status": "failed",
            "facilities_upserted": 0,
            "medicines_upserted": 0,
            "inventory_records_upserted": 0,
            "validation_errors": validation_errors,
            "validation_errors_count": len(validation_errors),
        }

    supabase = get_supabase_client()

    # 1. Upsert Facilities
    if facilities:
        supabase.table("facilities").upsert(facilities, on_conflict="id").execute()

    # 2. Upsert Medicines
    if medicines:
        supabase.table("medicines").upsert(medicines, on_conflict="id").execute()

    # 3. Batch Upsert Inventory Records
    total_inventory_inserted = 0
    if inventory_records:
        total = len(inventory_records)
        for i in range(0, total, batch_size):
            batch = inventory_records[i : i + batch_size]
            supabase.table("inventory").upsert(batch, on_conflict="facility_id,medicine_id,date").execute()
            total_inventory_inserted += len(batch)

    return {
        "status": "success",
        "facilities_upserted": len(facilities),
        "medicines_upserted": len(medicines),
        "inventory_records_upserted": total_inventory_inserted,
        "validation_errors": [],
        "validation_errors_count": 0,
    }
