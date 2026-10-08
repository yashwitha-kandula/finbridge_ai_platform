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
    classification_report
)


# ============================================================
# FINBRIDGE AI - M3 DAY 10
# BASELINE ML MODEL TRAINING
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
    / "models"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


TRAIN_FILE = DATA_DIR / "train.csv"

VALIDATION_FILE = (
    DATA_DIR / "validation.csv"
)

RESULT_FILE = (
    OUTPUT_DIR
    / "baseline_model_results.csv"
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
    columns=[TARGET_COLUMN]
)

y_train = train_df[
    TARGET_COLUMN
]

X_validation = validation_df.drop(
    columns=[TARGET_COLUMN]
)

y_validation = validation_df[
    TARGET_COLUMN
]


# ============================================================
# 5. VERIFY DATA
# ============================================================

print(
    "\n========== DATA VERIFICATION =========="
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
    "Training missing values:",
    X_train.isnull().sum().sum()
)

print(
    "Validation missing values:",
    X_validation.isnull().sum().sum()
)


# ============================================================
# 6. FEATURE SCALING
# ============================================================
#
# Scaling is required for Logistic Regression.
#
# IMPORTANT:
# The scaler is fitted ONLY on training data.
# Validation data is transformed using the same scaler.
#
# This prevents validation information from leaking
# into the training process.
# ============================================================

print(
    "\n========== FEATURE SCALING =========="
)

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(
    X_train
)

X_validation_scaled = (
    scaler.transform(
        X_validation
    )
)

print(
    "Training scaling complete."
)

print(
    "Validation transformation complete."
)


# ============================================================
# 7. DEFINE MODELS
# ============================================================

print(
    "\n========== DEFINING BASELINE MODELS =========="
)

models = {

    "Logistic Regression":
        LogisticRegression(
            max_iter=2000,
            random_state=42
        ),

    "Random Forest":
        RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            n_jobs=-1
        )
}


# ============================================================
# 8. TRAIN AND VALIDATE MODELS
# ============================================================

results = []


for model_name, model in models.items():

    print(
        f"\n========== {model_name.upper()} =========="
    )

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    if model_name == "Logistic Regression":

        model.fit(
            X_train_scaled,
            y_train
        )

        predictions = (
            model.predict(
                X_validation_scaled
            )
        )

    else:

        model.fit(
            X_train,
            y_train
        )

        predictions = (
            model.predict(
                X_validation
            )
        )


    # --------------------------------------------------------
    # Calculate metrics
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_validation,
        predictions
    )

    precision = precision_score(
        y_validation,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y_validation,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y_validation,
        predictions,
        average="weighted",
        zero_division=0
    )


    # --------------------------------------------------------
    # Display metrics
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # Detailed classification report
    # --------------------------------------------------------

    print(
        "\nClassification Report:"
    )

    print(
        classification_report(
            y_validation,
            predictions,
            zero_division=0
        )
    )


    # --------------------------------------------------------
    # Save results
    # --------------------------------------------------------

    results.append(
        {
            "model": model_name,
            "accuracy": round(
                accuracy,
                4
            ),
            "precision_weighted": round(
                precision,
                4
            ),
            "recall_weighted": round(
                recall,
                4
            ),
            "f1_weighted": round(
                f1,
                4
            )
        }
    )


# ============================================================
# 9. SAVE MODEL COMPARISON
# ============================================================

results_df = pd.DataFrame(
    results
)

results_df = (
    results_df
    .sort_values(
        by="f1_weighted",
        ascending=False
    )
    .reset_index(drop=True)
)

results_df.to_csv(
    RESULT_FILE,
    index=False
)


# ============================================================
# 10. DISPLAY COMPARISON
# ============================================================

print(
    "\n========== MODEL COMPARISON =========="
)

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# 11. PRELIMINARY BEST MODEL
# ============================================================

best_model = (
    results_df.iloc[0]["model"]
)

best_f1 = (
    results_df.iloc[0]["f1_weighted"]
)

print(
    "\n========== PRELIMINARY BEST MODEL =========="
)

print(
    "Model:",
    best_model
)

print(
    "Validation weighted F1:",
    best_f1
)


# ============================================================
# 12. SAVE MODEL RESULT LOCATION
# ============================================================

print(
    "\nResults saved to:"
)

print(
    RESULT_FILE
)


# ============================================================
# FINAL STATUS
# ============================================================

print(
    "\n========== M3 DAY 10 COMPLETE =========="
)

print(
    "Baseline models trained successfully."
)

print(
    "Validation performance recorded."
)

print(
    "Test dataset was NOT used."
)

print(
    "Ready for detailed model evaluation."
)