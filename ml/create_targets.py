import pandas as pd
from pathlib import Path


# ============================================================
# FINBRIDGE AI - M3 DAY 8
# TARGET GENERATION
# ============================================================


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "ml_ready"
    / "finbridge_ml_features.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "ml_ready"
)

OUTPUT_FILE = (
    OUTPUT_DIR
    / "finbridge_training_dataset.csv"
)

TARGET_REPORT_FILE = (
    OUTPUT_DIR
    / "target_distribution.csv"
)


# ============================================================
# 2. LOAD ML FEATURES
# ============================================================

print("Loading ML-ready feature dataset...")

df = pd.read_csv(INPUT_FILE)

print(
    f"Rows: {len(df):,}"
)

print(
    f"Columns: {len(df.columns)}"
)


# ============================================================
# 3. VERIFY REQUIRED FEATURE
# ============================================================

target_source = (
    "income_coefficient_variation"
)

if target_source not in df.columns:

    raise ValueError(
        f"Required feature '{target_source}' "
        "was not found."
    )


# ============================================================
# 4. CREATE BEHAVIOR TARGET
# ============================================================

print(
    "\n========== CREATING TARGET =========="
)

def classify_income_behavior(cv):

    if cv < 0.20:

        return "STABLE"

    elif cv < 0.40:

        return "MODERATELY_VARIABLE"

    else:

        return "HIGHLY_VARIABLE"


df["financial_behavior_class"] = (
    df[target_source]
    .apply(classify_income_behavior)
)


# ============================================================
# 5. DISPLAY TARGET DISTRIBUTION
# ============================================================

print(
    "\n========== TARGET DISTRIBUTION =========="
)

target_counts = (
    df["financial_behavior_class"]
    .value_counts()
)

target_percentages = (
    df["financial_behavior_class"]
    .value_counts(
        normalize=True
    )
    * 100
)

for class_name in target_counts.index:

    count = target_counts[class_name]

    percentage = (
        target_percentages[class_name]
    )

    print(
        f"{class_name}: "
        f"{count:,} users "
        f"({percentage:.2f}%)"
    )


# ============================================================
# 6. SAVE TARGET DISTRIBUTION REPORT
# ============================================================

target_report = pd.DataFrame(
    {
        "financial_behavior_class":
            target_counts.index,
        "user_count":
            target_counts.values,
        "percentage":
            [
                round(
                    target_percentages[class_name],
                    2
                )
                for class_name
                in target_counts.index
            ]
    }
)

target_report.to_csv(
    TARGET_REPORT_FILE,
    index=False
)

print(
    "\nTarget distribution saved to:"
)

print(TARGET_REPORT_FILE)


# ============================================================
# 7. DATA QUALITY CHECK
# ============================================================

print(
    "\n========== TARGET QUALITY CHECK =========="
)

print(
    "Missing target values:",
    df["financial_behavior_class"]
    .isnull()
    .sum()
)

print(
    "Unique target classes:",
    df["financial_behavior_class"]
    .nunique()
)


# ============================================================
# 8. SHOW SAMPLE RECORDS
# ============================================================

print(
    "\n========== SAMPLE TARGETS =========="
)

print(
    df[
        [
            "user_id",
            "income_coefficient_variation",
            "financial_behavior_class"
        ]
    ]
    .head(10)
    .to_string(index=False)
)


# ============================================================
# 9. SAVE TRAINING DATASET
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print(
    "\nTraining dataset saved to:"
)

print(OUTPUT_FILE)


# ============================================================
# 10. FINAL VERIFICATION
# ============================================================

print(
    "\n========== FINAL VERIFICATION =========="
)

print(
    "Training dataset shape:",
    df.shape
)

print(
    "Missing values:",
    df.isnull().sum().sum()
)

print(
    "Duplicate rows:",
    df.duplicated().sum()
)

print(
    "Target column:",
    "financial_behavior_class"
)

print(
    "Target classes:",
    sorted(
        df["financial_behavior_class"]
        .unique()
    )
)


# ============================================================
# FINAL STATUS
# ============================================================

print(
    "\n========== M3 DAY 8 COMPLETE =========="
)

print(
    "Target variable successfully created."
)

print(
    "Training dataset is ready for model preparation."
)