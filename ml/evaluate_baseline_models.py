import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)


# ============================================================
# FINBRIDGE AI - M3 DAY 11
# MODEL EVALUATION + EXPLAINABILITY
# ============================================================


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = (
    BASE_DIR
    / "data"
    / "splits"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "evaluation"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


TRAIN_FILE = (
    DATA_DIR / "train.csv"
)

VALIDATION_FILE = (
    DATA_DIR / "validation.csv"
)

MODEL_RESULTS_FILE = (
    BASE_DIR
    / "data"
    / "models"
    / "baseline_model_results.csv"
)

FEATURE_IMPORTANCE_FILE = (
    OUTPUT_DIR
    / "random_forest_feature_importance.csv"
)

LOGISTIC_COEFFICIENT_FILE = (
    OUTPUT_DIR
    / "logistic_regression_coefficients.csv"
)

CONFUSION_MATRIX_RF_FILE = (
    OUTPUT_DIR
    / "random_forest_confusion_matrix.csv"
)

CONFUSION_MATRIX_LR_FILE = (
    OUTPUT_DIR
    / "logistic_regression_confusion_matrix.csv"
)

CLASSIFICATION_REPORT_FILE = (
    OUTPUT_DIR
    / "classification_reports.txt"
)

ERROR_ANALYSIS_FILE = (
    OUTPUT_DIR
    / "validation_prediction_errors.csv"
)


# ============================================================
# 2. LOAD DATA
# ============================================================

print("Loading training and validation datasets...")

train_df = pd.read_csv(
    TRAIN_FILE
)

validation_df = pd.read_csv(
    VALIDATION_FILE
)

print(
    "Training shape:",
    train_df.shape
)

print(
    "Validation shape:",
    validation_df.shape
)


# ============================================================
# 3. TARGET
# ============================================================

TARGET_COLUMN = (
    "financial_behavior_class"
)


# ============================================================
# 4. SEPARATE FEATURES AND TARGET
# ============================================================

X_train = train_df.drop(
    columns=[
        TARGET_COLUMN
    ]
)

y_train = train_df[
    TARGET_COLUMN
]

X_validation = validation_df.drop(
    columns=[
        TARGET_COLUMN
    ]
)

y_validation = validation_df[
    TARGET_COLUMN
]


# ============================================================
# 5. VERIFY FEATURES
# ============================================================

print(
    "\n========== FEATURE VERIFICATION =========="
)

print(
    "Training features:",
    X_train.shape[1]
)

print(
    "Validation features:",
    X_validation.shape[1]
)

print(
    "Features match:",
    list(X_train.columns)
    == list(X_validation.columns)
)


# ============================================================
# 6. SCALE DATA FOR LOGISTIC REGRESSION
# ============================================================

print(
    "\n========== SCALING =========="
)

scaler = StandardScaler()

X_train_scaled = (
    scaler.fit_transform(
        X_train
    )
)

X_validation_scaled = (
    scaler.transform(
        X_validation
    )
)


# ============================================================
# 7. TRAIN MODELS AGAIN
# ============================================================
#
# We recreate the same models from Day 10.
#
# The purpose is to generate predictions and
# explainability information.
# ============================================================

print(
    "\n========== TRAINING MODELS =========="
)

logistic_model = (
    LogisticRegression(
        max_iter=2000,
        random_state=42
    )
)

random_forest_model = (
    RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        n_jobs=-1
    )
)


logistic_model.fit(
    X_train_scaled,
    y_train
)

random_forest_model.fit(
    X_train,
    y_train
)


# ============================================================
# 8. GENERATE VALIDATION PREDICTIONS
# ============================================================

print(
    "\n========== GENERATING PREDICTIONS =========="
)

logistic_predictions = (
    logistic_model.predict(
        X_validation_scaled
    )
)

random_forest_predictions = (
    random_forest_model.predict(
        X_validation
    )
)


# ============================================================
# 9. MODEL EVALUATION
# ============================================================

