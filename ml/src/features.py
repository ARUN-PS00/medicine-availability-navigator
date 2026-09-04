import pandas as pd
import numpy as np

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers temporal, statistical, and domain features for medicine stockout prediction.
    Ensures ZERO target leakage: all features use data on or before day t.
    """
    df = df.copy()

    # Ensure correct data types
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['facility_id', 'medicine_id', 'date']).reset_index(drop=True)

    numeric_cols = ['opening_stock', 'received_quantity', 'dispensed_quantity', 'closing_stock', 'days_since_restock']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # 1. Rolling consumption statistics per (facility_id, medicine_id) group
    grouped_dispensed = df.groupby(['facility_id', 'medicine_id'])['dispensed_quantity']

    df['avg_dispensed_7d'] = grouped_dispensed.transform(lambda x: x.rolling(window=7, min_periods=1).mean())
    df['avg_dispensed_14d'] = grouped_dispensed.transform(lambda x: x.rolling(window=14, min_periods=1).mean())
    df['avg_dispensed_30d'] = grouped_dispensed.transform(lambda x: x.rolling(window=30, min_periods=1).mean())
    df['std_dispensed_7d'] = grouped_dispensed.transform(lambda x: x.rolling(window=7, min_periods=1).std()).fillna(0.0)

    # 2. Demand Acceleration / Trend
    df['consumption_trend'] = (df['avg_dispensed_7d'] + 1e-5) / (df['avg_dispensed_30d'] + 1e-5)

    # 3. Days of Stock Remaining (Estimated burn rate vs closing stock)
    df['days_of_stock_remaining'] = df['closing_stock'] / (df['avg_dispensed_7d'] + 1e-5)

    # 4. Target cleanup: convert to float/numeric, handle empty strings as NaN
    df['stockout_next_3_days'] = pd.to_numeric(df['stockout_next_3_days'], errors='coerce')

    return df

def get_feature_columns():
    """
    Returns list of feature column names used for model training.
    """
    return [
        'closing_stock',
        'opening_stock',
        'received_quantity',
        'dispensed_quantity',
        'days_since_restock',
        'avg_dispensed_7d',
        'avg_dispensed_14d',
        'avg_dispensed_30d',
        'std_dispensed_7d',
        'consumption_trend',
        'days_of_stock_remaining',
        'facility_type',
        'medicine_id'
    ]

def get_categorical_columns():
    return ['facility_type', 'medicine_id']

def get_numerical_columns():
    return [
        'closing_stock',
        'opening_stock',
        'received_quantity',
        'dispensed_quantity',
        'days_since_restock',
        'avg_dispensed_7d',
        'avg_dispensed_14d',
        'avg_dispensed_30d',
        'std_dispensed_7d',
        'consumption_trend',
        'days_of_stock_remaining'
    ]
