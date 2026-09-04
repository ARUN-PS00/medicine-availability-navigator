import os
import sys
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, brier_score_loss
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# Add ml/src directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from features import create_features, get_feature_columns, get_categorical_columns, get_numerical_columns

def validate_model():
    print("=" * 75)
    print("           PHASE 4: MODEL VALIDATION & COMPARATIVE ANALYSIS          ")
    print("=" * 75)

    # 1. Load Data & Saved Model
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "inventory_history.csv"))
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "stockout_model.pkl"))

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data not found at {data_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")

    print(f"Loading raw dataset: {data_path}")
    raw_df = pd.read_csv(data_path)

    print(f"Loading saved ML model pipeline: {model_path}")
    saved_model = joblib.load(model_path)

    # Feature Engineering
    processed_df = create_features(raw_df)

    # Exclude unlabeled rows (final 3 days of each time series)
    unlabeled_count = processed_df['stockout_next_3_days'].isna().sum()
    labeled_df = processed_df.dropna(subset=['stockout_next_3_days']).copy()
    labeled_df['stockout_next_3_days'] = labeled_df['stockout_next_3_days'].astype(int)

    # Chronological Split (Train < 2024-05-21, Test >= 2024-05-21)
    unique_dates = sorted(labeled_df['date'].unique())
    split_idx = int(len(unique_dates) * 0.80)
    split_date = unique_dates[split_idx]

    train_df = labeled_df[labeled_df['date'] < split_date].copy()
    test_df = labeled_df[labeled_df['date'] >= split_date].copy()

    feature_cols = get_feature_columns()
    cat_cols = get_categorical_columns()
    num_cols = get_numerical_columns()

    X_train, y_train = train_df[feature_cols], train_df['stockout_next_3_days']
    X_test, y_test = test_df[feature_cols], test_df['stockout_next_3_days']

    print("\n--- Dataset & Split Sanity Checks ---")
    print(f"Total Raw Rows     : {len(raw_df)}")
    print(f"Excluded NaN Labels: {unlabeled_count} rows")
    print(f"Labeled Rows       : {len(labeled_df)}")
    print(f"Train Period       : {train_df['date'].min().strftime('%Y-%m-%d')} to {train_df['date'].max().strftime('%Y-%m-%d')} ({len(train_df)} rows)")
    print(f"Test Period        : {test_df['date'].min().strftime('%Y-%m-%d')} to {test_df['date'].max().strftime('%Y-%m-%d')} ({len(test_df)} rows)")
    print(f"Train Targets      : 0={sum(y_train==0)} ({sum(y_train==0)/len(y_train):.2%}), 1={sum(y_train==1)} ({sum(y_train==1)/len(y_train):.2%})")
    print(f"Test Targets       : 0={sum(y_test==0)} ({sum(y_test==0)/len(y_test):.2%}), 1={sum(y_test==1)} ({sum(y_test==1)/len(y_test):.2%})")

    # 2. Evaluate Original P3 Model
    print("\n" + "=" * 75)
    print(" 2. ORIGINAL RANDOM FOREST MODEL PERFORMANCE ")
    print("=" * 75)

    y_pred_ml = saved_model.predict(X_test)
    y_proba_ml = saved_model.predict_proba(X_test)[:, 1]

    acc_ml = accuracy_score(y_test, y_pred_ml)
    prec_ml = precision_score(y_test, y_pred_ml, zero_division=0)
    rec_ml = recall_score(y_test, y_pred_ml, zero_division=0)
    f1_ml = f1_score(y_test, y_pred_ml, zero_division=0)
    auc_ml = roc_auc_score(y_test, y_proba_ml)
    cm_ml = confusion_matrix(y_test, y_pred_ml)

    print(f"Accuracy : {acc_ml:.4f} ({acc_ml:.2%})")
    print(f"Precision: {prec_ml:.4f} ({prec_ml:.2%})")
    print(f"Recall   : {rec_ml:.4f} ({rec_ml:.2%})")
    print(f"F1-Score : {f1_ml:.4f}")
    print(f"ROC-AUC  : {auc_ml:.4f}")
    print(f"Confusion Matrix:\n  [TN={cm_ml[0][0]:<5}  FP={cm_ml[0][1]:<5}]\n  [FN={cm_ml[1][0]:<5}  TP={cm_ml[1][1]:<5}]")

    # 3. Simple Heuristic Baseline (days_of_stock_remaining <= 3)
    print("\n" + "=" * 75)
    print(" 3. SIMPLE NON-ML BASELINE (days_of_stock_remaining <= 3) ")
    print("=" * 75)

    y_pred_base = (X_test['days_of_stock_remaining'] <= 3.0).astype(int)
    # Continuous proxy for AUC: inverse of days remaining
    y_score_base = -X_test['days_of_stock_remaining']

    acc_base = accuracy_score(y_test, y_pred_base)
    prec_base = precision_score(y_test, y_pred_base, zero_division=0)
    rec_base = recall_score(y_test, y_pred_base, zero_division=0)
    f1_base = f1_score(y_test, y_pred_base, zero_division=0)
    auc_base = roc_auc_score(y_test, y_score_base)
    cm_base = confusion_matrix(y_test, y_pred_base)

    print(f"Accuracy : {acc_base:.4f} ({acc_base:.2%})")
    print(f"Precision: {prec_base:.4f} ({prec_base:.2%})")
    print(f"Recall   : {rec_base:.4f} ({rec_base:.2%})")
    print(f"F1-Score : {f1_base:.4f}")
    print(f"ROC-AUC  : {auc_base:.4f}")
    print(f"Confusion Matrix:\n  [TN={cm_base[0][0]:<5}  FP={cm_base[0][1]:<5}]\n  [FN={cm_base[1][0]:<5}  TP={cm_base[1][1]:<5}]")

    print("\n--- Direct Comparison: ML Model vs Simple Baseline ---")
    print(f"{'Metric':<12} | {'Simple Baseline':<18} | {'Original ML Model':<18} | {'Difference (ML - Baseline)':<25}")
    print("-" * 75)
    print(f"{'Accuracy':<12} | {acc_base:<18.4f} | {acc_ml:<18.4f} | {acc_ml - acc_base:+18.4f}")
    print(f"{'Precision':<12} | {prec_base:<18.4f} | {prec_ml:<18.4f} | {prec_ml - prec_base:+18.4f}")
    print(f"{'Recall':<12} | {rec_base:<18.4f} | {rec_ml:<18.4f} | {rec_ml - rec_base:+18.4f}")
    print(f"{'F1-Score':<12} | {f1_base:<18.4f} | {f1_ml:<18.4f} | {f1_ml - f1_base:+18.4f}")
    print(f"{'ROC-AUC':<12} | {auc_base:<18.4f} | {auc_ml:<18.4f} | {auc_ml - auc_base:+18.4f}")

    # 4. Feature Ablation Test (Remove closing_stock & days_of_stock_remaining)
    print("\n" + "=" * 75)
    print(" 4. FEATURE ABLATION TEST (Without closing_stock & days_of_stock_remaining) ")
    print("=" * 75)

    ablation_cols = [c for c in feature_cols if c not in ['closing_stock', 'days_of_stock_remaining']]
    ablation_num_cols = [c for c in num_cols if c not in ['closing_stock', 'days_of_stock_remaining']]

    preprocessor_ab = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', ablation_num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    clf_ab = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )

    pipeline_ab = Pipeline(steps=[
        ('preprocessor', preprocessor_ab),
        ('classifier', clf_ab)
    ])

    print("Training transient ablation model in memory...")
    pipeline_ab.fit(X_train[ablation_cols], y_train)

    y_pred_ab = pipeline_ab.predict(X_test[ablation_cols])
    y_proba_ab = pipeline_ab.predict_proba(X_test[ablation_cols])[:, 1]

    acc_ab = accuracy_score(y_test, y_pred_ab)
    prec_ab = precision_score(y_test, y_pred_ab, zero_division=0)
    rec_ab = recall_score(y_test, y_pred_ab, zero_division=0)
    f1_ab = f1_score(y_test, y_pred_ab, zero_division=0)
    auc_ab = roc_auc_score(y_test, y_proba_ab)

    print(f"Ablation Accuracy : {acc_ab:.4f} ({acc_ab:.2%})")
    print(f"Ablation Precision: {prec_ab:.4f} ({prec_ab:.2%})")
    print(f"Ablation Recall   : {rec_ab:.4f} ({rec_ab:.2%})")
    print(f"Ablation F1-Score : {f1_ab:.4f}")
    print(f"Ablation ROC-AUC  : {auc_ab:.4f}")

    # 5. Threshold Analysis
    print("\n" + "=" * 75)
    print(" 5. THRESHOLD ANALYSIS (Original P3 Model) ")
    print("=" * 75)

    thresholds = [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
    thresh_results = []

    print(f"{'Threshold':<10} | {'Precision':<12} | {'Recall':<12} | {'F1-Score':<12}")
    print("-" * 55)

    best_f1 = -1
    best_thresh_f1 = None

    for t in thresholds:
        y_pred_t = (y_proba_ml >= t).astype(int)
        p_t = precision_score(y_test, y_pred_t, zero_division=0)
        r_t = recall_score(y_test, y_pred_t, zero_division=0)
        f_t = f1_score(y_test, y_pred_t, zero_division=0)

        if f_t > best_f1:
            best_f1 = f_t
            best_thresh_f1 = t

        thresh_results.append({"threshold": t, "precision": p_t, "recall": r_t, "f1": f_t})
        print(f"{t:<10.2f} | {p_t:<12.4f} | {r_t:<12.4f} | {f_t:<12.4f}")

    # 6. Calibration Check & Brier Score
    print("\n" + "=" * 75)
    print(" 6. PROBABILITY CALIBRATION & BRIER DIAGNOSTIC ")
    print("=" * 75)

    brier = brier_score_loss(y_test, y_proba_ml)
    print(f"Brier Score Loss: {brier:.4f} (Lower is better, 0.0 is perfect)\n")

    bins = [(0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]
    print(f"{'Probability Bin':<18} | {'Count':<8} | {'Avg Pred Proba':<16} | {'Actual Stockout Rate':<22}")
    print("-" * 75)

    for low, high in bins:
        mask = (y_proba_ml >= low) & (y_proba_ml < high if high < 1.0 else y_proba_ml <= high)
        cnt = mask.sum()
        if cnt > 0:
            avg_pred = y_proba_ml[mask].mean()
            actual_rate = y_test[mask].mean()
            print(f"[{low:.1f} - {high:.1f}]           | {cnt:<8} | {avg_pred:<16.4f} | {actual_rate:<22.4f} ({actual_rate:.2%})")
        else:
            print(f"[{low:.1f} - {high:.1f}]           | {0:<8} | N/A              | N/A")

    print("\n" + "=" * 75)
    print("               PHASE 4 VALIDATION SUMMARY RESULTS                ")
    print("=" * 75)
    print(f"1. Original ML Model ROC-AUC: {auc_ml:.4f} | Recall: {rec_ml:.2%} | F1: {f1_ml:.4f}")
    print(f"2. Simple Baseline ROC-AUC  : {auc_base:.4f} | Recall: {rec_base:.2%} | F1: {f1_base:.4f}")
    print(f"3. Ablation Model ROC-AUC   : {auc_ab:.4f} | Recall: {rec_ab:.2%} | F1: {f1_ab:.4f}")
    print(f"4. Highest F1 Threshold     : {best_thresh_f1:.2f} (F1 = {best_f1:.4f})")
    print(f"5. Recommended App Threshold: 0.50 (Optimizes High Recall {rec_ml:.2%} for critical shortage alerts)")
    print("=" * 75)

if __name__ == "__main__":
    validate_model()