print(
    "\n========== MODEL EVALUATION =========="
)


def calculate_metrics(
    model_name,
    y_true,
    predictions
):

    accuracy = accuracy_score(
        y_true,
        predictions
    )

    precision = precision_score(
        y_true,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y_true,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y_true,
        predictions,
        average="weighted",
        zero_division=0
    )

    print(
        f"\n{model_name}"
    )

    print(
        f"Accuracy:  {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall:    {recall:.4f}"
    )

    print(
        f"F1 Score:  {f1:.4f}"
    )

    return {
        "model": model_name,
        "accuracy": accuracy,
        "precision_weighted": precision,
        "recall_weighted": recall,
        "f1_weighted": f1
    }


logistic_metrics = calculate_metrics(
    "Logistic Regression",
    y_validation,
    logistic_predictions
)

random_forest_metrics = calculate_metrics(
    "Random Forest",
    y_validation,
    random_forest_predictions
)


# ============================================================
# 10. CONFUSION MATRICES
# ============================================================

print(
    "\n========== CONFUSION MATRICES =========="
)

CLASS_LABELS = [
    "HIGHLY_VARIABLE",
    "MODERATELY_VARIABLE",
    "STABLE"
]


rf_cm = confusion_matrix(
    y_validation,
    random_forest_predictions,
    labels=CLASS_LABELS
)

lr_cm = confusion_matrix(
    y_validation,
    logistic_predictions,
    labels=CLASS_LABELS
)


rf_cm_df = pd.DataFrame(
    rf_cm,
    index=CLASS_LABELS,
    columns=CLASS_LABELS
)

lr_cm_df = pd.DataFrame(
    lr_cm,
    index=CLASS_LABELS,
    columns=CLASS_LABELS
)


rf_cm_df.to_csv(
    CONFUSION_MATRIX_RF_FILE
)

lr_cm_df.to_csv(
    CONFUSION_MATRIX_LR_FILE
)


print(
    "\nRandom Forest confusion matrix:"
)

print(
    rf_cm_df
)


print(
    "\nLogistic Regression confusion matrix:"
)

print(
    lr_cm_df
)


# ============================================================
# 11. CLASSIFICATION REPORTS
# ============================================================

print(
    "\n========== CLASSIFICATION REPORTS =========="
)

rf_report = classification_report(
    y_validation,
    random_forest_predictions,
    labels=CLASS_LABELS,
    zero_division=0
)

lr_report = classification_report(
    y_validation,
    logistic_predictions,
    labels=CLASS_LABELS,
    zero_division=0
)


print(
    "\nRANDOM FOREST:"
)

print(
    rf_report
)


print(
    "\nLOGISTIC REGRESSION:"
)

print(
    lr_report
)


with open(
    CLASSIFICATION_REPORT_FILE,
    "w",
    encoding="utf-8"
) as file:

    file.write(
        "RANDOM FOREST\n"
    )

    file.write(
        rf_report
    )

    file.write(
        "\n\nLOGISTIC REGRESSION\n"
    )

    file.write(
        lr_report
    )


# ============================================================
# 12. RANDOM FOREST FEATURE IMPORTANCE
# ============================================================

print(
    "\n========== RANDOM FOREST FEATURE IMPORTANCE =========="
)

rf_importance = pd.DataFrame(
    {
        "feature": X_train.columns,
        "importance":
            random_forest_model
            .feature_importances_
    }
)

rf_importance = (
    rf_importance
    .sort_values(
        by="importance",
        ascending=False
    )
    .reset_index(drop=True)
)

rf_importance[
    "importance"
] = rf_importance[
    "importance"
].round(6)


rf_importance.to_csv(
    FEATURE_IMPORTANCE_FILE,
    index=False
)


print(
    "\nTop 15 Random Forest features:"
)

print(
    rf_importance
    .head(15)
    .to_string(index=False)
)


# ============================================================
# 13. LOGISTIC REGRESSION COEFFICIENTS
# ============================================================

