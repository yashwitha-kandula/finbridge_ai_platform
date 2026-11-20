"""Backend API tests using FastAPI TestClient (DB-dependent tests are skipped if Postgres is unavailable)."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import User
from backend.app.routes.auth import get_current_user

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


def test_ai_ask_uses_question_and_financial_context(monkeypatch):
    class GeminiResponse:
        status_code = 200

        @staticmethod
        def json():
            return {"candidates": [{"content": {"parts": [{"text": "Food is your largest expense."}]}}]}

    def fake_post(url, headers, json, timeout):
        assert url.endswith("/models/gemini-3.5-flash-lite:generateContent")
        assert headers["x-goog-api-key"].startswith("AQ.")
        prompt = json["contents"][0]["parts"][0]["text"]
        assert "Which category costs most?" in prompt
        assert '"monthly_income": 50000' in prompt
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "AQ." + "x" * 30)
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setattr("requests.post", fake_post)

    response = client.post("/api/ai/ask", json={
        "question": "Which category costs most?",
        "context": {
            "total_income": 50000,
            "total_expense": 12000,
            "categories": [{"name": "Food", "value": 7000}],
        },
    })

    assert response.status_code == 200
    assert response.json()["source"] == "Google Gemini (gemini-3.5-flash-lite)"
    assert response.json()["answer"] == "Food is your largest expense."


def test_ai_ask_does_not_claim_spending_when_account_is_empty(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("LLM_API_KEY", "")

    response = client.post("/api/ai/ask", json={
        "question": "How can I save more?",
        "context": {"user_name": "Kandula", "total_income": 0, "total_expense": 0},
    })

    assert response.status_code == 200
    assert "no income or expense transactions" in response.json()["answer"]


def test_ai_ask_uses_declared_income_and_goal_context(monkeypatch):
    class GeminiResponse:
        status_code = 200

        @staticmethod
        def json():
            return {"candidates": [{"content": {"parts": [{"text": "Your income is ₹8,000 per month."}]}}]}

    def fake_post(url, headers, json, timeout):
        prompt = json["contents"][0]["parts"][0]["text"]
        assert '"monthly_income": 8000.0' in prompt
        assert '"income_sources": [{"name": "Primary salary", "amount": 7000}' in prompt
        assert '"name": "Emergency fund"' in prompt
        assert '"currency": "INR (₹)"' in prompt
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "AQ." + "x" * 30)
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setattr("requests.post", fake_post)

    response = client.post("/api/ai/ask", json={
        "question": "Can I save ₹500 per month?",
        "context": {
            "total_income": 0,
            "declared_monthly_income": 8000,
            "income_sources": [{"name": "Primary salary", "amount": 7000}],
            "currency": "INR (₹)",
            "goal_name": "Emergency fund",
            "target_amount": 20000,
        },
    })

    assert response.status_code == 200


def test_ai_chat_history_keeps_three_chats_per_user():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    test_session = sessionmaker(bind=engine)
    db = test_session()
    current_user = [
        User(email="chat-history@example.test", hashed_password="test", full_name="Chat User")
    ]
    other_user = User(email="other-chat@example.test", hashed_password="test", full_name="Other User")
    db.add_all([current_user[0], other_user])
    db.commit()
    db.refresh(current_user[0])
    db.refresh(other_user)

    def override_db():
        session = test_session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: current_user[0]
    try:
        for index in range(4):
            messages = [
                {"id": index * 2, "sender": "user", "text": f"Question {index}", "time": "10:00"},
                {"id": index * 2 + 1, "sender": "ai", "text": f"Answer {index}", "time": "10:01"},
            ]
            response = client.post(
                "/api/ai/history",
                json={"title": f"Question {index}", "messages": messages},
            )
            assert response.status_code == 200

        assert [chat["title"] for chat in client.get("/api/ai/history").json()["chats"]] == [
            "Question 3", "Question 2", "Question 1"
        ]

        current_user[0] = other_user
        assert client.get("/api/ai/history").json()["chats"] == []
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_db_health_if_available():
    try:
        r = client.get("/db-health")
    except Exception as exc:  # Postgres not running / auth failure
        pytest.skip(f"PostgreSQL unavailable: {type(exc).__name__}")
    assert r.json()["status"] == "connected"
