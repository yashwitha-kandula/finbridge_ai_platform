"""Analytics, goals, forecast, recommendation and AI-grounding tests (no DB required)."""
import pytest

from ml.analytics.financial_analytics import calculate_financial_summary, category_analysis
from ml.analytics.spending_analysis import spending_insights, detect_large_expenses
from ml.analytics.debt_analysis import analyze_debt
from ml.analytics.financial_health import financial_health_score
from ml.analytics.goal_analysis import analyze_goals
from ml.recommendations.recommendation_engine import generate_recommendations
from ml.forecasting.expense_forecaster import ExpenseForecaster
from ml.services.forecast_service import run_forecast
from ml.services.ai_assistant import get_grounded_response

TX = [
    {"date": "2026-08-01", "type": "Income", "category": "Salary", "amount": 30000},
    {"date": "2026-08-03", "type": "Expense", "category": "Food", "amount": 3500},
    {"date": "2026-08-05", "type": "Expense", "category": "Transport", "amount": 1800},
    {"date": "2026-08-10", "type": "Expense", "category": "Education", "amount": 4000},
]
LOANS = [
    {"loan_id": 1, "lender": "Bank", "principal": 100000, "outstanding_balance": 96000, "interest_rate": 12},
    {"loan_id": 2, "lender": "Gold", "principal": 50000, "outstanding_balance": 48000, "interest_rate": 18},
]


# ---------- Financial analytics ----------
def test_summary_matches_known_m2_result():
    s = calculate_financial_summary(TX)
    assert s == {"total_income": 30000.0, "total_expense": 9300.0, "savings": 20700.0,
                 "savings_rate": 69.0, "expense_ratio": 31.0}


def test_summary_empty_and_zero_income():
    s = calculate_financial_summary([])
    assert s["total_income"] == 0 and s["savings_rate"] == 0


def test_category_analysis_sorted_desc():
    cats = category_analysis(TX)
    assert list(cats) == ["Education", "Food", "Transport"]


def test_spending_insights_and_alerts():
    assert spending_insights(TX)["highest_category"] == "Education"
    big = TX + [{"date": "2026-08-20", "type": "Expense", "category": "Medical", "amount": 12000}]
    alerts = detect_large_expenses(big)
    assert len(alerts) == 1 and alerts[0]["amount"] == 12000


# ---------- Debt ----------
def test_debt_totals_interest_and_ranking():
    d = analyze_debt(LOANS)
    assert d["total_outstanding"] == 144000
    assert d["estimated_annual_interest"] == pytest.approx(96000 * 0.12 + 48000 * 0.18)
    assert d["priority_order"][0]["lender"] == "Gold"


# ---------- Health ----------
def test_health_score_bounds_and_insufficient_data():
    assert financial_health_score(0, 0, 0)["status"] == "Insufficient data"
    h = financial_health_score(30000, 9300, 96000)
    assert 0 <= h["score"] <= 100 and h["savings_rate"] == 69.0


# ---------- Goals ----------
def test_goal_progress_and_contribution():
    g = analyze_goals([{"name": "EF", "target_amount": 100000, "current_amount": 30000,
                        "target_date": "2099-01-01"}], monthly_income=30000)
    goal = g["goals"][0]
    assert goal["progress_pct"] == 30.0
    assert goal["remaining_amount"] == 70000
    assert goal["required_monthly_contribution"] > 0


def test_goal_achieved_overdue_and_bad_date():
    g = analyze_goals([
        {"name": "Done", "target_amount": 100, "current_amount": 100, "target_date": "2099-01-01"},
        {"name": "Late", "target_amount": 100, "current_amount": 10, "target_date": "2000-01-01"},
        {"name": "Bad", "target_amount": 100, "current_amount": 10, "target_date": "not-a-date"},
    ])
    by = {x["name"]: x for x in g["goals"]}
    assert by["Done"]["feasibility"] == "Achieved"
    assert by["Late"]["feasibility"] == "Overdue"
    assert by["Bad"]["required_monthly_contribution"] is None


# ---------- Forecasting ----------
def test_forecaster_requires_two_points():
    with pytest.raises(ValueError):
        ExpenseForecaster().train([1000])


def test_forecaster_untrained_raises():
    with pytest.raises(ValueError):
        ExpenseForecaster().predict()


def test_forecaster_linear_trend_next_value():
    f = ExpenseForecaster()
    f.train([1000, 2000, 3000, 4000])
    assert f.predict(1) == pytest.approx(5000, rel=1e-6)
    assert f.predict(2) == pytest.approx(6000, rel=1e-6)


def test_forecast_service_range():
    r = run_forecast([18000, 19500, 22000, 20500, 21000, 23000])
    assert r["forecast_low"] <= r["forecast"] <= r["forecast_high"]
    assert r["input_months"] == 6


def test_forecast_backtest_mae_mape():
    r = run_forecast([1000, 2000, 3000, 4000, 5000])
    assert r["backtest_points"] == 3
    assert r["mae_estimate"] == pytest.approx(0, abs=1e-6)
    assert r["mape_pct"] == pytest.approx(0, abs=1e-6)
    assert run_forecast([100, 200])["mae_estimate"] is None


# ---------- Recommendations ----------
def test_recommendations_deterministic_and_explainable():
    s = calculate_financial_summary(TX)
    d = analyze_debt(LOANS)
    sp = spending_insights(TX)
    r1 = generate_recommendations(s, d, sp)
    r2 = generate_recommendations(s, d, sp)
    assert r1 == r2
    assert all({"title", "message", "reason", "priority"} <= set(r) for r in r1)


def test_low_savings_triggers_savings_recommendation():
    tx = [{"type": "Income", "amount": 10000}, {"type": "Expense", "category": "Rent", "amount": 9500}]
    recs = generate_recommendations(calculate_financial_summary(tx), analyze_debt([]), spending_insights(tx))
    assert any(r["type"] == "savings" for r in recs)


# ---------- AI assistant grounding ----------
def ask(q, **kw):
    args = dict(transactions=TX, loans=LOANS, goals=[], monthly_expenses_history=[])
    args.update(kw)
    return get_grounded_response(q, **args)


def test_ai_spending_uses_computed_value():
    r = ask("How much did I spend?")
    assert r["intent"] == "spending_summary"
    assert r["key_figures"]["total_expense"] == 9300.0
    assert "9,300" in r["answer"]


def test_ai_debt_uses_priority_ranking():
    r = ask("Which loan should I prioritize?")
    assert r["key_figures"]["priority_loan"]["lender"] == "Gold"


def test_ai_unsupported_data_does_not_invent():
    r = ask("What is my forecast for next month?", monthly_expenses_history=[])
    assert r["key_figures"] == {}
    assert "at least 2 months" in r["answer"]
    r = ask("How are my goals?", goals=[])
    assert r["key_figures"] == {}


def test_ai_unknown_question_falls_back_to_guide():
    r = ask("Tell me a joke")
    assert r["intent"] == "general" and r["grounded"] is True
