import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "finbridge_user_features.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "eda"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD FEATURE DATASET
# ============================================================

print("Loading feature dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Rows: {len(df):,}")
print(f"Columns: {len(df.columns)}")


# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n========== BASIC INFORMATION ==========")

print("\nShape:")
print(df.shape)

print("\nData types:")
print(df.dtypes)

print("\nMissing values:")
print(df.isnull().sum().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())


# ============================================================
# DESCRIPTIVE STATISTICS
# ============================================================

print("\n========== DESCRIPTIVE STATISTICS ==========")

numeric_df = df.select_dtypes(include=np.number)

print(numeric_df.describe().T)


# Save descriptive statistics
statistics_file = OUTPUT_DIR / "feature_statistics.csv"

numeric_df.describe().T.to_csv(statistics_file)

print(f"\nStatistics saved to:")
print(statistics_file)


# ============================================================
# INCOME ANALYSIS
# ============================================================

print("\n========== INCOME ANALYSIS ==========")

print(
    "Average user income:",
    df["average_income"].mean()
)

print(
    "Median user income:",
    df["average_income"].median()
)

print(
    "Minimum average income:",
    df["average_income"].min()
)

print(
    "Maximum average income:",
    df["average_income"].max()
)

print(
    "Average income variability (CV):",
    df["income_coefficient_variation"].mean()
)


# ============================================================
# EXPENSE ANALYSIS
# ============================================================

print("\n========== EXPENSE ANALYSIS ==========")

print(
    "Average user expense:",
    df["average_expense"].mean()
)

print(
    "Median user expense:",
    df["average_expense"].median()
)

print(
    "Minimum average expense:",
    df["average_expense"].min()
)

print(
    "Maximum average expense:",
    df["average_expense"].max()
)


# ============================================================
# CASH-FLOW ANALYSIS
# ============================================================

print("\n========== CASH-FLOW ANALYSIS ==========")

print(
    "Average monthly income:",
    df["average_monthly_income"].mean()
)

print(
    "Average monthly expense:",
    df["average_monthly_expense"].mean()
)

print(
    "Average monthly net cash flow:",
    df["average_monthly_net_cash_flow"].mean()
)

print(
    "Average monthly savings ratio:",
    df["average_monthly_savings_ratio"].mean()
)

print(
    "Average expense-to-income ratio:",
    df["average_monthly_expense_to_income_ratio"].mean()
)


# ============================================================
# MULTIPLE INCOME SOURCE ANALYSIS
# ============================================================

print("\n========== INCOME SOURCE ANALYSIS ==========")

multiple_income_users = (
    df["multiple_income_flag"].sum()
)

total_users = len(df)

multiple_income_percentage = (
    multiple_income_users
    / total_users
    * 100
)

print(
    "Users with multiple income sources:",
    multiple_income_users
)

print(
    "Percentage with multiple income sources:",
    multiple_income_percentage
)


# ============================================================
# PAYMENT METHOD ANALYSIS
# ============================================================

print("\n========== PAYMENT METHOD ANALYSIS ==========")

payment_columns = [
    "cash_transaction_ratio",
    "upi_transaction_ratio",
    "bank_transfer_ratio",
    "debit_card_ratio"
]

for column in payment_columns:
    print(
        column,
        "average:",
        df[column].mean()
    )


# ============================================================
# INCOME VARIABILITY ANALYSIS
# ============================================================

print("\n========== INCOME VARIABILITY ==========")

print(
    "Average income standard deviation:",
    df["income_std"].mean()
)

print(
    "Average monthly income standard deviation:",
    df["monthly_income_std"].mean()
)

print(
    "Highest income coefficient of variation:",
    df["income_coefficient_variation"].max()
)


# ============================================================
# CASH-FLOW STABILITY
# ============================================================

print("\n========== CASH-FLOW STABILITY ==========")

print(
    "Average monthly income variability:",
    df["monthly_income_std"].mean()
)

print(
    "Average monthly expense variability:",
    df["monthly_expense_std"].mean()
)

print(
    "Average active months:",
    df["active_month_count"].mean()
)


# ============================================================
# CORRELATION ANALYSIS
# ============================================================

