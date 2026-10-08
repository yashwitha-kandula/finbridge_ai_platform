import pandas as pd
from pathlib import Path


# ---------------------------------------------------------
# 1. File path
# ---------------------------------------------------------

FILE_PATH = Path(
    "finbridge_ai_platform/ml/data/finbridge_variable_income_dataset.csv"
)

print("=" * 70)
print("FINBRIDGE AI - DATASET 3 VALIDATION")
print("=" * 70)


# ---------------------------------------------------------
# 2. Check file
# ---------------------------------------------------------

if not FILE_PATH.exists():
    print(f"ERROR: File not found: {FILE_PATH}")
    raise SystemExit(1)

print(f"\nDataset found: {FILE_PATH}")


# ---------------------------------------------------------
# 3. Load dataset
# ---------------------------------------------------------

df = pd.read_csv(FILE_PATH)

print("\nDataset loaded successfully.")


# ---------------------------------------------------------
# 4. Basic information
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("1. BASIC INFORMATION")
print("=" * 70)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

print("\nColumns:")
for column in df.columns:
    print(f"- {column}")


# ---------------------------------------------------------
# 5. Data types
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("2. DATA TYPES")
print("=" * 70)

print(df.dtypes)


# ---------------------------------------------------------
# 6. Missing values
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("3. MISSING VALUES")
print("=" * 70)

missing = df.isnull().sum()

print(missing)

if missing.sum() == 0:
    print("\nRESULT: No missing values found.")
else:
    print("\nWARNING: Missing values found.")


# ---------------------------------------------------------
# 7. Duplicate rows
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("4. DUPLICATE ROWS")
print("=" * 70)

duplicates = df.duplicated().sum()

print(f"Duplicate rows: {duplicates:,}")

if duplicates == 0:
    print("RESULT: No duplicate rows found.")
else:
    print("WARNING: Duplicate rows found.")


# ---------------------------------------------------------
# 8. Profile distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("5. PROFILE DISTRIBUTION")
print("=" * 70)

print(df["profile_type"].value_counts())


# ---------------------------------------------------------
# 9. Transaction type distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("6. TRANSACTION TYPE DISTRIBUTION")
print("=" * 70)

print(df["transaction_type"].value_counts())


# ---------------------------------------------------------
# 10. Income source distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("7. INCOME SOURCE DISTRIBUTION")
print("=" * 70)

print(df["income_source"].value_counts().head(30))


# ---------------------------------------------------------
# 11. Category distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("8. CATEGORY DISTRIBUTION")
print("=" * 70)

print(df["category"].value_counts())


# ---------------------------------------------------------
# 12. Payment method distribution
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("9. PAYMENT METHOD DISTRIBUTION")
print("=" * 70)

print(df["payment_method"].value_counts())


# ---------------------------------------------------------
# 13. Date validation
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("10. DATE RANGE")
print("=" * 70)

df["transaction_date"] = pd.to_datetime(
    df["transaction_date"],
    errors="coerce"
)

invalid_dates = df["transaction_date"].isnull().sum()

print(f"Earliest date: {df['transaction_date'].min()}")
print(f"Latest date  : {df['transaction_date'].max()}")
print(f"Invalid dates: {invalid_dates}")


# ---------------------------------------------------------
# 14. Amount validation
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("11. AMOUNT VALIDATION")
print("=" * 70)

print(f"Minimum amount : {df['amount'].min():.2f}")
print(f"Maximum amount : {df['amount'].max():.2f}")
print(f"Average amount : {df['amount'].mean():.2f}")
print(f"Median amount  : {df['amount'].median():.2f}")

negative_amounts = (df["amount"] < 0).sum()

print(f"Negative amounts: {negative_amounts:,}")


# ---------------------------------------------------------
# 15. Transaction type validation
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("12. TRANSACTION TYPE VALIDATION")
print("=" * 70)

expected_types = {
    "Income",
    "Expense",
    "Investment",
    "Loan",
    "Loan Payment",
    "Transfer"
}

