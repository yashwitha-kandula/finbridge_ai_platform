from fastapi import APIRouter
from backend.app.schemas import AnalysisRequest
from ml.services.m2_service import generate_m2_analysis


router = APIRouter(
    prefix="/api/m2",
    tags=["Analytics"]
)


@router.post("/analysis")
def m2_analysis(request: AnalysisRequest):
    """
    Run the full M2 financial analysis pipeline.

    Accepts a list of transactions and loans.
    Returns: summary, categories, spending insights,
             alerts, debt analysis, financial health, recommendations.
    """
    transactions = [t.model_dump() for t in request.transactions]
    loans = [loan.model_dump() for loan in request.loans]
    return generate_m2_analysis(transactions, loans)