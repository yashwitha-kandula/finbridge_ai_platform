from fastapi import APIRouter
from backend.app.schemas import ForecastRequest
from ml.services.forecast_service import run_forecast


router = APIRouter(
    prefix="/api/forecast",
    tags=["Forecasting"]
)


@router.post("")
def forecast_expenses(request: ForecastRequest):
    """
    Forecast future monthly expenses using exponential smoothing / linear regression.

    Requires at least 2 months of historical expense data.
    Returns: forecast value, confidence range, MAE estimate, model info.
    """
    return run_forecast(request.monthly_expenses, request.months_ahead)