actual_types = set(df["transaction_type"].dropna().unique())

print("Expected transaction types:")
print(expected_types)

print("\nActual transaction types:")
print(actual_types)

missing_types = expected_types - actual_types
unexpected_types = actual_types - expected_types

print("\nMissing expected types:", missing_types)
print("Unexpected types:", unexpected_types)


# ---------------------------------------------------------
# 16. Profile validation
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("13. PROFILE VALIDATION")
print("=" * 70)

expected_profiles = {
    "salaried",
    "daily_wage",
    "freelancer",
    "farmer",
    "small_business",
    "mixed_income"
}

actual_profiles = set(df["profile_type"].dropna().unique())

print("Expected profiles:")
print(expected_profiles)

print("\nActual profiles:")
print(actual_profiles)

print("\nMissing profiles:")
print(expected_profiles - actual_profiles)

print("\nUnexpected profiles:")
print(actual_profiles - expected_profiles)


# ---------------------------------------------------------
# 17. Recurring transaction analysis
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("14. RECURRING TRANSACTIONS")
print("=" * 70)

print(df["is_recurring"].value_counts(dropna=False))


# ---------------------------------------------------------
# 18. Income vs Expense
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("15. INCOME VS EXPENSE")
print("=" * 70)

income = df.loc[
    df["transaction_type"] == "Income",
    "amount"
].sum()

expense = df.loc[
    df["transaction_type"] == "Expense",
    "amount"
].sum()

investment = df.loc[
    df["transaction_type"] == "Investment",
    "amount"
].sum()

loan = df.loc[
    df["transaction_type"] == "Loan",
    "amount"
].sum()

loan_payment = df.loc[
    df["transaction_type"] == "Loan Payment",
    "amount"
].sum()

transfer = df.loc[
    df["transaction_type"] == "Transfer",
    "amount"
].sum()

print(f"Total Income       : ₹{income:,.2f}")
print(f"Total Expense      : ₹{expense:,.2f}")
print(f"Total Investment   : ₹{investment:,.2f}")
print(f"Total Loan         : ₹{loan:,.2f}")
print(f"Total Loan Payment : ₹{loan_payment:,.2f}")
print(f"Total Transfer     : ₹{transfer:,.2f}")


# ---------------------------------------------------------
# 19. Profile-wise transaction count
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("16. PROFILE-WISE TRANSACTION COUNT")
print("=" * 70)

profile_transactions = pd.crosstab(
    df["profile_type"],
    df["transaction_type"]
)

print(profile_transactions)


# ---------------------------------------------------------
# 20. Profile-wise income
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("17. PROFILE-WISE INCOME")
print("=" * 70)

profile_income = (
    df[df["transaction_type"] == "Income"]
    .groupby("profile_type")["amount"]
    .agg(["count", "sum", "mean", "median"])
    .sort_values("sum", ascending=False)
)

print(profile_income)


# ---------------------------------------------------------
# 21. Profile-wise expense
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("18. PROFILE-WISE EXPENSE")
print("=" * 70)

profile_expense = (
    df[df["transaction_type"] == "Expense"]
    .groupby("profile_type")["amount"]
    .agg(["count", "sum", "mean", "median"])
    .sort_values("sum", ascending=False)
)

print(profile_expense)


# ---------------------------------------------------------
# 22. Final validation summary
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("19. FINAL VALIDATION SUMMARY")
print("=" * 70)

checks = {
    "Dataset loaded": True,
    "No missing values": missing.sum() == 0,
    "No duplicate rows": duplicates == 0,
    "No negative amounts": negative_amounts == 0,
    "No invalid dates": invalid_dates == 0,
    "All expected profiles present": len(
        expected_profiles - actual_profiles
    ) == 0,
    "All expected transaction types present": len(
        expected_types - actual_types
    ) == 0,
}

for check, result in checks.items():
    status = "PASS" if result else "CHECK"
    print(f"[{status}] {check}")

print("\nValidation completed.")