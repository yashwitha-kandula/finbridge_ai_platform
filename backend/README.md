## fastapi dev app/main.py - to run backend server
## python -m uvicorn app.main:app --reload - updated after creating schemas.py 

> **Update (2026-10-06):** the routes now import `ml.*` and `backend.*`, so run the server from **`finbridge_ai_platform/`**:
> `python -m uvicorn backend.app.main:app --reload --port 8000`

# Backend (FastAPI)

## Structure
```
backend/app/
  main.py          single FastAPI app, CORS, basic + DB endpoints, router registration
  database.py      SQLAlchemy engine/session from DATABASE_URL, get_db dependency
  schemas.py       Pydantic models (TransactionInput, LoanInput, AnalysisRequest, ForecastRequest, GoalInput, AIChatRequest)
  routes/
    m2.py            POST /api/m2/analysis
    forecast.py      POST /api/forecast
    goals.py         POST /api/goals/analyze, GET /api/goals/demo
    ai_assistant.py  POST /api/ai/chat
    demo.py          GET  /api/demo/dataset  (simulated data, clearly labelled)
```

## Environment
Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`. `.env` is git-ignored.

## Run and test
```powershell
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000   # Swagger at http://localhost:8000/docs
python -m pytest tests/test_backend.py
```

## Troubleshooting
| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: ml` / `backend` | Run from `finbridge_ai_platform/`, not `backend/` |
| `/db-health` 500, "password authentication failed" | Check that the password in `DATABASE_URL` matches the Postgres `postgres` user; make sure the service is running |
| `RuntimeError: DATABASE_URL is not configured` | Create `backend/.env` (it is loaded relative to the working directory) |
| Frontend CORS error | The frontend must run on `localhost:5173` or `:3000` (see `main.py`) |
