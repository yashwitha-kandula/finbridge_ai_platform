"""
Grounded AI Financial Assistant — FinBridge AI

Architecture:
    USER QUESTION
        ↓
    INTENT IDENTIFICATION (keyword/regex)
        ↓
    ROUTE TO ANALYTICS FUNCTION
        ↓
    VERIFIED FINANCIAL DATA CONTEXT
        ↓
    STRUCTURED GROUNDED RESPONSE

The assistant NEVER invents financial numbers.
Every numerical answer is derived from supplied application data.

LLM Integration Note:
    This module implements the data-grounding and context-extraction layer.
    The `_compose_response()` function currently uses templates.
    To enable LLM-based natural language generation:
    1. Configure LLM_API_KEY in .env
    2. Replace `_compose_response()` with an LLM call that receives
       the grounded_context dict and the original question.
    3. The LLM must be instructed to use ONLY the provided context —
       never invent values.
"""

import re
from typing import List, Dict, Any, Optional

from ml.analytics.financial_analytics import (
    calculate_financial_summary,
    category_analysis
)
from ml.analytics.spending_analysis import spending_insights, detect_large_expenses
from ml.analytics.debt_analysis import analyze_debt
from ml.analytics.financial_health import financial_health_score
from ml.analytics.goal_analysis import analyze_goals
from ml.recommendations.recommendation_engine import generate_recommendations
from ml.services.forecast_service import run_forecast


# ============================================================
# INTENT PATTERNS
# ============================================================

INTENT_PATTERNS = {
    "spending_summary": [
        r"how much (did i|have i) spend",
        r"total expense",
        r"my expense",
        r"spending this month",
        r"how much spent"
    ],
    "income_summary": [
        r"how much (did i|have i) earn",
        r"total income",
        r"my income",
        r"income this month",
        r"how much (i )?made"
    ],
    "savings": [
        r"how much (am i|did i) sav",
        r"savings",
        r"saving rate",
        r"savings rate",
        r"net savings"
    ],
    "debt_analysis": [
        r"which loan",
        r"debt",
        r"loan",
        r"outstanding",
        r"interest",
        r"borrow"
    ],
    "forecast": [
        r"next month",
        r"forecast",
        r"predict",
        r"future expense",
        r"upcoming expense"
    ],
    "goals": [
        r"goal",
        r"target",
        r"emergency fund",
        r"how much more",
        r"progress"
    ],
    "recommendations": [
        r"recommend",
        r"suggest",
        r"advice",
        r"what should i",
        r"improve",
        r"tip"
    ],
    "health": [
        r"financial health",
        r"health score",
        r"am i doing well",
        r"financial status",
        r"how (am i|are we) doing"
    ],
    "categories": [
        r"categor",
        r"where (am i|did i) spend",
        r"biggest expense",
        r"top spending",
        r"what (am i|do i) spend on"
    ]
}


def _identify_intent(question: str) -> str:
    """Match question to the best intent category."""
    q = question.lower()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, q):
                return intent
    return "general"


def _format_inr(amount: float) -> str:
    return f"₹{amount:,.2f}"


# ============================================================
# RESPONSE COMPOSERS — one per intent
# ============================================================

def _respond_spending(summary, categories):
    total = summary.get("total_expense", 0)
    top_cats = list(categories.items())[:3]
    cat_text = ", ".join(
        f"{c} ({_format_inr(a)})" for c, a in top_cats
    ) if top_cats else "no category data"
    return {
        "answer": (
            f"Your total expenses amount to {_format_inr(total)}. "
            f"Top categories: {cat_text}."
        ),
        "data_source": "transaction analysis",
        "key_figures": {"total_expense": total, "top_categories": dict(top_cats)}
    }


def _respond_income(summary):
    income = summary.get("total_income", 0)
    return {
        "answer": (
            f"Your total recorded income is {_format_inr(income)}. "
            "This is based on transactions marked as 'Income' in the provided data."
        ),
        "data_source": "transaction analysis",
        "key_figures": {"total_income": income}
    }


