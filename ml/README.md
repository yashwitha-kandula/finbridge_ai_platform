# FinBridge AI — M3 Day 1

## Objective

Establish the initial ML data pipeline between PostgreSQL
and Python/Pandas.

## Database

Database: financial_ai_db
DBMS: PostgreSQL 18

## Source Table

transactions

## Important Fields

- id
- user_id
- category_id
- income_source_id
- amount
- transaction_type
- description
- transaction_date
- payment_method
- is_recurring

## Completed

- Verified transaction table schema
- Connected Python to PostgreSQL
- Retrieved transaction data
- Loaded transaction data into Pandas
- Checked DataFrame shape
- Checked columns
- Checked data types
- Checked missing values
- Added user-specific transaction loading

## Current Test Data

User ID: 3
Transaction amount: ₹30,000
Transaction type: income
Transaction date: 2026-08-31
Payment method: bank_transfer
Recurring: true

## Data Flow

PostgreSQL
    ↓
transactions
    ↓
Python
    ↓
Pandas DataFrame
    ↓
Future ML preprocessing

---

# ML / Analytics — Current Reference (updated 2026-10-06)

## Datasets
| File | Size | Use |
|---|---|---|
| `data/transactions_50M.parquet` | 50M rows × 9 cols, 1.5 GB (not in Git) | Scale analysis with DuckDB (`analyze_transactions_50m.py`, `inspect_transactions_50m.py`). It's never fully loaded into RAM. |
| `data/finbridge_variable_income_dataset.csv` | 213,347 rows × 9 | Variable-income profiles (farmer, freelancer, daily wage, …) |
| `data/ml_ready/finbridge_ml_features.csv` | 1000 users × 27 features | Feature engineering output |
| `data/splits/{train,validation,test}.csv` | split | Model training and evaluation |

## Pipeline (scripts, in order)
`data/finbridge_variable_income_dataset.py` → `validate_variable_income.py` → `feature_engineering.py` → `audit_features.py` / `eda_features.py` → `create_targets.py` → `feature_selection.py` → `split_dataset.py` → `train_baseline_models.py` → `evaluate_baseline_models.py` → `tune_models.py` → `audit_ml_dataset.py` → `evaluate_final_test.py`

## Model results
| Model | Validation weighted F1 | Test F1 |
|---|---|---|
| Logistic Regression (C=100) | 0.9801 | 0.9732 |
| Random Forest | 0.9195 | 0.9189 |

Tuning used the validation set only. The test set was used once (`data/final_evaluation/`).

## Runtime analytics services (used by the API)
| Module | Function |
|---|---|
| `analytics/financial_analytics.py` | income, expense, savings, savings rate, expense ratio, category totals |
| `analytics/spending_analysis.py` | top category, high-value alerts (≥ ₹10,000) |
| `analytics/debt_analysis.py` | outstanding, annual interest, ranking by interest rate |
| `analytics/goal_analysis.py` | progress, required monthly contribution, feasibility |
| `analytics/financial_health.py` | 0–100 score from savings-rate and debt-ratio bands |
| `recommendations/recommendation_engine.py` | rule-based recommendations, each with a reason |
| `forecasting/expense_forecaster.py` + `services/forecast_service.py` | linear-trend forecast, ±1σ range, walk-forward MAE/MAPE |
| `services/m2_service.py` | runs the full pipeline |
| `services/ai_assistant.py` | grounded assistant (see `ai/README.md`) |

Run the tests from `finbridge_ai_platform/` with `python -m pytest`.