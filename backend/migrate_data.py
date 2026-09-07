import os
import sys

# Ensure project root is in sys.path for backend imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import get_supabase_client
from backend.importer import import_inventory_csv

CSV_PATH = os.path.join(PROJECT_ROOT, "ml", "data", "inventory_history.csv")


def run_migration():
    """
    Executes the initial historical dataset migration using backend/importer.py.
    """
    print(f"Starting migration from CSV: {CSV_PATH}")
    result = import_inventory_csv(CSV_PATH, batch_size=1000)

    print("\n--- Migration Execution Results ---")
    print(f"Status                      : {result['status']}")
    print(f"Facilities Upserted         : {result['facilities_upserted']}")
    print(f"Medicines Upserted          : {result['medicines_upserted']}")
    print(f"Inventory Records Upserted  : {result['inventory_records_upserted']}")
    print(f"Validation Errors Count    : {result['validation_errors_count']}")

    if result["validation_errors"]:
        print("\nSample Validation Errors:")
        for err in result["validation_errors"][:5]:
            print(f"  - {err}")

    # Post-Migration Table Verification
    print("\n" + "=" * 60)
    print("                 POST-MIGRATION TABLE COUNTS                 ")
    print("=" * 60)
    supabase = get_supabase_client()
    count_fac = supabase.table("facilities").select("id", count="exact").execute().count
    count_med = supabase.table("medicines").select("id", count="exact").execute().count
    count_inv = supabase.table("inventory").select("id", count="exact").execute().count

    print(f"  Facilities Table Row Count : {count_fac} (Expected: 20)")
    print(f"  Medicines Table Row Count  : {count_med} (Expected: 10)")
    print(f"  Inventory Table Row Count  : {count_inv} (Expected: 36000)")
    print("=" * 60)


if __name__ == "__main__":
    run_migration()