def _respond_savings(summary):
    savings = summary.get("savings", 0)
    rate = summary.get("savings_rate", 0)
    income = summary.get("total_income", 0)
    status = "strong" if rate >= 20 else ("moderate" if rate >= 10 else "low")
    return {
        "answer": (
            f"Your net savings are {_format_inr(savings)} "
            f"({rate}% of income {_format_inr(income)}). "
            f"This savings rate is considered {status}. "
            "A savings rate of 20%+ is generally recommended."
        ),
        "data_source": "transaction analysis",
        "key_figures": {
            "savings": savings,
            "savings_rate_pct": rate,
            "total_income": income
        }
    }


def _respond_debt(debt):
    outstanding = debt.get("total_outstanding", 0)
    annual_interest = debt.get("estimated_annual_interest", 0)
    priority = debt.get("priority_order", [])
    if not priority:
        return {
            "answer": "No loan data was provided. Please include your loan details for debt analysis.",
            "data_source": "debt analysis",
            "key_figures": {}
        }
    top = priority[0]
    return {
        "answer": (
            f"Your total outstanding debt is {_format_inr(outstanding)} "
            f"with estimated annual interest of {_format_inr(annual_interest)}. "
            f"Priority loan: {top.get('lender', 'Unknown')} at "
            f"{top.get('interest_rate', 0)}% interest "
            f"(outstanding: {_format_inr(top.get('outstanding_balance', 0))}). "
            "Pay this first to minimize interest cost."
        ),
        "data_source": "debt analysis",
        "key_figures": {
            "total_outstanding": outstanding,
            "annual_interest": annual_interest,
            "priority_loan": top
        }
    }


def _respond_forecast(monthly_expenses_history):
    if len(monthly_expenses_history) < 2:
        return {
            "answer": (
                "I need at least 2 months of expense history to generate a forecast. "
                "Please provide monthly_expenses_history with 2 or more values."
            ),
            "data_source": "forecasting",
            "key_figures": {}
        }
    result = run_forecast(monthly_expenses_history, months_ahead=1)
    return {
        "answer": (
            f"Based on {result['input_months']} months of history, "
            f"your next month's expenses are forecast at {_format_inr(result['forecast'])} "
            f"(range: {_format_inr(result['forecast_low'])}–{_format_inr(result['forecast_high'])}). "
            "This is a statistical estimate, not a guarantee."
        ),
        "data_source": "expense forecasting (linear regression)",
        "key_figures": {
            "forecast": result["forecast"],
            "forecast_low": result["forecast_low"],
            "forecast_high": result["forecast_high"],
            "mae_estimate": result["mae_estimate"]
        }
    }


def _respond_goals(goals, monthly_income):
    if not goals:
        return {
            "answer": "No goals were provided. Please include your financial goals for analysis.",
            "data_source": "goal analysis",
            "key_figures": {}
        }
    result = analyze_goals(goals, monthly_income)
    total_progress = result["overall_progress_pct"]
    note = result["feasibility_note"]
    goal_names = [g["name"] for g in result["goals"]]
    return {
        "answer": (
            f"You have {result['goal_count']} active goals "
            f"({', '.join(goal_names)}). "
            f"Overall progress: {total_progress}% of {_format_inr(result['total_target'])} target. "
            f"{note}"
        ),
        "data_source": "goal analysis",
        "key_figures": {
            "goal_count": result["goal_count"],
            "total_target": result["total_target"],
            "total_saved": result["total_saved"],
            "overall_progress_pct": total_progress,
            "goals": result["goals"]
        }
    }


def _respond_health(summary, debt):
    health = financial_health_score(
        summary.get("total_income", 0),
        summary.get("total_expense", 0),
        debt.get("total_outstanding", 0)
    )
    return {
        "answer": (
            f"Your financial health score is {health['score']}/100 — "
            f"status: {health['status']}. "
            f"Savings rate: {health['savings_rate']}%, "
            f"debt-to-income ratio: {health['debt_ratio']}%."
        ),
        "data_source": "financial health scoring",
        "key_figures": health
    }