print("\n========== CORRELATION ANALYSIS ==========")

correlation = numeric_df.corr()

correlation_file = (
    OUTPUT_DIR
    / "feature_correlations.csv"
)

correlation.to_csv(correlation_file)

print(
    f"Correlation matrix saved to:\n{correlation_file}"
)


# ============================================================
# PLOT 1 — AVERAGE INCOME DISTRIBUTION
# ============================================================

plt.figure(figsize=(10, 6))

plt.hist(
    df["average_income"],
    bins=30
)

plt.xlabel("Average Income (INR)")
plt.ylabel("Number of Users")
plt.title("Distribution of Average User Income")

plt.tight_layout()

income_plot = (
    OUTPUT_DIR
    / "average_income_distribution.png"
)

plt.savefig(income_plot)

plt.close()

print(
    f"Saved:\n{income_plot}"
)


# ============================================================
# PLOT 2 — AVERAGE EXPENSE DISTRIBUTION
# ============================================================

plt.figure(figsize=(10, 6))

plt.hist(
    df["average_expense"],
    bins=30
)

plt.xlabel("Average Expense (INR)")
plt.ylabel("Number of Users")
plt.title("Distribution of Average User Expense")

plt.tight_layout()

expense_plot = (
    OUTPUT_DIR
    / "average_expense_distribution.png"
)

plt.savefig(expense_plot)

plt.close()

print(
    f"Saved:\n{expense_plot}"
)


# ============================================================
# PLOT 3 — INCOME VARIABILITY
# ============================================================

plt.figure(figsize=(10, 6))

plt.hist(
    df["income_coefficient_variation"],
    bins=30
)

plt.xlabel("Income Coefficient of Variation")
plt.ylabel("Number of Users")
plt.title("Distribution of Income Variability")

plt.tight_layout()

variability_plot = (
    OUTPUT_DIR
    / "income_variability_distribution.png"
)

plt.savefig(variability_plot)

plt.close()

print(
    f"Saved:\n{variability_plot}"
)


# ============================================================
# PLOT 4 — SAVINGS RATIO
# ============================================================

plt.figure(figsize=(10, 6))

plt.hist(
    df["average_monthly_savings_ratio"],
    bins=30
)

plt.xlabel("Average Monthly Savings Ratio")
plt.ylabel("Number of Users")
plt.title("Distribution of Monthly Savings Ratio")

plt.tight_layout()

savings_plot = (
    OUTPUT_DIR
    / "savings_ratio_distribution.png"
)

plt.savefig(savings_plot)

plt.close()

print(
    f"Saved:\n{savings_plot}"
)


# ============================================================
# PLOT 5 — INCOME VS EXPENSE
# ============================================================

plt.figure(figsize=(10, 6))

plt.scatter(
    df["average_monthly_income"],
    df["average_monthly_expense"],
    alpha=0.5
)

plt.xlabel("Average Monthly Income (INR)")
plt.ylabel("Average Monthly Expense (INR)")
plt.title("Monthly Income vs Monthly Expense")

plt.tight_layout()

income_expense_plot = (
    OUTPUT_DIR
    / "income_vs_expense.png"
)

plt.savefig(income_expense_plot)

plt.close()

print(
    f"Saved:\n{income_expense_plot}"
)


# ============================================================
# PLOT 6 — PAYMENT METHOD USAGE
# ============================================================

payment_means = df[payment_columns].mean()

plt.figure(figsize=(10, 6))

payment_means.plot(
    kind="bar"
)

plt.xlabel("Payment Method")
plt.ylabel("Average Transaction Ratio")
plt.title("Average Payment Method Usage")

plt.xticks(
    rotation=20
)

plt.tight_layout()

payment_plot = (
    OUTPUT_DIR
    / "payment_method_usage.png"
)

plt.savefig(payment_plot)

plt.close()

print(
    f"Saved:\n{payment_plot}"
)


# ============================================================
# FINAL MESSAGE
# ============================================================

print("\n========== EDA COMPLETE ==========")

print(
    f"All EDA outputs saved in:\n{OUTPUT_DIR}"
)