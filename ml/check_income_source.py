import pandas as pd
from pathlib import Path

FILE_PATH = Path(
    "finbridge_ai_platform/ml/data/finbridge_variable_income_dataset.csv"
)

df = pd.read_csv(FILE_PATH)

print("=" * 70)
print("INCOME SOURCE MISSING-VALUE ANALYSIS")
print("=" * 70)

print("\nMissing income_source by transaction type:")
print(
    df[df["income_source"].isna()]
    ["transaction_type"]
    .value_counts()
)

print("\n" + "=" * 70)
print("Income source completeness by transaction type")
print("=" * 70)

summary = (
    df.groupby("transaction_type")["income_source"]
    .apply(lambda x: x.notna().sum())
)

print(summary)

print("\n" + "=" * 70)
print("Missing percentage by transaction type")
print("=" * 70)

missing_percentage = (
    df.groupby("transaction_type")["income_source"]
    .apply(lambda x: x.isna().mean() * 100)
)

print(missing_percentage.round(2))

print("\n" + "=" * 70)
print("Income transactions with missing income_source")
print("=" * 70)

income_missing = df[
    (df["transaction_type"] == "Income") &
    (df["income_source"].isna())
]

print(f"Count: {len(income_missing):,}")

print("\nProfile distribution:")
print(income_missing["profile_type"].value_counts())