def _respond_recommendations(summary, debt, spending):
    recs = generate_recommendations(summary, debt, spending)
    if not recs:
        return {
            "answer": "Your current data does not trigger any specific recommendations. Keep maintaining your financial habits!",
            "data_source": "recommendation engine",
            "key_figures": {"recommendation_count": 0}
        }
    titles = [r["title"] for r in recs]
    return {
        "answer": (
            f"Here are {len(recs)} personalized recommendation(s): "
            + " | ".join(f"{r['title']}: {r['message']}" for r in recs)
        ),
        "data_source": "rule-based recommendation engine",
        "key_figures": {"recommendations": recs}
    }


def _respond_categories(categories):
    if not categories:
        return {
            "answer": "No expense transactions were provided to analyze category breakdown.",
            "data_source": "category analysis",
            "key_figures": {}
        }
    top = list(categories.items())[:5]
    breakdown = ", ".join(f"{c}: {_format_inr(a)}" for c, a in top)
    return {
        "answer": f"Your spending by category: {breakdown}.",
        "data_source": "category analysis",
        "key_figures": {"categories": dict(top)}
    }


def _respond_general():
    return {
        "answer": (
            "I can help you with: spending summary, income summary, savings, "
            "debt analysis, expense forecast, goal progress, financial health, "
            "and personalized recommendations. "
            "Please ask about any of these topics and provide your transaction/loan/goal data."
        ),
        "data_source": "assistant guide",
        "key_figures": {}
    }


# ============================================================
# MAIN ENTRY POINT
# ============================================================

def get_grounded_response(
    question: str,
    transactions: List[Dict[str, Any]],
    loans: List[Dict[str, Any]],
    goals: List[Dict[str, Any]],
    monthly_expenses_history: List[float]
) -> Dict[str, Any]:
    """
    Route the user's question to the appropriate analytics function
    and return a data-grounded response.

    NO FINANCIAL VALUES ARE INVENTED.
    All numbers come from the supplied data or calculated analytics.
    """
    intent = _identify_intent(question)

    # Pre-calculate common analytics (only if transactions supplied)
    summary = calculate_financial_summary(transactions) if transactions else {
        "total_income": 0, "total_expense": 0,
        "savings": 0, "savings_rate": 0, "expense_ratio": 0
    }
    categories = category_analysis(transactions) if transactions else {}
    spending = spending_insights(transactions) if transactions else {
        "highest_category": None, "highest_amount": 0, "categories": {}
    }
    debt = analyze_debt(loans) if loans else {
        "total_principal": 0, "total_outstanding": 0,
        "estimated_annual_interest": 0, "loan_count": 0, "priority_order": []
    }
    monthly_income = summary.get("total_income") or None

    # Route to correct responder
    if intent == "spending_summary":
        response_body = _respond_spending(summary, categories)
    elif intent == "income_summary":
        response_body = _respond_income(summary)
    elif intent == "savings":
        response_body = _respond_savings(summary)
    elif intent == "debt_analysis":
        response_body = _respond_debt(debt)
    elif intent == "forecast":
        response_body = _respond_forecast(monthly_expenses_history)
    elif intent == "goals":
        response_body = _respond_goals(goals, monthly_income)
    elif intent == "health":
        response_body = _respond_health(summary, debt)
    elif intent == "recommendations":
        response_body = _respond_recommendations(summary, debt, spending)
    elif intent == "categories":
        response_body = _respond_categories(categories)
    else:
        response_body = _respond_general()

    return {
        "question": question,
        "intent": intent,
        "grounded": True,
        "hallucination_prevention": (
            "All figures derived from supplied transaction, loan, or goal data. "
            "No values were invented."
        ),
        **response_body
    }
