import pandas as pd
import numpy as np
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_FILE = (
    BASE_DIR
    / "data"
    / "finbridge_variable_income_dataset.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "processed"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("Loading dataset...")

df = pd.read_csv(DATA_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# ============================================================
# BASIC DATA PREPARATION
# ============================================================

df["transaction_date"] = pd.to_datetime(
    df["transaction_date"],
    errors="coerce"
)

df["amount"] = pd.to_numeric(
    df["amount"],
    errors="coerce"
)

df["year"] = df["transaction_date"].dt.year
df["month"] = df["transaction_date"].dt.month

df["year_month"] = (
    df["transaction_date"]
    .dt.to_period("M")
    .astype(str)
)


# ============================================================
# TRANSACTION-TYPE AMOUNTS
# ============================================================

df["income_amount"] = np.where(
    df["transaction_type"] == "Income",
    df["amount"],
    0
)

df["expense_amount"] = np.where(
    df["transaction_type"] == "Expense",
    df["amount"],
    0
)

df["investment_amount"] = np.where(
    df["transaction_type"] == "Investment",
    df["amount"],
    0
)

df["loan_amount"] = np.where(
    df["transaction_type"] == "Loan",
    df["amount"],
    0
)

df["loan_payment_amount"] = np.where(
    df["transaction_type"] == "Loan Payment",
    df["amount"],
    0
)

df["transfer_amount"] = np.where(
    df["transaction_type"] == "Transfer",
    df["amount"],
    0
)


# ============================================================
# MONTHLY USER-LEVEL CASH-FLOW FEATURES
# ============================================================

monthly = (
    df.groupby(["user_id", "year_month"])
    .agg(
        monthly_income=("income_amount", "sum"),
        monthly_expense=("expense_amount", "sum"),
        monthly_investment=("investment_amount", "sum"),
        monthly_loan=("loan_amount", "sum"),
        monthly_loan_payment=("loan_payment_amount", "sum"),
        monthly_transfer=("transfer_amount", "sum"),
        monthly_transaction_count=("amount", "count"),
        monthly_average_transaction=("amount", "mean"),
        monthly_recurring_transaction_count=("is_recurring", "sum")
    )
    .reset_index()
)

monthly["monthly_net_cash_flow"] = (
    monthly["monthly_income"]
    - monthly["monthly_expense"]
    - monthly["monthly_investment"]
    - monthly["monthly_loan_payment"]
)

monthly["monthly_savings_ratio"] = np.where(
    monthly["monthly_income"] > 0,
    monthly["monthly_net_cash_flow"]
    / monthly["monthly_income"],
    0
)

monthly["monthly_expense_to_income_ratio"] = np.where(
    monthly["monthly_income"] > 0,
    monthly["monthly_expense"]
    / monthly["monthly_income"],
    0
)

monthly["monthly_recurring_transaction_ratio"] = np.where(
    monthly["monthly_transaction_count"] > 0,
    monthly["monthly_recurring_transaction_count"]
    / monthly["monthly_transaction_count"],
    0
)


# ============================================================
# AGGREGATE MONTHLY BEHAVIOR TO USER LEVEL
# ============================================================

monthly_features = (
    monthly.groupby("user_id")
    .agg(
        average_monthly_income=(
            "monthly_income",
            "mean"
        ),

        average_monthly_expense=(
            "monthly_expense",
            "mean"
        ),

        average_monthly_net_cash_flow=(
            "monthly_net_cash_flow",
            "mean"
        ),

        average_monthly_savings_ratio=(
            "monthly_savings_ratio",
            "mean"
        ),

        average_monthly_expense_to_income_ratio=(
            "monthly_expense_to_income_ratio",
            "mean"
        ),

        average_monthly_recurring_ratio=(
            "monthly_recurring_transaction_ratio",
            "mean"
        ),

        monthly_income_std=(
            "monthly_income",
            "std"
        ),

        monthly_expense_std=(
            "monthly_expense",
            "std"
        ),

        active_month_count=(
            "year_month",
            "nunique"
        )
    )
    .reset_index()
)

monthly_features["monthly_income_std"] = (
    monthly_features["monthly_income_std"]
    .fillna(0)
)

monthly_features["monthly_expense_std"] = (
    monthly_features["monthly_expense_std"]
    .fillna(0)
)


# ============================================================
# INCOME FEATURES
# ============================================================

income_features = (
    df[df["transaction_type"] == "Income"]
    .groupby("user_id")
    .agg(
        total_income=("amount", "sum"),
        average_income=("amount", "mean"),
        median_income=("amount", "median"),
        income_std=("amount", "std"),
        minimum_income=("amount", "min"),
        maximum_income=("amount", "max"),
        income_transaction_count=("amount", "count")
    )
    .reset_index()
)

income_features["income_std"] = (
    income_features["income_std"]
    .fillna(0)
)

income_features["income_coefficient_variation"] = np.where(
    income_features["average_income"] > 0,
    income_features["income_std"]
    / income_features["average_income"],
    0
)


# ============================================================
# INCOME-SOURCE FEATURES
# ============================================================

income_source_features = (
    df[df["transaction_type"] == "Income"]
    .groupby("user_id")
    .agg(
        income_source_count=("income_source", "nunique")
    )
    .reset_index()
)

income_source_features["multiple_income_flag"] = np.where(
    income_source_features["income_source_count"] > 1,
    1,
    0
)


# ============================================================
# EXPENSE FEATURES
# ============================================================

expense_features = (
    df[df["transaction_type"] == "Expense"]
    .groupby("user_id")
    .agg(
        total_expense=("amount", "sum"),
        average_expense=("amount", "mean"),
        median_expense=("amount", "median"),
        expense_std=("amount", "std"),
        minimum_expense=("amount", "min"),
        maximum_expense=("amount", "max"),
        expense_transaction_count=("amount", "count")
    )
    .reset_index()
)

expense_features["expense_std"] = (
    expense_features["expense_std"]
    .fillna(0)
)


# ============================================================
# PAYMENT-METHOD FEATURES
# ============================================================

payment_features = (
    df.groupby("user_id")
    .agg(
        total_transactions=("amount", "count"),

        cash_transactions=(
            "payment_method",
            lambda x: (x == "cash").sum()
        ),

        upi_transactions=(
            "payment_method",
            lambda x: (x == "upi").sum()
        ),

        bank_transfer_transactions=(
            "payment_method",
            lambda x: (x == "bank_transfer").sum()
        ),

        debit_card_transactions=(
            "payment_method",
            lambda x: (x == "debit_card").sum()
        )
    )
    .reset_index()
)


# ============================================================
# PAYMENT-METHOD RATIOS
# ============================================================

payment_features["cash_transaction_ratio"] = (
    payment_features["cash_transactions"]
    / payment_features["total_transactions"]
)

payment_features["upi_transaction_ratio"] = (
    payment_features["upi_transactions"]
    / payment_features["total_transactions"]
)

payment_features["bank_transfer_ratio"] = (
    payment_features["bank_transfer_transactions"]
    / payment_features["total_transactions"]
)

payment_features["debit_card_ratio"] = (
    payment_features["debit_card_transactions"]
    / payment_features["total_transactions"]
)


# ============================================================
# MERGE ALL FEATURES
# ============================================================

features = income_features.merge(
    income_source_features,
    on="user_id",
    how="left"
)

features = features.merge(
    expense_features,
    on="user_id",
    how="left"
)

features = features.merge(
    payment_features,
    on="user_id",
    how="left"
)

features = features.merge(
    monthly_features,
    on="user_id",
    how="left"
)


# ============================================================
# DATA CLEANING
# ============================================================

numeric_columns = features.select_dtypes(
    include=np.number
).columns

features[numeric_columns] = (
    features[numeric_columns]
    .replace([np.inf, -np.inf], np.nan)
    .fillna(0)
)


# ============================================================
# SAVE FEATURE DATASET
# ============================================================

output_file = (
    OUTPUT_DIR
    / "finbridge_user_features.csv"
)

features.to_csv(
    output_file,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n========== FEATURE ENGINEERING COMPLETE ==========")

print("\nGenerated ML features:")

for column in features.columns:
    print("-", column)

print("\nFeature dataset shape:")
print(features.shape)

print("\nMissing values:")
print(features.isnull().sum())

print("\nDuplicate rows:")
print(features.duplicated().sum())

print("\nFeature dataset saved to:")
print(output_file)