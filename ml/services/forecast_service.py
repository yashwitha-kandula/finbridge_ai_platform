"""
Forecast Service — FinBridge AI

Wraps the ExpenseForecaster for API use.
Adds confidence range and model metadata.
"""

from typing import List, Dict, Any
import numpy as np
from ml.forecasting.expense_forecaster import ExpenseForecaster


def run_forecast(
    monthly_expenses: List[float],
    months_ahead: int = 1
) -> Dict[str, Any]:
    """
    Train the forecaster on historical monthly expenses and
    predict future month(s).

    Parameters
    ----------
    monthly_expenses : list of floats
        Historical monthly expense totals, oldest first.
        Minimum 2 values required.
    months_ahead : int
        How many months into the future to forecast (1–12).

    Returns
    -------
    dict with:
        forecast        — predicted expense amount
        forecast_low    — lower bound (forecast - 1 std dev)
        forecast_high   — upper bound (forecast + 1 std dev)
        mae_estimate    — mean absolute error on training data
        input_months    — number of months used for training
        months_ahead    — months forecasted ahead
        method          — model description
        note            — interpretation guidance
    """
    forecaster = ExpenseForecaster()
    forecaster.train(monthly_expenses)

    forecast_value = forecaster.predict(months_ahead)

    # Spread of historical values -> planning range
    std_dev = float(np.std(monthly_expenses)) if len(monthly_expenses) > 1 else 0.0

    # Walk-forward backtest: for each month t >= 3, train on months < t, predict t.
    errors, pct_errors = [], []
    for t in range(2, len(monthly_expenses)):
        bt = ExpenseForecaster()
        bt.train(monthly_expenses[:t])
        pred = bt.predict(1)
        actual = monthly_expenses[t]
        errors.append(abs(actual - pred))
        if actual:
            pct_errors.append(abs(actual - pred) / actual * 100)
    mae_estimate = round(float(np.mean(errors)), 2) if errors else None
    mape_pct = round(float(np.mean(pct_errors)), 2) if pct_errors else None

    forecast_low = round(max(0.0, forecast_value - std_dev), 2)
    forecast_high = round(forecast_value + std_dev, 2)

    return {
        "forecast": forecast_value,
        "forecast_low": forecast_low,
        "forecast_high": forecast_high,
        "mae_estimate": mae_estimate,
        "mape_pct": mape_pct,
        "backtest_points": len(errors),
        "std_dev": round(std_dev, 2),
        "input_months": len(monthly_expenses),
        "months_ahead": months_ahead,
        "method": "Linear Regression on monthly expense trend",
        "note": (
            "Forecast is based on historical trend only. "
            "Actual expenses may vary based on irregular income or "
            "one-time costs. Use the range as a planning guide."
        )
    }
