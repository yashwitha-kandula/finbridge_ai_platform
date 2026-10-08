# Changelog

| Date | File | Change | Reason | Test |
|---|---|---|---|---|
| 2026-10-06 | `backend/app/routes/m2.py`, `schemas.py` | Body is now a Pydantic `AnalysisRequest` | Route treated lists as query params → 422 | `test_m2_analysis_endpoint` ✅ |
| 2026-10-06 | `backend/app/main.py` | CORS; registered forecast/goals/ai/demo routers on the single app | Frontend access; new modules | `test_single_app_has_all_routers` ✅ |
| 2026-10-06 | `backend/app/schemas.py` | `ExpenseUpdate` fields optional | Partial updates were impossible | — |
| 2026-10-06 | `ml/forecasting/expense_forecaster.py` | Predict month `n+1` instead of `model.n_features_in_` (always 1) | **Bug:** forecasts re-predicted month 1 | `test_forecaster_linear_trend_next_value` ✅ |
| 2026-10-06 | `ml/services/forecast_service.py` | New: range + walk-forward MAE/MAPE | Forecast API + evaluation | `test_forecast_backtest_mae_mape` ✅ |
| 2026-10-06 | `ml/analytics/goal_analysis.py` | New goal analysis | Module 5 | goal tests ✅ |
| 2026-10-06 | `ml/services/ai_assistant.py` | New grounded assistant | Module 8 | 4 AI tests ✅ |
| 2026-10-06 | `backend/app/routes/{forecast,goals,ai_assistant,demo}.py` | New routes | API exposure | backend tests ✅ |
| 2026-10-06 | `frontend/**` | Implemented the empty stubs, added `package.json`, Vite config, Goals & AI pages | Frontend was 0 bytes | `npm run build` ✅, E2E ✅ |
| 2026-10-06 | `ml/tests/test_m2.py` | Replaced copy of the route with a real test | File had the wrong content | ✅ |
| 2026-10-06 | `tests/test_backend.py`, `tests/test_analytics.py`, `pytest.ini`, `scripts/e2e_check.py` | New tests | Evidence | 29 passed, E2E 13/13 |
| 2026-10-06 | `.gitignore`, `backend/.env.example` | Ignore node_modules/dist/parquet; untracked 1.5 GB parquet | GitHub 100 MB limit; secrets hygiene | `git ls-files` ✅ |
