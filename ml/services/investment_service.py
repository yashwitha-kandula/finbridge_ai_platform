"""
Investment profile service (M3).

Takes the answers from the "Investment Profile & Market Understanding" form
and returns:
  * a risk class (Conservative / Moderate / Aggressive ...) predicted by a
    Random Forest classifier,
  * a 0-100 risk score (for the gauge),
  * a suggested asset allocation (equity / debt / gold / cash).

The classifier is trained on a synthetic, rule-labelled profile set the first
time it is needed and cached to ml/data/models/investment_risk_model.joblib so
later requests are instant.
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict

import numpy as np

MODEL_PATH = Path(__file__).resolve().parents[1] / "data" / "models" / "investment_risk_model.joblib"

RISK_LEVELS = ["Very Conservative", "Conservative", "Moderate", "Aggressive", "Very Aggressive"]
KNOWLEDGE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]
HORIZONS = ["< 1 Year", "1 - 3 Years", "3 - 5 Years", "5 - 10 Years", "10+ Years"]
EXPERIENCE = ["No Experience", "< 2 Years", "2 - 5 Years", "5 - 10 Years", "10+ Years"]
PRODUCTS = ["Stocks / Shares", "Mutual Funds", "Bonds", "ETFs", "Derivatives", "Commodities", "Crypto"]

ALLOCATIONS = {
    "Very Conservative": {"Equity": 15, "Debt": 60, "Gold": 10, "Cash": 15},
    "Conservative": {"Equity": 30, "Debt": 50, "Gold": 10, "Cash": 10},
    "Moderate": {"Equity": 60, "Debt": 30, "Gold": 5, "Cash": 5},
    "Aggressive": {"Equity": 75, "Debt": 15, "Gold": 5, "Cash": 5},
    "Very Aggressive": {"Equity": 85, "Debt": 5, "Gold": 5, "Cash": 5},
}

_model = None


def _index(options, value, default=0) -> int:
    try:
        return options.index(value)
    except ValueError:
        return default


def _features(p: Dict) -> list:
    """Numeric feature vector: [stated_risk, knowledge, experience, horizon, n_products, risky_products, invested_before, invest_ratio]"""
    products = p.get("products") or []
    risky = sum(1 for x in products if x in ("Derivatives", "Commodities", "Crypto", "ETFs"))
    income = float(p.get("monthly_income") or 0)
    invest = float(p.get("monthly_investment") or 0)
    ratio = min(invest / income, 1.0) if income > 0 else 0.2
    return [
        _index(RISK_LEVELS, p.get("risk_tolerance"), 2),
        _index(KNOWLEDGE_LEVELS, p.get("knowledge"), 1),
        _index(EXPERIENCE, p.get("experience"), 0),
        _index(HORIZONS, p.get("time_horizon"), 3),
        len(products),
        risky,
        1 if p.get("invested_before") else 0,
        ratio,
    ]


def _rule_label(f: list) -> int:
    stated, know, exp, horizon, n_prod, risky, before, ratio = f
    score = (
        stated * 1.6 + know * 0.6 + exp * 0.5 + horizon * 0.6
        + risky * 0.25 + before * 0.3 + ratio * 1.5
    )
    # score range ~0 .. 14 -> class 0..4
    return int(np.clip(round(score / 14 * 4), 0, 4))


def _train():
    from sklearn.ensemble import RandomForestClassifier

    rng = np.random.default_rng(42)
    n = 4000
    X = np.column_stack([
        rng.integers(0, 5, n), rng.integers(0, 4, n), rng.integers(0, 5, n),
        rng.integers(0, 5, n), rng.integers(0, 8, n), rng.integers(0, 5, n),
        rng.integers(0, 2, n), rng.uniform(0, 0.6, n),
    ])
    X[:, 5] = np.minimum(X[:, 5], X[:, 4])
    y = np.array([_rule_label(list(r)) for r in X])
    model = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42).fit(X, y)
    try:
        import joblib
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, MODEL_PATH)
    except Exception:
        pass
    return model


def get_model():
    global _model
    if _model is not None:
        return _model
    try:
        import joblib
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
            return _model
    except Exception:
        pass
    _model = _train()
    return _model


def analyze_investment_profile(p: Dict) -> Dict:
    feats = _features(p)
    model = get_model()
    proba = model.predict_proba([feats])[0]
    classes = list(model.classes_)
    predicted = int(classes[int(np.argmax(proba))])
    # expected class index -> 0..100 gauge score
    expected = float(sum(c * pr for c, pr in zip(classes, proba)))
    score = round(expected / 4 * 100, 1)
    label = RISK_LEVELS[predicted]
    # Gauge groups the 5 classes into Conservative / Moderate / Aggressive bands
    return {
        "risk_profile": label,
        "risk_score": score,
        "confidence": round(float(np.max(proba)) * 100, 1),
        "allocation": ALLOCATIONS[label],
        "model": "RandomForestClassifier (8 features)",
        "summary": {
            "risk_tolerance": p.get("risk_tolerance"),
            "experience": p.get("experience"),
            "monthly_investment": p.get("monthly_investment"),
            "time_horizon": p.get("time_horizon"),
            "expected_return": p.get("expected_return"),
        },
        "tip": (
            "Start early, invest regularly, and stay diversified. "
            "Time in the market is more important than timing the market."
        ),
        "matches_stated_risk": label == p.get("risk_tolerance"),
    }
