from pydantic import BaseModel, Field
from typing import Optional


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=50)
    description: str = Field(max_length=200)


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=200)


# ============================================================
# M2 ANALYTICS REQUEST / RESPONSE SCHEMAS
# ============================================================

class TransactionInput(BaseModel):
    date: Optional[str] = None
    type: str                       # Income / Expense / Loan / Transfer
    category: Optional[str] = None
    amount: float = Field(ge=0)
    description: Optional[str] = None


class LoanInput(BaseModel):
    loan_id: Optional[int] = None
    lender: Optional[str] = None
    principal: float = Field(ge=0)
    outstanding_balance: float = Field(ge=0)
    interest_rate: float = Field(ge=0)
    borrowed_date: Optional[str] = None


class AnalysisRequest(BaseModel):
    transactions: list[TransactionInput]
    loans: list[LoanInput] = []


# ============================================================
# FORECAST REQUEST SCHEMA
# ============================================================

class ForecastRequest(BaseModel):
    monthly_expenses: list[float] = Field(
        description="List of past monthly expense totals (oldest first)",
        min_length=2
    )
    months_ahead: int = Field(default=1, ge=1, le=12)


# ============================================================
# GOAL SCHEMAS
# ============================================================

class GoalInput(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0)
    target_date: str                   # YYYY-MM-DD
    monthly_income: Optional[float] = None


# ============================================================
# AI ASSISTANT SCHEMA
# ============================================================

class AIChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    transactions: list[TransactionInput] = []
    loans: list[LoanInput] = []
    goals: list[GoalInput] = []
    monthly_expenses_history: list[float] = []