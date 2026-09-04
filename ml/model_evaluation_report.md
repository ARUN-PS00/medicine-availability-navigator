# Phase 3 Model Evaluation Report: Medicine Stockout Prediction

**Model Artifact**: [`ml/models/stockout_model.pkl`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/models/stockout_model.pkl)  
**Feature Module**: [`ml/src/features.py`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/src/features.py)  
**Training Script**: [`ml/src/train_model.py`](file:///c:/Users/TUF/OneDrive/Creative%20Cloud%20Files/Desktop/me/projects/MAP/medicine-availability-navigator/ml/src/train_model.py)  
**Status**: **COMPLETED & SANITY CHECKED**

---

## 1. Executive Summary

A `RandomForestClassifier` scikit-learn pipeline was built to predict medicine stockouts within the next 3 days (`stockout_next_3_days`).

The model prioritizes **Recall** to minimize false negatives (unpredicted medicine shortages), achieving a **90.94% Recall** and an **ROC-AUC of 0.9306** on an unseen chronological test set.

---

## 2. Features Used

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `closing_stock` | Numerical | Stock balance at end of day $t$ |
| `opening_stock` | Numerical | Stock balance at start of day $t$ |
| `received_quantity` | Numerical | Replenishment received on day $t$ |
| `dispensed_quantity` | Numerical | Units dispensed on day $t$ |
| `days_since_restock` | Numerical | Consecutive days since last delivery |
| `avg_dispensed_7d` | Numerical | 7-day rolling mean of consumption |
| `avg_dispensed_14d` | Numerical | 14-day rolling mean of consumption |
| `avg_dispensed_30d` | Numerical | 30-day rolling mean of consumption |
| `std_dispensed_7d` | Numerical | 7-day rolling standard deviation of demand |
| `consumption_trend` | Numerical | Demand acceleration ratio `(7d_avg + 1e-5) / (30d_avg + 1e-5)` |
| `days_of_stock_remaining` | Numerical | Estimated days of inventory remaining `closing_stock / (7d_avg + 1e-5)` |
| `facility_type` | Categorical | One-hot encoded (`District Hospital`, `CHC`, `PHC`, `Pharmacy`) |
| `medicine_id` | Categorical | One-hot encoded (`M001` to `M010`) |

> **Target Leakage Safeguard**: All rolling window features use past data up to day $t$ only. No future data ($t+1$, $t+2$, $t+3$) is included in input features.

---

## 3. Chronological Train/Test Split

To simulate real-world historical prediction without lookahead bias:

- **Train Period**: `2024-01-01` to `2024-05-20` (141 days, **28,200 rows**, ~80%)
  - Target Distribution: `0` -> **85.58%** | `1` -> **14.42%**
- **Test Period**: `2024-05-21` to `2024-06-25` (36 days, **7,200 rows**, ~20%)
  - Target Distribution: `0` -> **88.04%** | `1` -> **11.96%**
- **Excluded Edge Rows**: 600 rows (final 3 days of time series where 3-day target is undefined).

---

## 4. Model Configuration

- **Algorithm**: `RandomForestClassifier` within a scikit-learn `Pipeline` and `ColumnTransformer`.
- **Hyperparameters**:
  - `n_estimators`: 100
  - `max_depth`: 12
  - `min_samples_split`: 5
  - `class_weight`: `'balanced'` (to handle class imbalance and prioritize recall)
  - `random_state`: 42

---

## 5. Performance Metrics

| Metric | Score | Interpretation |
| :--- | :--- | :--- |
| **Accuracy** | **83.82%** | Overall proportion of correct predictions across all classes. |
| **Precision** | **41.87%** | Proportion of flagged stockouts that actually run out within 3 days. |
| **Recall** | **90.94%** | **Proportion of actual stockouts correctly caught by the model** (783 out of 861 stockouts detected). |
| **F1-Score** | **0.5734** | Harmonic mean of precision and recall. |
| **ROC-AUC** | **0.9306** | Excellent class discrimination power across decision thresholds. |

---

## 6. Confusion Matrix

| | Predicted No Stockout (0) | Predicted Stockout (1) | Total |
| :--- | :---: | :---: | :---: |
| **Actual No Stockout (0)** | **5,252** (True Negative) | **1,087** (False Positive) | 6,339 |
| **Actual Stockout (1)** | **78** (False Negative) | **783** (True Positive) | 861 |

*Note: In medical supply chain management, False Positives (early warning/preventative reorder) are far acceptable than False Negatives (unannounced drug stockouts). The model successfully limits missed stockouts to only 78 instances out of 861.*

---

## 7. Feature Importance Ranking

Top 10 features extracted from the Random Forest model:

1. `days_of_stock_remaining`: **42.18%**
2. `closing_stock`: **17.46%**
3. `days_since_restock`: **9.01%**
4. `opening_stock`: **7.23%**
5. `dispensed_quantity`: **4.90%**
6. `std_dispensed_7d`: **4.09%**
7. `avg_dispensed_7d`: **3.19%**
8. `consumption_trend`: **3.15%**
9. `avg_dispensed_14d`: **2.48%**
10. `avg_dispensed_30d`: **2.44%**

---

## 8. Sample Inference Test

Using `loaded_model.predict_proba()` on unseen test instances:

```text
Sample 1: Predicted Class = 1 | Probability of Stockout = 87.61%
Sample 2: Predicted Class = 1 | Probability of Stockout = 85.53%
Sample 3: Predicted Class = 1 | Probability of Stockout = 55.80%
Sample 4: Predicted Class = 0 | Probability of Stockout =  3.04%
Sample 5: Predicted Class = 0 | Probability of Stockout =  6.40%
```

---

## 9. Sanity Checks & Verification Summary

- [x] Zero target leakage: All rolling features computed strictly on past dates ($t$).
- [x] NaN target rows excluded.
- [x] Chronological split enforced (train before test date threshold).
- [x] Scikit-learn Pipeline created and serialized to `ml/models/stockout_model.pkl`.
- [x] Reloaded model successfully outputs class predictions and `predict_proba()`.
