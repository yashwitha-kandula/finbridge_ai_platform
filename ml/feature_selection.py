import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# FINBRIDGE AI - M3 DAY 7
# FEATURE SELECTION & ML DATASET PREPARATION
# ============================================================


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "finbridge_user_features.csv"
)

ML_DATA_DIR = (
    BASE_DIR
    / "data"
    / "ml_ready"
)

ML_DATA_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# 2. LOAD DATASET
# ============================================================

print("Loading feature dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Rows: {len(df):,}")
print(f"Columns: {len(df.columns)}")


# ============================================================
# 3. IDENTIFY FEATURES
# ============================================================

id_column = "user_id"

feature_columns = [
    column
    for column in df.columns
    if column != id_column
]

numeric_features = (
    df[feature_columns]
    .select_dtypes(include=np.number)
    .columns
    .tolist()
)

print("\n========== FEATURE INFORMATION ==========")

print(
    "Total columns:",
    len(df.columns)
)

print(
    "ID column:",
    id_column
)

print(
    "Total ML candidate features:",
    len(feature_columns)
)

print(
    "Numeric features:",
    len(numeric_features)
)


# ============================================================
# 4. DATA QUALITY CHECK
# ============================================================

print("\n========== DATA QUALITY ==========")

missing_values = (
    df[feature_columns]
    .isnull()
    .sum()
    .sum()
)

duplicate_rows = df.duplicated().sum()

print(
    "Total missing values:",
    missing_values
)

print(
    "Duplicate rows:",
    duplicate_rows
)


# ============================================================
# 5. ZERO-VARIANCE FEATURE DETECTION
# ============================================================

print("\n========== VARIANCE ANALYSIS ==========")

zero_variance_features = []

for column in numeric_features:

    unique_count = df[column].nunique()

    if unique_count <= 1:

        zero_variance_features.append(
            column
        )


if zero_variance_features:

    print(
        "Zero-variance features:",
        zero_variance_features
    )

else:

    print(
        "Zero-variance features: None"
    )


# ============================================================
# 6. CORRELATION MATRIX
# ============================================================

print("\n========== CORRELATION ANALYSIS ==========")

correlation_matrix = (
    df[numeric_features]
    .corr()
)

correlation_file = (
    ML_DATA_DIR
    / "feature_correlation_matrix.csv"
)

correlation_matrix.to_csv(
    correlation_file
)

print(
    "Correlation matrix saved to:"
)

print(correlation_file)


# ============================================================
# 7. HIGH CORRELATION ANALYSIS
# ============================================================

correlation_threshold = 0.90

high_correlation_pairs = []

for i in range(
    len(numeric_features)
):

    for j in range(
        i + 1,
        len(numeric_features)
    ):

        feature_a = numeric_features[i]

        feature_b = numeric_features[j]

        correlation_value = (
            correlation_matrix.loc[
                feature_a,
                feature_b
            ]
        )

        if (
            abs(correlation_value)
            >= correlation_threshold
        ):

            high_correlation_pairs.append(
                {
                    "feature_1": feature_a,
                    "feature_2": feature_b,
                    "correlation": correlation_value
                }
            )


high_corr_df = pd.DataFrame(
    high_correlation_pairs
)

high_corr_file = (
    ML_DATA_DIR
    / "high_correlation_pairs.csv"
)

high_corr_df.to_csv(
    high_corr_file,
    index=False
)

print(
    "Highly correlated feature pairs:",
    len(high_corr_df)
)

print(
    "Saved to:"
)

print(high_corr_file)


if len(high_corr_df) > 0:

    print(
        "\nHighly correlated pairs:"
    )

    print(
        high_corr_df.to_string(
            index=False
        )
    )


# ============================================================
# 8. DOMAIN-BASED FEATURE SELECTION
# ============================================================
#
# IMPORTANT:
# We keep the original 36-feature dataset unchanged.
#
# active_month_count is intentionally excluded because
# it has zero variance in the current synthetic dataset.
#
# We are NOT automatically deleting every highly correlated
# feature because different future FinBridge models may need
# different feature representations.
# ============================================================

