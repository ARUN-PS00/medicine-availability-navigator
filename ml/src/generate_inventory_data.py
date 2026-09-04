import csv
import math
import os
import random
from datetime import datetime, timedelta

def generate_dataset(output_path, seed=42):
    random.seed(seed)

    # 1. Configuration
    START_DATE = datetime(2024, 1, 1)
    NUM_DAYS = 180

    FACILITIES = [
        # District Hospitals (2)
        {"id": "F001", "name": "Synthetic District Hospital F001", "type": "District Hospital", "lat": 12.9716, "lon": 77.5946, "demand_scale": 2.8, "restock_cycle": 7, "batch_scale": 2.8},
        {"id": "F002", "name": "Synthetic District Hospital F002", "type": "District Hospital", "lat": 12.9250, "lon": 77.5897, "demand_scale": 2.6, "restock_cycle": 8, "batch_scale": 2.6},
        # CHCs (4)
        {"id": "F003", "name": "Synthetic CHC F003", "type": "CHC", "lat": 12.9800, "lon": 77.6400, "demand_scale": 1.6, "restock_cycle": 10, "batch_scale": 1.6},
        {"id": "F004", "name": "Synthetic CHC F004", "type": "CHC", "lat": 13.0350, "lon": 77.5970, "demand_scale": 1.5, "restock_cycle": 10, "batch_scale": 1.5},
        {"id": "F005", "name": "Synthetic CHC F005", "type": "CHC", "lat": 12.9100, "lon": 77.6200, "demand_scale": 1.7, "restock_cycle": 9, "batch_scale": 1.7},
        {"id": "F006", "name": "Synthetic CHC F006", "type": "CHC", "lat": 12.8900, "lon": 77.5500, "demand_scale": 1.4, "restock_cycle": 11, "batch_scale": 1.4},
        # PHCs (10)
        {"id": "F007", "name": "Synthetic PHC F007", "type": "PHC", "lat": 13.0500, "lon": 77.6500, "demand_scale": 0.8, "restock_cycle": 14, "batch_scale": 0.8},
        {"id": "F008", "name": "Synthetic PHC F008", "type": "PHC", "lat": 12.9600, "lon": 77.5100, "demand_scale": 0.7, "restock_cycle": 14, "batch_scale": 0.7},
        {"id": "F009", "name": "Synthetic PHC F009", "type": "PHC", "lat": 13.1000, "lon": 77.5800, "demand_scale": 0.9, "restock_cycle": 12, "batch_scale": 0.9},
        {"id": "F010", "name": "Synthetic PHC F010", "type": "PHC", "lat": 12.8700, "lon": 77.6000, "demand_scale": 0.6, "restock_cycle": 14, "batch_scale": 0.6},
        {"id": "F011", "name": "Synthetic PHC F011", "type": "PHC", "lat": 13.0100, "lon": 77.7000, "demand_scale": 0.85, "restock_cycle": 13, "batch_scale": 0.85},
        {"id": "F012", "name": "Synthetic PHC F012", "type": "PHC", "lat": 12.9400, "lon": 77.6800, "demand_scale": 0.75, "restock_cycle": 14, "batch_scale": 0.75},
        {"id": "F013", "name": "Synthetic PHC F013", "type": "PHC", "lat": 12.8500, "lon": 77.6600, "demand_scale": 0.65, "restock_cycle": 15, "batch_scale": 0.65},
        {"id": "F014", "name": "Synthetic PHC F014", "type": "PHC", "lat": 13.0800, "lon": 77.5200, "demand_scale": 0.8, "restock_cycle": 13, "batch_scale": 0.8},
        {"id": "F015", "name": "Synthetic PHC F015", "type": "PHC", "lat": 12.9900, "lon": 77.4700, "demand_scale": 0.7, "restock_cycle": 14, "batch_scale": 0.7},
        {"id": "F016", "name": "Synthetic PHC F016", "type": "PHC", "lat": 12.9000, "lon": 77.7300, "demand_scale": 0.6, "restock_cycle": 16, "batch_scale": 0.6},
        # Pharmacies (4)
        {"id": "F017", "name": "Synthetic Pharmacy F017", "type": "Pharmacy", "lat": 12.9750, "lon": 77.6050, "demand_scale": 1.1, "restock_cycle": 7, "batch_scale": 1.1},
        {"id": "F018", "name": "Synthetic Pharmacy F018", "type": "Pharmacy", "lat": 12.9350, "lon": 77.6150, "demand_scale": 1.0, "restock_cycle": 7, "batch_scale": 1.0},
        {"id": "F019", "name": "Synthetic Pharmacy F019", "type": "Pharmacy", "lat": 13.0250, "lon": 77.5450, "demand_scale": 1.2, "restock_cycle": 6, "batch_scale": 1.2},
        {"id": "F020", "name": "Synthetic Pharmacy F020", "type": "Pharmacy", "lat": 12.9150, "lon": 77.6750, "demand_scale": 0.9, "restock_cycle": 8, "batch_scale": 0.9},
    ]

    MEDICINES = [
        {"id": "M001", "name": "Paracetamol 500mg", "base_demand": 45, "batch_size": 400, "surge_type": "flu"},
        {"id": "M002", "name": "Amoxicillin 500mg", "base_demand": 25, "batch_size": 250, "surge_type": "flu"},
        {"id": "M003", "name": "Metformin 500mg", "base_demand": 30, "batch_size": 300, "surge_type": "none"},
        {"id": "M004", "name": "Amlodipine 5mg", "base_demand": 20, "batch_size": 200, "surge_type": "none"},
        {"id": "M005", "name": "Azithromycin 500mg", "base_demand": 18, "batch_size": 180, "surge_type": "flu"},
        {"id": "M006", "name": "Cetirizine 10mg", "base_demand": 22, "batch_size": 220, "surge_type": "allergy"},
        {"id": "M007", "name": "Omeprazole 20mg", "base_demand": 22, "batch_size": 220, "surge_type": "none"},
        {"id": "M008", "name": "ORS", "base_demand": 40, "batch_size": 400, "surge_type": "heatwave"},
        {"id": "M009", "name": "Ibuprofen 400mg", "base_demand": 28, "batch_size": 280, "surge_type": "none"},
        {"id": "M010", "name": "Atorvastatin 10mg", "base_demand": 14, "batch_size": 150, "surge_type": "none"},
    ]

    all_rows = []

    for fac in FACILITIES:
        for med in MEDICINES:
            # Series simulation for one (facility, medicine) over 180 days
            avg_daily_demand = med["base_demand"] * fac["demand_scale"]
            # Start stock with ~4 to 8 days worth of stock
            current_stock = int(avg_daily_demand * random.uniform(4.0, 8.0))
            days_since_restock = random.randint(1, 5)
            pending_delivery_day = None

            series_records = []

            for day_idx in range(NUM_DAYS):
                current_date = (START_DATE + timedelta(days=day_idx)).strftime("%Y-%m-%d")
                weekday = (START_DATE + timedelta(days=day_idx)).weekday()

                # Check if stock arrives today
                received_qty = 0
                if pending_delivery_day == day_idx:
                    base_batch = med["batch_size"] * fac["batch_scale"]
                    received_qty = int(base_batch * random.uniform(0.85, 1.15))
                    pending_delivery_day = None
                    days_since_restock = 0
                else:
                    days_since_restock += 1

                opening_stock = current_stock
                available_stock = opening_stock + received_qty

                # Calculate Demand
                # 1. Day of week factor
                if fac["type"] in ["PHC", "CHC"]:
                    dow_factor = 0.6 if weekday == 6 else (1.2 if weekday == 0 else 1.0)
                else:  # Hospital / Pharmacy open 7 days
                    dow_factor = 0.9 if weekday == 6 else 1.05

                # 2. Seasonal / Surge factor
                surge_factor = 1.0
                if med["surge_type"] == "flu" and 35 <= day_idx <= 65:
                    surge_factor = 1.55
                elif med["surge_type"] == "heatwave" and 100 <= day_idx <= 130:
                    surge_factor = 1.85
                elif med["surge_type"] == "allergy" and 75 <= day_idx <= 105:
                    surge_factor = 1.45

                expected_demand = avg_daily_demand * dow_factor * surge_factor
                # Add random noise (normal distribution)
                noise_std = max(1.5, expected_demand * 0.22)
                simulated_demand = max(0, int(random.gauss(expected_demand, noise_std)))

                dispensed_qty = min(simulated_demand, available_stock)
                closing_stock = available_stock - dispensed_qty
                current_stock = closing_stock

                # Check if a restock order should be placed for future arrival
                if pending_delivery_day is None:
                    # Reorder if stock is low (< 3.5 days of demand) or cycle reached
                    if closing_stock < (avg_daily_demand * 3.5) or days_since_restock >= fac["restock_cycle"]:
                        lead_time = random.randint(2, 4)
                        # Simulate occasional supply chain delays (16% probability)
                        if random.random() < 0.16:
                            lead_time += random.randint(3, 6)  # Delayed restock!
                        pending_delivery_day = day_idx + lead_time

                series_records.append({
                    "date": current_date,
                    "facility_id": fac["id"],
                    "facility_name": fac["name"],
                    "facility_type": fac["type"],
                    "latitude": fac["lat"],
                    "longitude": fac["lon"],
                    "medicine_id": med["id"],
                    "medicine_name": med["name"],
                    "opening_stock": opening_stock,
                    "received_quantity": received_qty,
                    "dispensed_quantity": dispensed_qty,
                    "closing_stock": closing_stock,
                    "days_since_restock": days_since_restock,
                })

            # Calculate target stockout_next_3_days
            for t in range(NUM_DAYS):
                if t <= NUM_DAYS - 4:
                    # Look at closing stock for day t+1, t+2, t+3
                    st_1 = series_records[t+1]["closing_stock"]
                    st_2 = series_records[t+2]["closing_stock"]
                    st_3 = series_records[t+3]["closing_stock"]
                    target = 1 if (st_1 == 0 or st_2 == 0 or st_3 == 0) else 0
                else:
                    # Edge case: last 3 days don't have full 3-day horizon
                    target = ""
                series_records[t]["stockout_next_3_days"] = target

            all_rows.extend(series_records)

    # Sort by date, facility_id, medicine_id
    all_rows.sort(key=lambda x: (x["date"], x["facility_id"], x["medicine_id"]))

    # Write to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fieldnames = [
        "date", "facility_id", "facility_name", "facility_type",
        "latitude", "longitude", "medicine_id", "medicine_name",
        "opening_stock", "received_quantity", "dispensed_quantity",
        "closing_stock", "days_since_restock", "stockout_next_3_days"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"Dataset generated successfully at {output_path}")
    print(f"Total rows: {len(all_rows)}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "..", "data", "inventory_history.csv")
    generate_dataset(os.path.abspath(out_file))
