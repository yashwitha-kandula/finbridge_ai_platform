# FinBridge AI — Project Status (single source of truth)

_Last verified: 2026-10-06 · Evidence: `pytest` (29 passed) + `scripts/e2e_check.py` (13/13 passed)_

**Legend:** DONE · PARTIALLY DONE · IN PROGRESS · BLOCKED · NOT STARTED · FUTURE SCOPE

| # | Module | Status | Key files | Tests / evidence | Known issues | Next action |
|---|---|---|---|---|---|---|
| 1 | FastAPI backend (single app, CORS, routers) | DONE | `backend/app/main.py` | `test_backend.py`, E2E step 1 | Python 3.14 deprecation warnings from FastAPI (harmless) | — |
| 2 | PostgreSQL connectivity | DONE | `backend/app/database.py`, `backend/.env` | E2E step 2/2b (`finbridge_ai_db` connected, 1 row) | Analytics endpoints still take data in the request body, not from DB tables | Wire DB → analytics (P2) |
| 3 | Database schema (17 tables) | PARTIALLY DONE | Postgres instance | `/db-test/transactions` | No SQL/migration file in repo (`database/` only has a README) | Export schema with `pg_dump -s` into `database/schema.sql` |
| 4 | Transaction ingestion | PARTIALLY DONE (demo) | `backend/app/routes/demo.py` | E2E step 3 | Simulated connector only — **no live bank integration** | Future: account-aggregator connector |
| 5 | Financial data processing (income/expense/savings/ratios) | DONE | `ml/analytics/financial_analytics.py` | `test_summary_*`, E2E step 4 | Only Income/Expense types are aggregated; Investment/Transfer are ignored | Add per-type totals (P2) |
| 6 | Spending analysis (categories, alerts) | DONE | `ml/analytics/spending_analysis.py` | `test_spending_*`, E2E step 5 | No rolling averages / recurring-detection yet | P2 |
| 7 | Expense forecasting + MAE/MAPE backtest | DONE | `ml/forecasting/expense_forecaster.py`, `ml/services/forecast_service.py` | 5 forecast tests, E2E step 6 | Linear trend model (not exponential smoothing) | Optional: add ETS comparison |
| 8 | Debt prioritization | DONE | `ml/analytics/debt_analysis.py` | `test_debt_*`, E2E step 7 | Ranks by interest rate only (avalanche) | — |
| 9 | Goals | DONE | `ml/analytics/goal_analysis.py`, `routes/goals.py` | 2 goal tests, E2E step 8 | — | — |
| 10 | Financial health | DONE | `ml/analytics/financial_health.py` | `test_health_*`, E2E step 9 | debt_ratio uses total outstanding ÷ period income (can exceed 100%) | Document / refine |
| 11 | Recommendations | DONE | `ml/recommendations/recommendation_engine.py` | 2 rec tests, E2E step 10 | Has no "expected benefit" field yet | P2 |
| 12 | M2 service + `/api/m2/analysis` | DONE | `ml/services/m2_service.py`, `routes/m2.py` | `ml/tests/test_m2.py`, `test_m2_analysis_endpoint` | — | — |
| 13 | AI assistant (grounded) | DONE (rule-based) | `ml/services/ai_assistant.py`, `routes/ai_assistant.py` | 4 grounding tests, E2E steps 11–12 | No LLM connected (no API key) — templated wording | Plug LLM into the response step |
| 14 | Frontend dashboard (7 pages, theme L/D/System) | DONE | `frontend/src/**` | `npm run build` OK, E2E step 13 | No automated UI tests; bundle 584 kB | Code-split (P3) |
| 15 | Family finance | PARTIALLY DONE | Dashboard family panel, demo `family_members` | Visual | Household income only; no per-member analytics | P2 |
| 16 | M3 ML classifier (LR / RF) | DONE | `ml/tune_models.py`, `ml/evaluate_final_test.py`, `ml/data/final_evaluation/` | Test F1: LR 0.973, RF 0.919 (saved CSVs; not re-run in this session) | — | — |
| 17 | Security basics | DONE | `.gitignore`, `backend/.env.example` | No `.env` tracked | **`transactions_50M.parquet` (1.5 GB) is in Git history** (commit `1bf340d`) — push to GitHub will fail | Untracked now; rewrite history (`git filter-repo`) before pushing |
| 18 | Auth (JWT/users) | NOT STARTED | — | — | — | Future |
| 19 | Live bank sync, property valuation, market alerts, MCP | FUTURE SCOPE | — | — | — | Major project |
