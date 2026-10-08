import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split


# ============================================================
# FINBRIDGE AI - M3 DAY 9
# TRAIN / VALIDATION / TEST SPLIT
# ============================================================


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "ml_ready"
    / "finbridge_training_dataset.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "splits"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


TRAIN_FILE = (
    OUTPUT_DIR
    / "train.csv"
)

VALIDATION_FILE = (
    OUTPUT_DIR
    / "validation.csv"
)

TEST_FILE = (
    OUTPUT_DIR
    / "test.csv"
)

FEATURE_REPORT_FILE = (
    OUTPUT_DIR
    / "split_feature_report.csv"
)


# ============================================================
# 2. LOAD TRAINING DATASET
# ============================================================

print("Loading training dataset...")

df = pd.read_csv(INPUT_FILE)

print(
    f"Rows: {len(df):,}"
)

print(
    f"Columns: {len(df.columns)}"
)


# ============================================================
# 3. VERIFY TARGET
# ============================================================

TARGET_COLUMN = (
    "financial_behavior_class"
)

if TARGET_COLUMN not in df.columns:

    raise ValueError(
        f"Target column '{TARGET_COLUMN}' "
        "was not found."
    )


# ============================================================
# 4. CHECK TARGET DISTRIBUTION
# ============================================================

print(
    "\n========== ORIGINAL TARGET DISTRIBUTION =========="
)

print(
    df[TARGET_COLUMN]
    .value_counts()
)


# ============================================================
# 5. REMOVE ID AND TARGET FROM FEATURES
# ============================================================

ID_COLUMN = "user_id"

X = df.drop(
    columns=[
        ID_COLUMN,
        TARGET_COLUMN
    ]
)

y = df[TARGET_COLUMN]


# ============================================================
# 6. TARGET LEAKAGE PROTECTION
# ============================================================

LEAKAGE_FEATURE = (
    "income_coefficient_variation"
)

if LEAKAGE_FEATURE in X.columns:

    print(
        "\n========== LEAKAGE CHECK =========="
    )

    print(
        f"Removing target-derived feature: "
        f"{LEAKAGE_FEATURE}"
    )

    X = X.drop(
        columns=[
            LEAKAGE_FEATURE
        ]
    )

else:

    print(
        "\nLeakage feature already absent."
    )


# ============================================================
# 7. VERIFY FEATURES
# ============================================================

print(
    "\n========== FEATURE INFORMATION =========="
)

print(
    "Number of model features:",
    X.shape[1]
)

print(
    "Target column:",
    TARGET_COLUMN
)

print(
    "ID excluded:",
    ID_COLUMN not in X.columns
)

print(
    "Leakage feature excluded:",
    LEAKAGE_FEATURE not in X.columns
)


# ============================================================
# 8. FIRST SPLIT
# ============================================================
# 70% TRAIN
# 30% TEMPORARY
#
# random_state=42 makes the split reproducible.
# stratify=y preserves class proportions.


print(
    "\n========== TRAIN / TEMP SPLIT =========="
)

X_train, X_temp, y_train, y_temp = (
    train_test_split(
        X,
        y,
        test_size=0.30,
        random_state=42,
        stratify=y
    )
)


# ============================================================
# 9. SECOND SPLIT
# ============================================================
# TEMP = 30%
#
# Split TEMP equally:
# 15% VALIDATION
# 15% TEST


print(
    "\n========== VALIDATION / TEST SPLIT =========="
)

X_validation, X_test, y_validation, y_test = (
    train_test_split(
        X_temp,
        y_temp,
        test_size=0.50,
        random_state=42,
        stratify=y_temp
    )
)


# ============================================================
# 10. RECREATE COMPLETE DATASETS
# ============================================================

train_df = X_train.copy()

train_df[
    TARGET_COLUMN
] = y_train.values


validation_df = X_validation.copy()

validation_df[
    TARGET_COLUMN
] = y_validation.values


test_df = X_test.copy()

test_df[
    TARGET_COLUMN
] = y_test.values


# ============================================================
# 11. SAVE SPLITS
# ============================================================

train_df.to_csv(
    TRAIN_FILE,
    index=False
)

validation_df.to_csv(
    VALIDATION_FILE,
    index=False
)

test_df.to_csv(
    TEST_FILE,
    index=False
)


# ============================================================
# 12. DISPLAY SPLIT SIZES
# ============================================================

print(
    "\n========== SPLIT SIZES =========="
)

print(
    "Training:",
    train_df.shape
)

print(
    "Validation:",
    validation_df.shape
)

print(
    "Testing:",
    test_df.shape
)


# ============================================================
# 13. VERIFY TARGET DISTRIBUTION
# ============================================================

print(
    "\n========== TRAIN TARGET DISTRIBUTION =========="
)

print(
    train_df[TARGET_COLUMN]
    .value_counts()
)

print(
    "\n========== VALIDATION TARGET DISTRIBUTION =========="
)

print(
    validation_df[TARGET_COLUMN]
    .value_counts()
)

print(
    "\n========== TEST TARGET DISTRIBUTION =========="
)

print(
    test_df[TARGET_COLUMN]
    .value_counts()
)


# ============================================================
# 14. CREATE FEATURE REPORT
# ============================================================

feature_report = pd.DataFrame(
    {
        "feature": X.columns,
        "used_for_model": True
    }
)

feature_report.to_csv(
    FEATURE_REPORT_FILE,
    index=False
)


# ============================================================
# 15. FINAL QUALITY CHECKS
# ============================================================

print(
    "\n========== FINAL QUALITY CHECK =========="
)

print(
    "Training missing values:",
    train_df.isnull().sum().sum()
)

print(
    "Validation missing values:",
    validation_df.isnull().sum().sum()
)

print(
    "Test missing values:",
    test_df.isnull().sum().sum()
)

print(
    "Training duplicates:",
    train_df.duplicated().sum()
)

print(
    "Validation duplicates:",
    validation_df.duplicated().sum()
)

print(
    "Test duplicates:",
    test_df.duplicated().sum()
)


# ============================================================
# 16. FINAL FEATURE CHECK
# ============================================================

print(
    "\n========== LEAKAGE VERIFICATION =========="
)

print(
    "income_coefficient_variation in train:",
    LEAKAGE_FEATURE in train_df.columns
)

print(
    "income_coefficient_variation in validation:",
    LEAKAGE_FEATURE in validation_df.columns
)

print(
    "income_coefficient_variation in test:",
    LEAKAGE_FEATURE in test_df.columns
)


# ============================================================
# FINAL STATUS
# ============================================================

print(
    "\n========== M3 DAY 9 COMPLETE =========="
)

print(
    "Dataset split completed successfully."
)

print(
    "Target leakage protection applied."
)

print(
    "Data is ready for baseline ML training."
)