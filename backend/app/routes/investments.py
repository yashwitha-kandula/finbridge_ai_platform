from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ml.services.investment_service import analyze_investment_profile


router = APIRouter(
    prefix="/api/investments",
    tags=["Investments"]
)


class InvestmentProfileInput(BaseModel):
    risk_tolerance: Literal[
        "Very Conservative", "Conservative", "Moderate", "Aggressive", "Very Aggressive"
    ] = "Moderate"
    knowledge: Literal["Beginner", "Intermediate", "Advanced", "Expert"] = "Intermediate"
    experience: str = Field("2 - 5 Years", max_length=30)
    invested_before: bool = False
    products: List[str] = Field(default_factory=list, max_length=10)
    goal: str = Field("Wealth Creation", max_length=50)
    time_horizon: str = Field("10+ Years", max_length=30)
    expected_return: str = Field("10 - 12%", max_length=20)
    purpose: Optional[str] = Field(None, max_length=200)
    monthly_investment: float = Field(0, ge=0, le=100_000_000)
    monthly_income: Optional[float] = Field(None, ge=0, le=1_000_000_000)
    mode: str = Field("SIP (Systematic Investment Plan)", max_length=60)
    start_date: Optional[str] = Field(None, max_length=20)


@router.post("/profile")
def investment_profile(profile: InvestmentProfileInput):
    """Predict the user's investment risk profile and suggested asset allocation (ML)."""
    return analyze_investment_profile(profile.model_dump())
