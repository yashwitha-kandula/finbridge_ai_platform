import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

SPLIT_DIR = BASE_DIR / "data" / "splits"
OUTPUT_DIR = BASE_DIR / "data" / "final_evaluation"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# CONSTANTS
# ============================================================

TARGET = "financial_behavior_class"

TRAIN_FILE = SPLIT_DIR / "train.csv"
VALIDATION_FILE = SPLIT_DIR / "validation.csv"
TEST_FILE = SPLIT_DIR / "test.csv"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("FINBRIDGE AI - FINAL TEST EVALUATION")
print("=" * 70)

train = pd.read_csv(TRAIN_FILE)
validation = pd.read_csv(VALIDATION_FILE)
test = pd.read_csv(TEST_FILE)

print("\nDATASET SHAPES")
print(f"Training    : {train.shape}")
print(f"Validation  : {validation.shape}")
print(f"Test        : {test.shape}")


# ============================================================
# PREPARE FEATURES
# ============================================================

X_train = train.drop(columns=[TARGET])
y_train = train[TARGET]

X_validation = validation.drop(columns=[TARGET])
y_validation = validation[TARGET]

X_test = test.drop(columns=[TARGET])
y_test = test[TARGET]


# ============================================================
# VERIFY FEATURE CONSISTENCY
# ============================================================

print("\nFEATURE CONSISTENCY")

train_features = list(X_train.columns)
validation_features = list(X_validation.columns)
test_features = list(X_test.columns)

print(
    "Train == Validation:",
    train_features == validation_features
)

print(
    "Train == Test:",
    train_features == test_features
)

print(
    "Number of model features:",
    len(train_features)
)


# ============================================================
# VERIFY TEST DATA
# ============================================================

print("\nTEST DATA VALIDATION")

print(
    "Missing values:",
    int(X_test.isna().sum().sum())
)

print(
    "Duplicate rows:",
    int(X_test.duplicated().sum())
)

print(
    "Infinite values:",
    int(
        np.isinf(
            X_test.select_dtypes(include=np.number)
        ).sum().sum()
    )
)


# ============================================================
# MODEL 1 — TUNED LOGISTIC REGRESSION
# ============================================================

logistic_model = Pipeline([
    (
        "scaler",
        StandardScaler()
    ),
    (
        "model",
        LogisticRegression(
            C=100,
            max_iter=2000,
            random_state=42
        )
    )
])


# ============================================================
# MODEL 2 — TUNED RANDOM FOREST
# ============================================================

random_forest_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_leaf=1,
    min_samples_split=2,
    random_state=42,
    n_jobs=-1
)


models = {
    "Logistic Regression": logistic_model,
    "Random Forest": random_forest_model
}


# ============================================================
# RESULTS STORAGE
# ============================================================

results = []

all_predictions = {}

class_labels = [
    "STABLE",
    "MODERATELY_VARIABLE",
    "HIGHLY_VARIABLE"
]


# ============================================================
# TRAIN + FINAL TEST EVALUATION
# ============================================================

for model_name, model in models.items():

    print("\n" + "=" * 70)
    print(model_name.upper())
    print("=" * 70)

    # IMPORTANT:
    # Train only on training data.
    # Validation and test data are NOT used for fitting.
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    all_predictions[model_name] = predictions

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    print(f"Test Accuracy : {accuracy:.4f}")
    print(f"Test Precision: {precision:.4f}")
    print(f"Test Recall   : {recall:.4f}")
    print(f"Test F1       : {f1:.4f}")

    print("\nClassification Report")

    report = classification_report(
        y_test,
        predictions,
        zero_division=0
    )

    print(report)

    print("Confusion Matrix")

    cm = confusion_matrix(
        y_test,
        predictions,
        labels=class_labels
    )

    print(cm)

    # Store overall metrics
    results.append({
        "model": model_name,
        "test_accuracy": accuracy,
        "test_precision": precision,
        "test_recall": recall,
        "test_f1": f1
    })

    # Save confusion matrix
    cm_df = pd.DataFrame(
        cm,
        index=class_labels,
        columns=class_labels
    )

    safe_name = (
        model_name
        .lower()
        .replace(" ", "_")
    )

    cm_df.to_csv(
        OUTPUT_DIR /
        f"{safe_name}_test_confusion_matrix.csv"
    )

    # Save classification report
    report_dict = classification_report(
        y_test,
        predictions,
        output_dict=True,
        zero_division=0
    )

    report_df = pd.DataFrame(report_dict).transpose()

    report_df.to_csv(
        OUTPUT_DIR /
        f"{safe_name}_test_classification_report.csv"
    )


# ============================================================
# SAVE OVERALL RESULTS
# ============================================================

results_df = pd.DataFrame(results)

results_file = (
    OUTPUT_DIR /
    "final_test_results.csv"
)

results_df.to_csv(
    results_file,
    index=False
)


# ============================================================
# SAVE TEST PREDICTIONS
# ============================================================

prediction_df = pd.DataFrame({
    "actual": y_test
})

for model_name, predictions in all_predictions.items():

    column_name = (
        model_name
        .lower()
        .replace(" ", "_")
        + "_prediction"
    )

    prediction_df[column_name] = predictions


prediction_file = (
    OUTPUT_DIR /
    "test_predictions.csv"
)

prediction_df.to_csv(
    prediction_file,
    index=False
)


# ============================================================
# MODEL COMPARISON
# ============================================================

print("\n" + "=" * 70)
print("FINAL MODEL COMPARISON")
print("=" * 70)

print(
    results_df.to_string(index=False)
)


# ============================================================
# BEST MODEL
# ============================================================

best_index = results_df[
    "test_f1"
].idxmax()

best_model = results_df.loc[
    best_index,
    "model"
]

best_f1 = results_df.loc[
    best_index,
    "test_f1"
]

print("\nBest test model:")
print(best_model)

print(
    f"Best test weighted F1: {best_f1:.4f}"
)


# ============================================================
# FINAL FILES
# ============================================================

print("\n" + "=" * 70)
print("FINAL TEST EVALUATION COMPLETE")
print("=" * 70)

print(f"Results: {results_file}")
print(f"Predictions: {prediction_file}")
print(f"Output directory: {OUTPUT_DIR}")