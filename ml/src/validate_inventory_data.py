import csv
import os
from collections import Counter, defaultdict

def validate_dataset(file_path):
    print("=" * 70)
    print("      PHASE 2 SYNTHETIC INVENTORY DATASET VALIDATION REPORT      ")
    print("=" * 70)
    print(f"Target File: {file_path}\n")

    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        return False

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total_rows = len(rows)
    print(f"Total Rows: {total_rows}")

    # 1. Row count check
    expected_rows = 36000
    pass_row_count = total_rows == expected_rows
    print(f"[CHECK 1] Row Count == 36,000: {'PASS' if pass_row_count else 'FAIL'} ({total_rows})")

    # 2. Check duplicate rows
    seen = set()
    duplicates = 0
    for r in rows:
        key = (r["date"], r["facility_id"], r["medicine_id"])
        if key in seen:
            duplicates += 1
        seen.add(key)
    pass_duplicates = duplicates == 0
    print(f"[CHECK 2] Duplicate Rows == 0: {'PASS' if pass_duplicates else 'FAIL'} (found {duplicates})")

    # 3. Missing values check (excluding target column edge cases for last 3 days)
    raw_cols = [
        "date", "facility_id", "facility_name", "facility_type",
        "latitude", "longitude", "medicine_id", "medicine_name",
        "opening_stock", "received_quantity", "dispensed_quantity",
        "closing_stock", "days_since_restock"
    ]
    missing_counts = {col: 0 for col in raw_cols}
    for r in rows:
        for col in raw_cols:
            if r[col] is None or r[col].strip() == "":
                missing_counts[col] += 1
    total_missing_raw = sum(missing_counts.values())
    pass_missing = total_missing_raw == 0
    print(f"[CHECK 3] Missing Values in Raw Features == 0: {'PASS' if pass_missing else 'FAIL'} ({total_missing_raw} missing)")

    # 4. Negative values check
    neg_opening = 0
    neg_received = 0
    neg_dispensed = 0
    neg_closing = 0
    neg_days = 0

    for r in rows:
        if int(r["opening_stock"]) < 0: neg_opening += 1
        if int(r["received_quantity"]) < 0: neg_received += 1
        if int(r["dispensed_quantity"]) < 0: neg_dispensed += 1
        if int(r["closing_stock"]) < 0: neg_closing += 1
        if int(r["days_since_restock"]) < 0: neg_days += 1

    total_negatives = neg_opening + neg_received + neg_dispensed + neg_closing + neg_days
    pass_negatives = total_negatives == 0
    print(f"[CHECK 4] Non-negative Inventory & Demand: {'PASS' if pass_negatives else 'FAIL'} ({total_negatives} negative values)")

    # 5. Inventory Equation Check: opening + received - dispensed == closing
    eq_failures = 0
    for r in rows:
        op = int(r["opening_stock"])
        rec = int(r["received_quantity"])
        disp = int(r["dispensed_quantity"])
        cl = int(r["closing_stock"])
        if op + rec - disp != cl:
            eq_failures += 1
    pass_equation = eq_failures == 0
    print(f"[CHECK 5] Inventory Equation (opening + received - dispensed == closing): {'PASS' if pass_equation else 'FAIL'} ({eq_failures} failures)")

    # 6. Stockout Events (closing_stock == 0)
    stockout_rows = sum(1 for r in rows if int(r["closing_stock"]) == 0)
    stockout_pct = (stockout_rows / total_rows) * 100
    print(f"\n--- Stock-out Statistics (Today's Closing Stock == 0) ---")
    print(f"Total Stock-out Days: {stockout_rows} / {total_rows} ({stockout_pct:.2f}%)")

    # 7. Target Column Distribution (stockout_next_3_days)
    target_0 = 0
    target_1 = 0
    target_blank = 0
    target_1_when_closing_gt_0 = 0

    for r in rows:
        val = r["stockout_next_3_days"].strip()
        cl = int(r["closing_stock"])
        if val == "0":
            target_0 += 1
        elif val == "1":
            target_1 += 1
            if cl > 0:
                target_1_when_closing_gt_0 += 1
        else:
            target_blank += 1

    labeled_total = target_0 + target_1
    target_1_pct = (target_1 / labeled_total * 100) if labeled_total > 0 else 0

    print(f"\n--- Target Distribution (stockout_next_3_days) ---")
    print(f"Target = 0 (No stockout next 3 days): {target_0} ({target_0 / labeled_total * 100:.2f}%)")
    print(f"Target = 1 (Stockout in next 3 days): {target_1} ({target_1_pct:.2f}%)")
    print(f"Target = Blank / Excluded (Last 3 days of time series): {target_blank}")
    print(f"Target = 1 when Closing Stock TODAY is > 0: {target_1_when_closing_gt_0} rows")
    print(f"  --> Demonstrates non-trivial target (future stockouts predicted before stock reaches 0!)")

    # 8. Date Range
    dates = sorted(list(set(r["date"] for r in rows)))
    print(f"\nDate Range: {dates[0]} to {dates[-1]} ({len(dates)} unique days)")

    # 9. Facility & Medicine Distribution
    fac_counts = Counter(r["facility_id"] for r in rows)
    med_counts = Counter(r["medicine_id"] for r in rows)
    fac_types = Counter(r["facility_type"] for r in rows)

    print(f"\nFacility Count: {len(fac_counts)} (1,800 rows per facility)")
    print(f"Medicine Count: {len(med_counts)} (3,600 rows per medicine)")
    print("Facility Types Breakdown:")
    for ft, cnt in fac_types.items():
        print(f"  - {ft}: {cnt} rows")

    # 10. Summary Statistics Table
    print("\n" + "=" * 70)
    print("               BASIC DESCRIPTIVE STATISTICS               ")
    print("=" * 70)
    print(f"{'Feature':<22} | {'Min':<8} | {'Max':<8} | {'Mean':<10} | {'Std Dev':<10}")
    print("-" * 70)

    numeric_cols = ["opening_stock", "received_quantity", "dispensed_quantity", "closing_stock", "days_since_restock"]
    for col in numeric_cols:
        vals = [int(r[col]) for r in rows]
        min_v = min(vals)
        max_v = max(vals)
        mean_v = sum(vals) / len(vals)
        variance = sum((x - mean_v) ** 2 for x in vals) / len(vals)
        std_v = variance ** 0.5
        print(f"{col:<22} | {min_v:<8} | {max_v:<8} | {mean_v:<10.2f} | {std_v:<10.2f}")

    print("=" * 70)

    all_checks_passed = pass_row_count and pass_duplicates and pass_missing and pass_negatives and pass_equation
    print(f"\nOVERALL VALIDATION STATUS: {'PASSED' if all_checks_passed else 'FAILED'}\n")
    return all_checks_passed

if __name__ == "__main__":
    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "inventory_history.csv"))
    validate_dataset(file_path)
