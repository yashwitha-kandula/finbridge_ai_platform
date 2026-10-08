import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

SPLIT_DIR = BASE_DIR / "data" / "splits"
OUTPUT_DIR = BASE_DIR / "data" / "audit"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("FINBRIDGE AI - ML DATASET AUDIT")
print("=" * 60)

train = pd.read_csv(SPLIT_DIR / "train.csv")
validation = pd.read_csv(SPLIT_DIR / "validation.csv")
test = pd.read_csv(SPLIT_DIR / "test.csv")

datasets = {
    "train": train,
    "validation": validation,
    "test": test
}


# ============================================================
# BASIC INFORMATION
# ============================================================

print("\nDATASET SHAPES")

for name, data in datasets.items():
    print(f"{name:<12}: {data.shape}")


# ============================================================
# TARGET
# ============================================================

TARGET = "financial_behavior_class"

print("\nTARGET DISTRIBUTION")

for name, data in datasets.items():
    print(f"\n{name.upper()}")

    if TARGET in data.columns:
        print(data[TARGET].value_counts())
    else:
        print("TARGET COLUMN MISSING")


# ============================================================
# MISSING VALUES
# ============================================================

print("\nMISSING VALUES")

for name, data in datasets.items():

    missing = int(data.isna().sum().sum())

    print(f"{name:<12}: {missing}")


# ============================================================
# DUPLICATES
# ============================================================

print("\nDUPLICATE ROWS")

for name, data in datasets.items():

    duplicates = int(data.duplicated().sum())

    print(f"{name:<12}: {duplicates}")


# ============================================================
# NUMERIC VALIDATION
# ============================================================

print("\nNON-NUMERIC MODEL FEATURES")

for name, data in datasets.items():

    features = data.drop(columns=[TARGET], errors="ignore")

    non_numeric = features.select_dtypes(
        exclude=np.number
    ).columns.tolist()

    print(f"\n{name.upper()}")

    if non_numeric:
        print(non_numeric)
    else:
        print("None")


# ============================================================
# INFINITE VALUES
# ============================================================

print("\nINFINITE VALUES")

for name, data in datasets.items():

    numeric = data.select_dtypes(include=np.number)

    infinite_count = int(
        np.isinf(numeric).sum().sum()
    )

    print(f"{name:<12}: {infinite_count}")


# ============================================================
# RATIO VALIDATION
# ============================================================

ratio_features = [
    "cash_transaction_ratio",
    "upi_transaction_ratio",
    "bank_transfer_ratio",
    "debit_card_ratio",
    "average_monthly_savings_ratio",
    "average_monthly_expense_to_income_ratio",
    "average_monthly_recurring_ratio"
]

print("\nRATIO RANGE CHECK")

for name, data in datasets.items():

    print(f"\n{name.upper()}")

    for feature in ratio_features:

        if feature not in data.columns:
            continue

        minimum = data[feature].min()
        maximum = data[feature].max()

        print(
            f"{feature:<45} "
            f"min={minimum:.4f} "
            f"max={maximum:.4f}"
        )


# ============================================================
# FEATURE CONSISTENCY
# ============================================================

print("\nFEATURE CONSISTENCY")

train_features = set(
    train.drop(columns=[TARGET], errors="ignore").columns
)

validation_features = set(
    validation.drop(columns=[TARGET], errors="ignore").columns
)

test_features = set(
    test.drop(columns=[TARGET], errors="ignore").columns
)

print(
    "Train == Validation:",
    train_features == validation_features
)

print(
    "Train == Test:",
    train_features == test_features
)

print(
    "Validation == Test:",
    validation_features == test_features
)


# ============================================================
# USER ID CHECK
# ============================================================

print("\nUSER ID CHECK")

for name, data in datasets.items():

    if "user_id" in data.columns:
        print(
            f"{name:<12}: user_id PRESENT"
        )
    else:
        print(
            f"{name:<12}: user_id NOT PRESENT"
        )


# ============================================================
# LEAKAGE CHECK
# ============================================================

LEAKAGE_FEATURES = [
    "income_coefficient_variation"
]

print("\nLEAKAGE CHECK")

for name, data in datasets.items():

    found = [
        feature
        for feature in LEAKAGE_FEATURES
        if feature in data.columns
    ]

    if found:
        print(
            f"{name:<12}: LEAKAGE FOUND -> {found}"
        )
    else:
        print(
            f"{name:<12}: No known leakage features"
        )


# ============================================================
# FEATURE COUNT
# ============================================================

print("\nMODEL FEATURE COUNT")

for name, data in datasets.items():

    feature_count = len(
        data.drop(columns=[TARGET], errors="ignore").columns
    )

    print(
        f"{name:<12}: {feature_count}"
    )


# ============================================================
# SAVE AUDIT REPORT
# ============================================================

audit_rows = []

for name, data in datasets.items():

    numeric = data.select_dtypes(include=np.number)

    audit_rows.append({
        "dataset": name,
        "rows": len(data),
        "columns": len(data.columns),
        "missing_values": int(data.isna().sum().sum()),
        "duplicate_rows": int(data.duplicated().sum()),
        "infinite_values": int(
            np.isinf(numeric).sum().sum()
        ),
        "model_features": len(
            data.drop(
                columns=[TARGET],
                errors="ignore"
            ).columns
        ),
        "target_present": TARGET in data.columns,
        "user_id_present": "user_id" in data.columns,
        "leakage_feature_present": any(
            feature in data.columns
            for feature in LEAKAGE_FEATURES
        )
    })


audit_df = pd.DataFrame(audit_rows)

output_file = (
    OUTPUT_DIR /
    "ml_dataset_audit.csv"
)

audit_df.to_csv(
    output_file,
    index=False
)


# ============================================================
# FINAL RESULT
# ============================================================

print("\n" + "=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)

print(f"Report saved to: {output_file}")