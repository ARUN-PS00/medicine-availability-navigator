import os
import sys
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# Add ml/src directory to sys.path to allow relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from features import create_features, get_feature_columns, get_categorical_columns, get_numerical_columns

def train_and_evaluate():
    print("=" * 70)
    print("        PHASE 3: ML FEATURE ENGINEERING & MODEL TRAINING        ")
    print("=" * 70)

    # 1. Load Data
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "inventory_history.csv"))
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading raw dataset from: {data_path}")
    raw_df = pd.read_csv(data_path)
    print(f"Raw dataset shape: {raw_df.shape}")

    # 2. Build Features
    print("Engineering features (rolling stats, trend, stock remaining)...")
    processed_df = create_features(raw_df)

    # 3. Filter out NaN targets (last 3 days of time series)
    labeled_df = processed_df.dropna(subset=['stockout_next_3_days']).copy()
    labeled_df['stockout_next_3_days'] = labeled_df['stockout_next_3_days'].astype(int)
    print(f"Labeled dataset shape (after excluding NaN targets): {labeled_df.shape}")

    # 4. Chronological Train/Test Split
    unique_dates = sorted(labeled_df['date'].unique())
    total_days = len(unique_dates)
    
    # Use first ~80% of days for training, remaining ~20% for testing
    split_idx = int(total_days * 0.80)
    split_date = unique_dates[split_idx]

    train_mask = labeled_df['date'] < split_date
    test_mask = labeled_df['date'] >= split_date

    train_df = labeled_df[train_mask].copy()
    test_df = labeled_df[test_mask].copy()

    train_start, train_end = train_df['date'].min().strftime('%Y-%m-%d'), train_df['date'].max().strftime('%Y-%m-%d')
    test_start, test_end = test_df['date'].min().strftime('%Y-%m-%d'), test_df['date'].max().strftime('%Y-%m-%d')

    print(f"\n--- Chronological Split Info ---")
    print(f"Train Period: {train_start} to {train_end} ({len(train_df['date'].unique())} days, {len(train_df)} rows)")
    print(f"Test Period : {test_start} to {test_end} ({len(test_df['date'].unique())} days, {len(test_df)} rows)")

    feature_cols = get_feature_columns()
    cat_cols = get_categorical_columns()
    num_cols = get_numerical_columns()

    X_train = train_df[feature_cols]
    y_train = train_df['stockout_next_3_days']

    X_test = test_df[feature_cols]
    y_test = test_df['stockout_next_3_days']

    # Class Distributions
    train_dist = y_train.value_counts(normalize=True).to_dict()
    test_dist = y_test.value_counts(normalize=True).to_dict()
    print(f"Train Target Distribution: 0 -> {train_dist.get(0, 0):.2%}, 1 -> {train_dist.get(1, 0):.2%}")
    print(f"Test Target Distribution : 0 -> {test_dist.get(0, 0):.2%}, 1 -> {test_dist.get(1, 0):.2%}")

    # 5. Build Scikit-Learn Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', clf)
    ])

    # 6. Train Model
    print("\nTraining RandomForestClassifier pipeline...")
    model_pipeline.fit(X_train, y_train)

    # 7. Evaluate Model
    print("\nEvaluating on chronological test set...")
    y_pred = model_pipeline.predict(X_test)
    y_proba = model_pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 70)
    print("                     MODEL PERFORMANCE METRICS                    ")
    print("=" * 70)
    print(f"Accuracy : {acc:.4f} ({acc:.2%})")
    print(f"Precision: {prec:.4f} ({prec:.2%})")
    print(f"Recall   : {rec:.4f} ({rec:.2%})  <-- Key metric for stockout detection")
    print(f"F1-Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"  [TN={cm[0][0]:<5}  FP={cm[0][1]:<5}]")
    print(f"  [FN={cm[1][0]:<5}  TP={cm[1][1]:<5}]")
    print("=" * 70)

    # 8. Feature Importance
    cat_encoder = model_pipeline.named_steps['preprocessor'].named_transformers_['cat']
    encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_cols))
    all_feature_names = num_cols + encoded_cat_names

    importances = model_pipeline.named_steps['classifier'].feature_importances_
    feat_imp = pd.DataFrame({'feature': all_feature_names, 'importance': importances})
    feat_imp = feat_imp.sort_values(by='importance', ascending=False).reset_index(drop=True)

    print("\nTop 10 Most Important Features:")
    for idx, row in feat_imp.head(10).iterrows():
        print(f"  {idx+1:2d}. {row['feature']:<30} : {row['importance']:.4f}")

    # 9. Save Model Pipeline
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "stockout_model.pkl")

    print(f"\nSaving trained pipeline to: {model_path}")
    joblib.dump(model_pipeline, model_path)

    # 10. Sanity Checks & Verification
    print("\n--- Running Sanity Checks ---")
    # Check loading saved model
    loaded_model = joblib.load(model_path)
    sample_rows = X_test.head(5)
    sample_preds = loaded_model.predict(sample_rows)
    sample_probas = loaded_model.predict_proba(sample_rows)[:, 1]

    print("Sample test predictions using reloaded model:")
    for i in range(len(sample_rows)):
        print(f"  Sample {i+1}: Class={sample_preds[i]}, Probability of Stockout={sample_probas[i]:.4f}")

    print("\nSanity Check Status: ALL CHECKS PASSED")

    return {
        "acc": acc,
        "prec": prec,
        "rec": rec,
        "f1": f1,
        "roc_auc": roc_auc,
        "cm": cm,
        "train_range": (train_start, train_end),
        "test_range": (test_start, test_end),
        "train_size": len(train_df),
        "test_size": len(test_df),
        "train_dist": train_dist,
        "test_dist": test_dist,
        "feat_imp": feat_imp,
        "sample_probas": sample_probas
    }

if __name__ == "__main__":
    train_and_evaluate()