selected_features = [

    # --------------------------------------------------------
    # INCOME BEHAVIOR
    # --------------------------------------------------------

    "total_income",
    "average_income",
    "median_income",
    "income_std",
    "minimum_income",
    "maximum_income",
    "income_transaction_count",
    "income_coefficient_variation",

    # --------------------------------------------------------
    # INCOME SOURCES
    # --------------------------------------------------------

    "income_source_count",
    "multiple_income_flag",

    # --------------------------------------------------------
    # EXPENSE BEHAVIOR
    # --------------------------------------------------------

    "total_expense",
    "average_expense",
    "median_expense",
    "expense_std",
    "minimum_expense",
    "maximum_expense",
    "expense_transaction_count",

    # --------------------------------------------------------
    # TRANSACTION BEHAVIOR
    # --------------------------------------------------------

    "total_transactions",

    # --------------------------------------------------------
    # PAYMENT METHOD BEHAVIOR
    # --------------------------------------------------------

    "cash_transaction_ratio",
    "upi_transaction_ratio",
    "bank_transfer_ratio",
    "debit_card_ratio",

    # --------------------------------------------------------
    # MONTHLY CASH FLOW
    # --------------------------------------------------------

    "average_monthly_income",
    "average_monthly_expense",
    "average_monthly_net_cash_flow",
    "average_monthly_savings_ratio",
    "average_monthly_expense_to_income_ratio",
    "average_monthly_recurring_ratio",

    # --------------------------------------------------------
    # MONTHLY STABILITY
    # --------------------------------------------------------

    "monthly_income_std",
    "monthly_expense_std"

]


# ============================================================
# 9. REMOVE ANY ZERO-VARIANCE FEATURES AUTOMATICALLY
# ============================================================
#
# This is an additional safety check.
#
# Even if a zero-variance feature is accidentally added to
# selected_features later, this section removes it.
# ============================================================

selected_features = [
    feature
    for feature in selected_features
    if feature not in zero_variance_features
]


# ============================================================
# 10. VERIFY SELECTED FEATURES EXIST
# ============================================================

invalid_features = [
    feature
    for feature in selected_features
    if feature not in df.columns
]

if invalid_features:

    print(
        "\nERROR: These selected features do not exist:"
    )

    print(invalid_features)

    raise ValueError(
        "Invalid feature names detected."
    )


# ============================================================
# 11. DISPLAY SELECTED FEATURES
# ============================================================

print(
    "\n========== SELECTED FEATURES =========="
)

print(
    "Selected ML features:",
    len(selected_features)
)

for index, feature in enumerate(
    selected_features,
    start=1
):

    print(
        f"{index:02d}. {feature}"
    )


# ============================================================
# 12. CREATE ML-READY DATASET
# ============================================================

ml_ready_columns = (
    [id_column]
    + selected_features
)

ml_ready_df = (
    df[ml_ready_columns]
    .copy()
)

ml_ready_file = (
    ML_DATA_DIR
    / "finbridge_ml_features.csv"
)

ml_ready_df.to_csv(
    ml_ready_file,
    index=False
)

print(
    "\nML-ready dataset saved to:"
)

print(ml_ready_file)


# ============================================================
# 13. FEATURE SELECTION REPORT
# ============================================================

report_rows = []

for feature in feature_columns:

    report_rows.append(
        {
            "feature": feature,
            "selected_for_ml": (
                feature
                in selected_features
            ),
            "zero_variance": (
                feature
                in zero_variance_features
            ),
            "data_type": str(
                df[feature].dtype
            ),
            "unique_values": (
                df[feature].nunique()
            ),
            "missing_values": (
                df[feature].isnull().sum()
            )
        }
    )


report_df = pd.DataFrame(
    report_rows
)

report_file = (
    ML_DATA_DIR
    / "feature_selection_report.csv"
)

report_df.to_csv(
    report_file,
    index=False
)

print(
    "Feature selection report saved to:"
)

print(report_file)


# ============================================================
# 14. FINAL VERIFICATION
# ============================================================

print(
    "\n========== FINAL VERIFICATION =========="
)

print(
    "Original dataset shape:",
    df.shape
)

print(
    "ML-ready dataset shape:",
    ml_ready_df.shape
)

print(
    "Selected ML features:",
    len(selected_features)
)

print(
    "Missing values in ML dataset:",
    ml_ready_df.isnull().sum().sum()
)

print(
    "Duplicate rows in ML dataset:",
    ml_ready_df.duplicated().sum()
)

print(
    "active_month_count included:",
    "active_month_count"
    in selected_features
)


# ============================================================
# 15. FINAL STATUS
# ============================================================

print(
    "\n========== M3 DAY 7 COMPLETE =========="
)

print(
    "Original 36-feature dataset remains unchanged."
)

print(
    "Zero-variance features excluded from ML dataset."
)

print(
    f"ML-ready dataset contains "
    f"{len(selected_features)} features."
)

print(
    "Ready for the next ML preparation stage."
)