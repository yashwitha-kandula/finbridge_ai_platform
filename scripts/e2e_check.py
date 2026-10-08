"""
FinBridge AI - end-to-end smoke test.
Run with backend on :8000 (and optionally frontend on :5173):
    python scripts/e2e_check.py
Follows the demo flow: health -> DB -> demo data -> analytics -> forecast
-> debt -> goals -> recommendations -> AI assistant (grounding check) -> frontend.
"""
import json
import sys
import urllib.request

API = "http://localhost:8000"
ok = True


def call(path, body=None, base=API):
    req = urllib.request.Request(base + path)
    if body is not None:
        req.data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw.strip().startswith(("{", "[")) else raw


def step(name, fn):
    global ok
    try:
        print(f"[PASS] {name}: {fn()}")
    except Exception as e:  # noqa: BLE001
        ok = False
        print(f"[FAIL] {name}: {type(e).__name__}: {e}")


step("1 Health", lambda: call("/health")["status"])
step("2 DB health", lambda: call("/db-health"))
step("2b DB transactions", lambda: f"{call('/db-test/transactions')['count']} rows")
d = call("/api/demo/dataset")
step("3 Demo dataset", lambda: f"{len(d['transactions'])} tx, {len(d['loans'])} loans, is_demo={d['is_demo']}")
a = call("/api/m2/analysis", {"transactions": d["transactions"], "loans": d["loans"]})
step("4 Analytics summary", lambda: a["summary"])
step("5 Spending", lambda: f"top={a['spending']['highest_category']} alerts={len(a['alerts'])}")
f = call("/api/forecast", {"monthly_expenses": d["monthly_expenses_history"]})
step("6 Forecast", lambda: f"{f['forecast']} [{f['forecast_low']}-{f['forecast_high']}] MAE={f['mae_estimate']} MAPE={f['mape_pct']}%")
step("7 Debt priority", lambda: [(l["lender"], l["interest_rate"]) for l in a["debt"]["priority_order"]])
g = call(f"/api/goals/analyze?monthly_income={a['summary']['total_income']}", d["goals"])
step("8 Goals", lambda: [(x["name"], x["progress_pct"], x["feasibility"]) for x in g["goals"]])
step("9 Health score", lambda: a["financial_health"])
step("10 Recommendations", lambda: [r["title"] for r in a["recommendations"]])

payload = {k: d[k] for k in ("transactions", "loans", "goals", "monthly_expenses_history")}


def ai_check():
    r = call("/api/ai/chat", {"question": "How much did I spend?", **payload})
    assert r["key_figures"]["total_expense"] == a["summary"]["total_expense"], "AI value != analytics value"
    return r["answer"]


step("11 AI grounded (matches analytics)", ai_check)


def ai_unsupported():
    r = call("/api/ai/chat", {"question": "forecast next month", "transactions": d["transactions"]})
    assert r["key_figures"] == {}, "AI invented a forecast without data"
    return r["answer"]


step("12 AI refuses to invent", ai_unsupported)
step("13 Frontend serving", lambda: "FinBridge AI" in call("/", base="http://localhost:5173"))

print("\nRESULT:", "ALL PASSED" if ok else "SOME CHECKS FAILED")
sys.exit(0 if ok else 1)
