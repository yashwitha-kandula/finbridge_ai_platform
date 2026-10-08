from pathlib import Path
import pandas as pd

from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


# ---------------------------------------------------------
# 1. Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

TRAIN_PATH = DATA_DIR / "splits" / "train.csv"
VALIDATION_PATH = DATA_DIR / "splits" / "validation.csv"

OUTPUT_DIR = DATA_DIR / "tuning"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# 2. Load data
# ---------------------------------------------------------

train_df = pd.read_csv(TRAIN_PATH)
validation_df = pd.read_csv(VALIDATION_PATH)

TARGET_COLUMN = "financial_behavior_class"

# Verify target exists
if TARGET_COLUMN not in train_df.columns:
    raise ValueError(
        f"Target column '{TARGET_COLUMN}' not found in training data."
    )

if TARGET_COLUMN not in validation_df.columns:
    raise ValueError(
        f"Target column '{TARGET_COLUMN}' not found in validation data."
    )

X_train = train_df.drop(columns=[TARGET_COLUMN])
y_train = train_df[TARGET_COLUMN]

X_validation = validation_df.drop(columns=[TARGET_COLUMN])
y_validation = validation_df[TARGET_COLUMN]

# ---------------------------------------------------------
# 3. Remove ID if present
# ---------------------------------------------------------

if "user_id" in X_train.columns:
    X_train = X_train.drop(columns=["user_id"])

if "user_id" in X_validation.columns:
    X_validation = X_validation.drop(columns=["user_id"])


# ---------------------------------------------------------
# 4. Check feature consistency
# ---------------------------------------------------------

if list(X_train.columns) != list(X_validation.columns):
    raise ValueError("Training and validation features do not match.")


print("=" * 70)
print("FINBRIDGE AI - DAY 12 MODEL TUNING")
print("=" * 70)

print(f"Training shape: {X_train.shape}")
print(f"Validation shape: {X_validation.shape}")
print(f"Number of features: {X_train.shape[1]}")

print("\nTraining target distribution:")
print(y_train.value_counts())

print("\nValidation target distribution:")
print(y_validation.value_counts())


# ---------------------------------------------------------
# 5. Cross-validation strategy
# ---------------------------------------------------------

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# ---------------------------------------------------------
# 6. Logistic Regression pipeline
# ---------------------------------------------------------

logistic_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    (
        "model",
        LogisticRegression(
            max_iter=2000,
            random_state=42
        )
    )
])


logistic_params = {
    "model__C": [0.01, 0.1, 1, 10, 100]
}


# ---------------------------------------------------------
# 7. Logistic Regression Grid Search
# ---------------------------------------------------------

print("\n" + "-" * 70)
print("TUNING LOGISTIC REGRESSION")
print("-" * 70)

logistic_search = GridSearchCV(
    estimator=logistic_pipeline,
    param_grid=logistic_params,
    scoring="f1_weighted",
    cv=cv,
    n_jobs=-1,
    return_train_score=True
)

logistic_search.fit(X_train, y_train)

print("Best parameters:")
print(logistic_search.best_params_)

print(f"Best CV weighted F1: {logistic_search.best_score_:.4f}")


# ---------------------------------------------------------
# 8. Random Forest
# ---------------------------------------------------------

rf_model = RandomForestClassifier(
    random_state=42,
    n_jobs=-1
)


rf_params = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2]
}


# ---------------------------------------------------------
# 9. Random Forest Grid Search
# ---------------------------------------------------------

print("\n" + "-" * 70)
print("TUNING RANDOM FOREST")
print("-" * 70)

rf_search = GridSearchCV(
    estimator=rf_model,
    param_grid=rf_params,
    scoring="f1_weighted",
    cv=cv,
    n_jobs=-1,
    return_train_score=True
)

rf_search.fit(X_train, y_train)

print("Best parameters:")
print(rf_search.best_params_)

print(f"Best CV weighted F1: {rf_search.best_score_:.4f}")


# ---------------------------------------------------------
# 10. Evaluate tuned models on validation set
# ---------------------------------------------------------

models = {
    "Tuned Logistic Regression": logistic_search.best_estimator_,
    "Tuned Random Forest": rf_search.best_estimator_
}


results = []


for model_name, model in models.items():

    predictions = model.predict(X_validation)

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

    results.append({
        "model": model_name,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "weighted_f1": f1
    })

    print("\n" + "-" * 70)
    print(model_name)
    print("-" * 70)

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")


# ---------------------------------------------------------
# 11. Save validation results
# ---------------------------------------------------------

results_df = pd.DataFrame(results)

results_path = OUTPUT_DIR / "tuned_validation_results.csv"

results_df.to_csv(
    results_path,
    index=False
)


# ---------------------------------------------------------
# 12. Save best parameters
# ---------------------------------------------------------

best_parameters = pd.DataFrame([
    {
        "model": "Logistic Regression",
        "best_cv_f1": logistic_search.best_score_,
        "best_parameters": str(logistic_search.best_params_)
    },
    {
        "model": "Random Forest",
        "best_cv_f1": rf_search.best_score_,
        "best_parameters": str(rf_search.best_params_)
    }
])

parameters_path = OUTPUT_DIR / "best_parameters.csv"

best_parameters.to_csv(
    parameters_path,
    index=False
)


# ---------------------------------------------------------
# 13. Save complete GridSearch results
# ---------------------------------------------------------

logistic_cv_results = pd.DataFrame(
    logistic_search.cv_results_
)

logistic_cv_results.to_csv(
    OUTPUT_DIR / "logistic_regression_grid_search.csv",
    index=False
)


rf_cv_results = pd.DataFrame(
    rf_search.cv_results_
)

rf_cv_results.to_csv(
    OUTPUT_DIR / "random_forest_grid_search.csv",
    index=False
)


# ---------------------------------------------------------
# 14. Final message
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("DAY 12 COMPLETED")
print("=" * 70)

print("\nFiles created:")
print(results_path)
print(parameters_path)
print(OUTPUT_DIR / "logistic_regression_grid_search.csv")
print(OUTPUT_DIR / "random_forest_grid_search.csv")

print("\nIMPORTANT:")
print("Test dataset was NOT used.")