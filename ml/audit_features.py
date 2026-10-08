from pathlib import Path
import pandas as pd


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


# Change this path after identifying the 36-column dataset.
INPUT_PATH = DATA_DIR / "YOUR_36_FEATURE_DATASET.csv"

OUTPUT_DIR = DATA_DIR / "feature_audit"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Load data
# ---------------------------------------------------------

df = pd.read_csv(INPUT_PATH)

print("=" * 70)
print("FINBRIDGE AI - DAY 13 FEATURE INTEGRITY AUDIT")
print("=" * 70)

print(f"Dataset: {INPUT_PATH}")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")


# ---------------------------------------------------------
# Required columns
# ---------------------------------------------------------

required_columns = [
    "average_monthly_income",
    "average_monthly_expense",
    "average_monthly_net_cash_flow",
    "average_monthly_savings_ratio",
    "average_monthly_expense_to_income_ratio",
    "monthly_income_std",
    "monthly_expense_std"
]


missing = [
    column
    for column in required_columns
    if column not in df.columns
]


if missing:
    raise ValueError(
        f"Missing required columns: {missing}"
    )


# ---------------------------------------------------------
# Independent calculations
# ---------------------------------------------------------

df["audit_net_cash_flow"] = (
    df["average_monthly_income"]
    - df["average_monthly_expense"]
)


df["audit_savings_ratio"] = (
    df["audit_net_cash_flow"]
    / df["average_monthly_income"]
)


df["audit_expense_to_income_ratio"] = (
    df["average_monthly_expense"]
    / df["average_monthly_income"]
)


# ---------------------------------------------------------
# Differences
# ---------------------------------------------------------

df["net_cash_flow_difference"] = (
    df["average_monthly_net_cash_flow"]
    - df["audit_net_cash_flow"]
)


df["savings_ratio_difference"] = (
    df["average_monthly_savings_ratio"]
    - df["audit_savings_ratio"]
)


df["expense_ratio_difference"] = (
    df["average_monthly_expense_to_income_ratio"]
    - df["audit_expense_to_income_ratio"]
)


# ---------------------------------------------------------
# Tolerance checks
# ---------------------------------------------------------

TOLERANCE = 1e-6


df["net_cash_flow_valid"] = (
    df["net_cash_flow_difference"].abs()
    <= TOLERANCE
)


df["savings_ratio_valid"] = (
    df["savings_ratio_difference"].abs()
    <= TOLERANCE
)


df["expense_ratio_valid"] = (
    df["expense_ratio_difference"].abs()
    <= TOLERANCE
)


# ---------------------------------------------------------
# Summary
# ---------------------------------------------------------

print("\n" + "-" * 70)
print("NET CASH FLOW AUDIT")
print("-" * 70)

print(
    f"Valid rows: "
    f"{df['net_cash_flow_valid'].sum()} / {len(df)}"
)

print(
    f"Invalid rows: "
    f"{(~df['net_cash_flow_valid']).sum()} / {len(df)}"
)


print("\n" + "-" * 70)
print("SAVINGS RATIO AUDIT")
print("-" * 70)

print(
    f"Valid rows: "
    f"{df['savings_ratio_valid'].sum()} / {len(df)}"
)

print(
    f"Invalid rows: "
    f"{(~df['savings_ratio_valid']).sum()} / {len(df)}"
)


print("\n" + "-" * 70)
print("EXPENSE-TO-INCOME RATIO AUDIT")
print("-" * 70)

print(
    f"Valid rows: "
    f"{df['expense_ratio_valid'].sum()} / {len(df)}"
)

print(
    f"Invalid rows: "
    f"{(~df['expense_ratio_valid']).sum()} / {len(df)}"
)


# ---------------------------------------------------------
# Difference statistics
# ---------------------------------------------------------

print("\n" + "-" * 70)
print("DIFFERENCE STATISTICS")
print("-" * 70)

difference_columns = [
    "net_cash_flow_difference",
    "savings_ratio_difference",
    "expense_ratio_difference"
]

print(
    df[difference_columns].describe()
)


# ---------------------------------------------------------
# Save audit results
# ---------------------------------------------------------

audit_columns = [
    "average_monthly_income",
    "average_monthly_expense",
    "average_monthly_net_cash_flow",
    "audit_net_cash_flow",
    "net_cash_flow_difference",
    "average_monthly_savings_ratio",
    "audit_savings_ratio",
    "savings_ratio_difference",
    "average_monthly_expense_to_income_ratio",
    "audit_expense_to_income_ratio",
    "expense_ratio_difference",
    "net_cash_flow_valid",
    "savings_ratio_valid",
    "expense_ratio_valid"
]


audit_path = OUTPUT_DIR / "feature_integrity_results.csv"

df[audit_columns].to_csv(
    audit_path,
    index=False
)


print("\nAudit file created:")
print(audit_path)

print("\n" + "=" * 70)
print("FEATURE AUDIT COMPLETED")
print("=" * 70)