print(
    "\n========== LOGISTIC REGRESSION COEFFICIENTS =========="
)

coefficient_rows = []


for class_index, class_name in enumerate(
    logistic_model.classes_
):

    coefficients = (
        logistic_model
        .coef_[class_index]
    )

    for feature, coefficient in zip(
        X_train.columns,
        coefficients
    ):

        coefficient_rows.append(
            {
                "class":
                    class_name,
                "feature":
                    feature,
                "coefficient":
                    coefficient,
                "absolute_coefficient":
                    abs(coefficient)
            }
        )


logistic_coefficients = pd.DataFrame(
    coefficient_rows
)

logistic_coefficients = (
    logistic_coefficients
    .sort_values(
        by=[
            "class",
            "absolute_coefficient"
        ],
        ascending=[
            True,
            False
        ]
    )
)


logistic_coefficients[
    "coefficient"
] = logistic_coefficients[
    "coefficient"
].round(6)

logistic_coefficients[
    "absolute_coefficient"
] = logistic_coefficients[
    "absolute_coefficient"
].round(6)


logistic_coefficients.to_csv(
    LOGISTIC_COEFFICIENT_FILE,
    index=False
)


print(
    "\nTop Logistic Regression coefficients:"
)

print(
    logistic_coefficients
    .head(15)
    .to_string(index=False)
)


# ============================================================
# 14. VALIDATION ERROR ANALYSIS
# ============================================================

print(
    "\n========== ERROR ANALYSIS =========="
)

error_analysis = validation_df.copy()

error_analysis[
    "random_forest_prediction"
] = random_forest_predictions

error_analysis[
    "logistic_regression_prediction"
] = logistic_predictions

error_analysis[
    "random_forest_correct"
] = (
    error_analysis[
        TARGET_COLUMN
    ]
    ==
    error_analysis[
        "random_forest_prediction"
    ]
)

error_analysis[
    "logistic_regression_correct"
] = (
    error_analysis[
        TARGET_COLUMN
    ]
    ==
    error_analysis[
        "logistic_regression_prediction"
    ]
)


error_analysis[
    "random_forest_error"
] = (
    ~error_analysis[
        "random_forest_correct"
    ]
)

error_analysis[
    "logistic_regression_error"
] = (
    ~error_analysis[
        "logistic_regression_correct"
    ]
)


error_analysis.to_csv(
    ERROR_ANALYSIS_FILE,
    index=False
)


print(
    "Random Forest errors:",
    (
        ~error_analysis[
            "random_forest_correct"
        ]
    ).sum()
)

print(
    "Logistic Regression errors:",
    (
        ~error_analysis[
            "logistic_regression_correct"
        ]
    ).sum()
)


# ============================================================
# 15. MODEL COMPARISON
# ============================================================

comparison = pd.DataFrame(
    [
        logistic_metrics,
        random_forest_metrics
    ]
)

comparison[
    "accuracy"
] = comparison[
    "accuracy"
].round(4)

comparison[
    "precision_weighted"
] = comparison[
    "precision_weighted"
].round(4)

comparison[
    "recall_weighted"
] = comparison[
    "recall_weighted"
].round(4)

comparison[
    "f1_weighted"
] = comparison[
    "f1_weighted"
].round(4)


comparison = (
    comparison
    .sort_values(
        by="f1_weighted",
        ascending=False
    )
    .reset_index(drop=True)
)


print(
    "\n========== FINAL VALIDATION COMPARISON =========="
)

print(
    comparison.to_string(
        index=False
    )
)


# ============================================================
# 16. FINAL STATUS
# ============================================================

print(
    "\n========== M3 DAY 11 COMPLETE =========="
)

print(
    "Baseline models evaluated."
)

print(
    "Confusion matrices generated."
)

print(
    "Feature importance generated."
)

print(
    "Logistic regression coefficients generated."
)

print(
    "Validation errors recorded."
)

print(
    "Test dataset was NOT used."
)

print(
    "Explainability analysis is ready."
)