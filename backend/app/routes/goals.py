from fastapi import APIRouter
from typing import Optional
from backend.app.schemas import GoalInput
from ml.analytics.goal_analysis import analyze_goals


router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"]
)


@router.post("/analyze")
def analyze_financial_goals(goals: list[GoalInput], monthly_income: Optional[float] = None):
    """
    Analyze financial goals — progress, required monthly contribution, feasibility.
    """
    goal_data = [g.model_dump() for g in goals]
    return analyze_goals(goal_data, monthly_income)


@router.get("/demo")
def demo_goals():
    """
    Returns a demo goal analysis using pre-defined sample data.
    Used for frontend demonstration when no live DB is connected.
    """
    sample_goals = [
        {
            "name": "Emergency Fund",
            "target_amount": 100000,
            "current_amount": 30000,
            "target_date": "2027-03-31"
        },
        {
            "name": "College Fees",
            "target_amount": 200000,
            "current_amount": 20000,
            "target_date": "2026-10-01"
        },
        {
            "name": "New Laptop",
            "target_amount": 80000,
            "current_amount": 45000,
            "target_date": "2026-12-31"
        }
    ]
    return analyze_goals(sample_goals, monthly_income=30000)
