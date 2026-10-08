# FinBridge AI — Demo Guide (Review / Final)

## 0. Before the panel
```powershell
# Terminal 1 — backend (from finbridge_ai_platform/)
python -m uvicorn backend.app.main:app --port 8000
# Terminal 2 — frontend
cd frontend; npm install; npm run dev
# Terminal 3 — proof
python -m pytest            # expect: 29 passed
python scripts/e2e_check.py # expect: RESULT: ALL PASSED
```
PostgreSQL must be running. If it isn't, everything still works except `/db-health`.

## 1. Scenario
A household with **variable income** (salary ₹30,000 plus freelance ₹6,000), three different debts (bank, informal and gold loan), three goals, and a ₹10,500 medical spike. **All of it is labelled demo data** from a simulated connector. There is no live bank connection.
No login is needed. Authentication is future scope.

## 2. Walkthrough (http://localhost:5173)
| Step | Page | Show | Expected output |
|---|---|---|---|
| 1 | Dashboard | Summary cards, charts, family panel | Income ₹36,000 · Expense ₹34,000 · Savings ₹2,000 (5.56%) · Health 30/100 "Needs attention" · Household ₹54,000 |
| 2 | Analytics | Category shares, alerts, transaction table | Top: Rent ₹12,000 · 2 alerts ≥ ₹10,000 (Rent, Medical) |
| 3 | Forecast | Next-month estimate | ≈ ₹30,286 (range ₹25,384–₹35,188) · backtest MAE ≈ ₹3,413 · MAPE ≈ 12.4% |
| 4 | Debt | Priority list | Gold loan 18% → Bank 12% → Informal 6%. Why: highest rate first minimises interest |
| 5 | Goals | Progress and feasibility | College Fees 100% Achieved · Laptop 56.2% Feasible · Emergency Fund 30% Challenging |
| 6 | Recommendations | Explainable cards | Improve savings (5.56%) · Review high-interest debt (Gold 18%) · Review largest category (Rent) |
| 7 | AI Assistant | Click the suggestion chips | "How much did I spend?" → ₹34,000 (same as the dashboard). "Which loan…" → Gold loan |
| 8 | Theme | Header toggle | Light / Dark / System (System is the default) |
| 9 | Swagger | http://localhost:8000/docs | Every endpoint is live |

## 3. Viva talking points
- **Grounding:** the assistant calls the same analytics functions as the dashboard. `e2e_check.py` asserts that the AI's number equals the analytics number, and that it refuses to forecast without history.
- **Bug found by tests:** the forecaster used to re-predict month 1. It's fixed and covered by a test.
- **ML:** Logistic Regression test F1 0.973, Random Forest 0.919. Tuning used the validation set only; the test set was used once (`ml/data/final_evaluation/`).
