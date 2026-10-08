"""Backend API tests using FastAPI TestClient (DB-dependent tests are skipped if Postgres is unavailable)."""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_root_health_project():
    assert client.get("/").json()["status"] == "running"
    assert client.get("/health").json()["status"] == "healthy"
    assert client.get("/project").json()["project"] == "FinBridge AI"


def test_single_app_has_all_routers():
    paths = {r.path for r in app.routes}
    for p in ["/api/m2/analysis", "/api/forecast", "/api/goals/analyze",
              "/api/goals/demo", "/api/ai/chat", "/api/demo/dataset"]:
        assert p in paths, p


def test_demo_dataset_is_labelled():
    d = client.get("/api/demo/dataset").json()
    assert d["is_demo"] is True
    assert "Simulated" in d["source"]


def test_m2_analysis_endpoint():
    body = {
        "transactions": [
            {"date": "2026-08-01", "type": "Income", "category": "Salary", "amount": 30000},
            {"date": "2026-08-03", "type": "Expense", "category": "Food", "amount": 3500},
            {"date": "2026-08-05", "type": "Expense", "category": "Transport", "amount": 1800},
            {"date": "2026-08-10", "type": "Expense", "category": "Education", "amount": 4000},
        ],
        "loans": [{"loan_id": 5, "lender": "Test Lender", "principal": 100000,
                   "outstanding_balance": 96000, "interest_rate": 12}],
    }
    r = client.post("/api/m2/analysis", json=body)
    assert r.status_code == 200
    j = r.json()
    assert j["summary"]["savings"] == 20700.0
    assert j["debt"]["total_outstanding"] == 96000
    assert set(j) >= {"summary", "categories", "debt", "financial_health", "recommendations"}


def test_m2_validation_rejects_negative_amount():
    r = client.post("/api/m2/analysis", json={"transactions": [{"type": "Expense", "amount": -5}]})
    assert r.status_code == 422


def test_forecast_endpoint_and_validation():
    r = client.post("/api/forecast", json={"monthly_expenses": [1000, 2000, 3000]})
    assert r.status_code == 200 and r.json()["forecast"] == pytest.approx(4000, rel=1e-6)
    assert client.post("/api/forecast", json={"monthly_expenses": [1000]}).status_code == 422


def test_goals_endpoints():
    assert client.get("/api/goals/demo").json()["goal_count"] == 3
    r = client.post("/api/goals/analyze?monthly_income=30000", json=[
        {"name": "EF", "target_amount": 1000, "current_amount": 500, "target_date": "2099-01-01"}])
    assert r.status_code == 200 and r.json()["goals"][0]["progress_pct"] == 50.0


def test_ai_chat_endpoint_grounded():
    r = client.post("/api/ai/chat", json={
        "question": "How much did I spend?",
        "transactions": [{"type": "Expense", "category": "Food", "amount": 1234}],
    })
    j = r.json()
    assert r.status_code == 200 and j["grounded"] is True
    assert j["key_figures"]["total_expense"] == 1234


def test_db_health_if_available():
    try:
        r = client.get("/db-health")
    except Exception as exc:  # Postgres not running / auth failure
        pytest.skip(f"PostgreSQL unavailable: {type(exc).__name__}")
    assert r.json()["status"] == "connected"
