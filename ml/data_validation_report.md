# Phase 2 Synthetic Data Validation Report

**Dataset**: [`ml/data/inventory_history.csv`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/data/inventory_history.csv)  
**Generator Script**: [`ml/src/generate_inventory_data.py`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/src/generate_inventory_data.py)  
**Validation Script**: [`ml/src/validate_inventory_data.py`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/src/validate_inventory_data.py)  
**Status**: **PASSED**

---

## 1. Executive Summary

All data generated for Phase 2 is **100% synthetic / simulated**. No real patient, facility, or government data was used.

The dataset simulates historical inventory movements across 20 synthetic health facilities and 10 medicines over 180 consecutive calendar days, producing **36,000 total rows**.

---

## 2. Data Health Checks

| Check Item | Target | Result | Status |
| :--- | :--- | :--- | :---: |
| Total Row Count | 36,000 | 36,000 | **PASS** |
| Duplicate Rows | 0 | 0 | **PASS** |
| Missing Values in Raw Features | 0 | 0 | **PASS** |
| Non-negative Quantities | 0 negative values | 0 negative values | **PASS** |
| Inventory Equation Integrity | `opening + received - dispensed == closing` | 100% compliant (0 errors) | **PASS** |
| Random Seed Fixed | `42` | Reproducible | **PASS** |

---

## 3. Stock-Out & Target Analysis

### Stock-Out Statistics
- **Today's Closing Stock == 0**: 2,808 rows (**7.80%** of total dataset)
- Demonstrates realistic, non-extreme stockout frequency across facilities.

### Target Distribution (`stockout_next_3_days`)
- **Class 0 (No Stockout in Next 3 Days)**: 30,473 rows (**86.08%**)
- **Class 1 (Stockout in Next 3 Days)**: 4,927 rows (**13.92%**)
- **Unlabeled / Edge Case (Final 3 Days of Time Series)**: 600 rows (200 series × 3 days)
- **Target = 1 when Today's `closing_stock` > 0**: 3,220 rows (**65.35% of all positive targets**)
  - *Data Quality Confirmation*: Proves that the target is **non-trivial** and cannot be predicted simply by looking at `closing_stock == 0`. The ML model must learn consumption velocity, restocking lead times, days since restock, and facility/medicine demand patterns.

---

## 4. Dataset Breakdown

### Facilities (20 Fictional Facilities)
- **District Hospitals (2)**: `F001`, `F002` (3,600 rows)
- **CHCs (4)**: `F003`–`F006` (7,200 rows)
- **PHCs (10)**: `F007`–`F016` (18,000 rows)
- **Pharmacies (4)**: `F017`–`F020` (7,200 rows)

### Medicines (10 Fictional Medicines)
- `M001` (Paracetamol 500mg), `M002` (Amoxicillin 500mg), `M003` (Metformin 500mg), `M004` (Amlodipine 5mg), `M005` (Azithromycin 500mg), `M006` (Cetirizine 10mg), `M007` (Omeprazole 20mg), `M008` (ORS), `M009` (Ibuprofen 400mg), `M010` (Atorvastatin 10mg). Each has 3,600 rows.

### Date Range
- **Start Date**: 2024-01-01
- **End Date**: 2024-06-28 (180 calendar days)

---

## 5. Descriptive Statistics

| Feature | Min | Max | Mean | Std Dev |
| :--- | :--- | :--- | :--- | :--- |
| `opening_stock` | 0 | 2,045 | 164.39 | 168.60 |
| `received_quantity` | 0 | 1,280 | 29.44 | 109.34 |
| `dispensed_quantity` | 0 | 309 | 29.53 | 25.34 |
| `closing_stock` | 0 | 2,045 | 164.30 | 168.73 |
| `days_since_restock` | 0 | 19 | 5.02 | 3.51 |

---

## 6. Confirmation of Synthetic Nature

> All facilities, names, geographic coordinates (Lat 12.85–13.10, Lon 77.45–77.73), stock movements, restocking patterns, and target values in this dataset are **100% synthetic** and artificially generated for machine learning research and demonstration purposes.
