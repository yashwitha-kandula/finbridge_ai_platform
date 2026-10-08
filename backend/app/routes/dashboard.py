"""
Dashboard API: everything on the dashboard is computed from the signed-in
user's own rows (transactions, financial_goals, loans, reminders).
A brand new user therefore sees zeros and empty states, never mock data.
Sample data is strictly opt-in and removable (rows are tagged).
"""
from calendar import monthrange
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db, engine
from .auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

with engine.begin() as _c:
    _c.execute(text("""
        CREATE TABLE IF NOT EXISTS reminders (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            category VARCHAR(30) NOT NULL DEFAULT 'other',
            amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
            due_date DATE NOT NULL,
            is_sample BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """))


# ---------------------------------------------------------------- helpers
def _first(d: date) -> date:
    return d.replace(day=1)


def _add_months(d: date, n: int) -> date:
    idx = d.year * 12 + (d.month - 1) + n
    return date(idx // 12, idx % 12 + 1, 1)


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def _pct(cur: float, prev: float) -> Optional[float]:
    if not prev:
        return None
    return round((cur - prev) / abs(prev) * 100, 1)


def _totals(db: Session, uid: int, start: date, end: date):
    row = db.execute(text("""
        SELECT COALESCE(SUM(CASE WHEN transaction_type='INCOME'  THEN amount END),0),
               COALESCE(SUM(CASE WHEN transaction_type='EXPENSE' THEN amount END),0)
        FROM transactions
        WHERE user_id=:u AND transaction_date>=:s AND transaction_date<:e
          AND COALESCE(status,'COMPLETED')='COMPLETED'
    """), {"u": uid, "s": start, "e": end}).one()
    return float(row[0]), float(row[1])


def _cumulative_savings(db: Session, uid: int, before: date) -> float:
    row = db.execute(text("""
        SELECT COALESCE(SUM(CASE WHEN transaction_type='INCOME'  THEN amount END),0)
             - COALESCE(SUM(CASE WHEN transaction_type='EXPENSE' THEN amount END),0)
        FROM transactions
        WHERE user_id=:u AND transaction_date<:b AND COALESCE(status,'COMPLETED')='COMPLETED'
    """), {"u": uid, "b": before}).scalar()
    return float(row or 0)


def _category_expenses(db: Session, uid: int, start: date, end: date):
    rows = db.execute(text("""
        SELECT COALESCE(c.name,'Uncategorized') AS name, SUM(t.amount) AS total
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=:u AND t.transaction_type='EXPENSE'
          AND t.transaction_date>=:s AND t.transaction_date<:e
          AND COALESCE(t.status,'COMPLETED')='COMPLETED'
        GROUP BY 1 ORDER BY 2 DESC
    """), {"u": uid, "s": start, "e": end}).all()
    return [(r[0], float(r[1])) for r in rows]


def _health(income: float, expense: float, emi: float, savings: float) -> Optional[int]:
    """0-100: savings rate (50) + debt burden (30) + 6-month emergency cover (20)."""
    if income <= 0:
        return None
    savings_rate = (income - expense) / income
    a = 50 * _clamp(savings_rate / 0.30)
    b = 30 * (1 - _clamp((emi / income) / 0.50))
    c = 20 * _clamp(max(savings, 0) / (max(expense, 1) * 6))
    return round(a + b + c)


def _health_text(score: Optional[int]):
    if score is None:
        return "No data yet", "Add your income and expenses to see your score."
    if score >= 80:
        return "Great", "You're on the right track!"
    if score >= 65:
        return "Good", "You're doing well. Keep it up!"
    if score >= 45:
        return "Fair", "A few changes can improve your score."
    return "Needs attention", "Let's work on improving your finances."


def _category_id(db: Session, uid: int, name: str, ctype: str) -> int:
    row = db.execute(text("""
        SELECT id FROM categories
        WHERE lower(name)=lower(:n) AND category_type=:t
        LIMIT 1
    """), {"n": name, "t": ctype}).first()
    if row:
        return row[0]
    return db.execute(text("""
        INSERT INTO categories (name, category_type, user_id, source, is_active)
        VALUES (:n,:t,:u,'USER',TRUE)
        ON CONFLICT (name, category_type) DO UPDATE SET is_active=TRUE
        RETURNING id
    """), {"n": name, "t": ctype, "u": uid}).scalar()


# ---------------------------------------------------------------- main payload
@router.get("")
def dashboard(
    trend_months: int = Query(6, ge=3, le=12),
    breakdown: str = Query("this_month", pattern="^(this_month|last_month|last_3_months)$"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    uid = user.id
    today = date.today()
    this_m = _first(today)
    next_m = _add_months(this_m, 1)
    last_m = _add_months(this_m, -1)

    inc, exp = _totals(db, uid, this_m, next_m)
    p_inc, p_exp = _totals(db, uid, last_m, this_m)

    savings_now = _cumulative_savings(db, uid, next_m)
    savings_prev = _cumulative_savings(db, uid, this_m)

    loan_row = db.execute(text("""
        SELECT COALESCE(SUM(outstanding_amount),0), COALESCE(SUM(minimum_payment),0)
        FROM loans WHERE user_id=:u AND is_active
    """), {"u": uid}).one()
    debt, emi = float(loan_row[0]), float(loan_row[1])
    net_now, net_prev = savings_now - debt, savings_prev - debt

    score = _health(inc, exp, emi, savings_now)
    prev_score = _health(p_inc, p_exp, emi, savings_prev)
    label, message = _health_text(score)

    # ---- trend
    first_trend = _add_months(this_m, -(trend_months - 1))
    rows = db.execute(text("""
        SELECT date_trunc('month', transaction_date)::date AS m,
               COALESCE(SUM(CASE WHEN transaction_type='INCOME'  THEN amount END),0),
               COALESCE(SUM(CASE WHEN transaction_type='EXPENSE' THEN amount END),0)
        FROM transactions
        WHERE user_id=:u AND transaction_date>=:s AND transaction_date<:e
          AND COALESCE(status,'COMPLETED')='COMPLETED'
        GROUP BY 1
    """), {"u": uid, "s": first_trend, "e": next_m}).all()
    by_month = {r[0]: (float(r[1]), float(r[2])) for r in rows}
    trend = []
    for i in range(trend_months):
        m = _add_months(first_trend, i)
        i_, e_ = by_month.get(m, (0.0, 0.0))
        trend.append({"label": m.strftime("%b '%y"), "income": i_, "expenses": e_})

    # ---- breakdown
    if breakdown == "this_month":
        b_start, b_end = this_m, next_m
    elif breakdown == "last_month":
        b_start, b_end = last_m, this_m
    else:
        b_start, b_end = _add_months(this_m, -2), next_m
    cats = _category_expenses(db, uid, b_start, b_end)
    total_exp = sum(v for _, v in cats)
    top, others = cats[:6], sum(v for _, v in cats[6:])
    items = [{"name": n, "amount": v} for n, v in top]
    if others > 0:
        items.append({"name": "Other categories", "amount": others})
    for it in items:
        it["percent"] = round(it["amount"] / total_exp * 100, 1) if total_exp else 0

    # ---- goals
    goal_rows = db.execute(text("""
        SELECT id, goal_name, target_amount, current_amount, target_date
        FROM financial_goals WHERE user_id=:u AND COALESCE(status,'active')='active'
        ORDER BY created_at, id LIMIT 3
    """), {"u": uid}).all()
    goals = [{
        "id": g[0], "name": g[1], "target": float(g[2]), "current": float(g[3]),
        "percent": round(_clamp(float(g[3]) / float(g[2])) * 100) if g[2] else 0,
        "target_date": g[4].strftime("%b %Y") if g[4] else None,
    } for g in goal_rows]

    # ---- recent transactions
    tx_rows = db.execute(text("""
        SELECT t.id, COALESCE(t.merchant_name, t.description, c.name, 'Transaction'),
               COALESCE(c.name,'Uncategorized'), t.transaction_type, t.amount, t.transaction_date
        FROM transactions t LEFT JOIN categories c ON c.id=t.category_id
        WHERE t.user_id=:u
        ORDER BY t.transaction_date DESC, t.id DESC LIMIT 5
    """), {"u": uid}).all()
    recent = [{
        "id": r[0], "title": r[1], "category": r[2], "type": r[3],
        "amount": float(r[4]), "date": r[5].strftime("%d %b %Y"),
    } for r in tx_rows]

    # ---- upcoming bills (loan EMIs + reminders)
    bills = []
    for r in db.execute(text("""
        SELECT lender_name, minimum_payment, next_payment_date FROM loans
        WHERE user_id=:u AND is_active AND minimum_payment IS NOT NULL
          AND next_payment_date IS NOT NULL AND next_payment_date>=:t
    """), {"u": uid, "t": today}).all():
        bills.append({"title": r[0], "kind": "loan", "amount": float(r[1]), "due": r[2]})
    for r in db.execute(text("""
        SELECT id, title, category, amount, due_date FROM reminders
        WHERE user_id=:u AND due_date>=:t
    """), {"u": uid, "t": today}).all():
        bills.append({"title": r[1], "kind": r[2], "amount": float(r[3]), "due": r[4]})
    bills.sort(key=lambda b: b["due"])
    due_soon = sum(1 for b in bills if (b["due"] - today).days <= 7)
    bills_out = [{
        "title": b["title"], "kind": b["kind"], "amount": b["amount"],
        "due": b["due"].strftime("%d %b %Y"), "days_left": (b["due"] - today).days,
    } for b in bills[:3]]

    # ---- AI insight (rule based, grounded in the user's own numbers)
    cur_c = dict(_category_expenses(db, uid, this_m, next_m))
    prev_c = dict(_category_expenses(db, uid, last_m, this_m))
    best = None
    for name, amt in cur_c.items():
        prev = prev_c.get(name, 0)
        if prev > 0 and amt > prev and amt >= 500:
            rise = (amt - prev) / prev * 100
            if best is None or rise > best[1]:
                best = (name, rise, amt)
    if best:
        saving = int(round(best[2] * 0.20 / 100.0) * 100)
        insight = {
            "headline": f"Your {best[0]} expenses are {round(best[1])}% higher than last month.",
            "detail": f"You can save around ₹{saving:,} if you reduce {best[0]} spending by 20%.",
        }
    elif inc > 0 and exp > 0:
        rate = round((inc - exp) / inc * 100)
        insight = {
            "headline": f"You've saved {rate}% of your income this month." if rate >= 0
                        else "Your spending is above your income this month.",
            "detail": "Keep tracking to unlock category-level suggestions.",
        }
    else:
        insight = {
            "headline": "Add a few transactions to get personalised insights.",
            "detail": "Insights use only your own income and spending data.",
        }

    has_data = bool(
        db.execute(text("SELECT 1 FROM transactions WHERE user_id=:u LIMIT 1"), {"u": uid}).first()
    )
    has_sample = bool(db.execute(text("""
        SELECT 1 FROM transactions WHERE user_id=:u AND source='SYSTEM' LIMIT 1
    """), {"u": uid}).first())
    created = db.execute(text("SELECT created_at FROM users WHERE id=:u"), {"u": uid}).scalar()

    return {
        "user": {
            "full_name": user.full_name, "profession": user.profession,
            "email": user.email,
            "member_since": created.strftime("%B %Y") if created else None,
        },
        "has_data": has_data, "has_sample": has_sample,
        "cards": {
            "income": {"value": inc, "change": _pct(inc, p_inc)},
            "expenses": {"value": exp, "change": _pct(exp, p_exp)},
            "savings": {"value": savings_now, "change": _pct(savings_now, savings_prev) if savings_prev > 0 else None},
            "net_worth": {"value": net_now, "change": _pct(net_now, net_prev) if net_prev > 0 else None},
        },
        "health": {
            "score": score, "label": label, "message": message,
            "delta": (score - prev_score) if (score is not None and prev_score is not None) else None,
        },
        "trend": trend,
        "breakdown": {"total": total_exp, "items": items},
        "goals": goals, "recent": recent,
        "bills": bills_out, "due_soon": due_soon,
        "insight": insight,
    }


# ---------------------------------------------------------------- create endpoints
class GoalIn(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[date] = None


@router.post("/goals", status_code=201)
def add_goal(body: GoalIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not body.goal_name.strip():
        raise HTTPException(400, "Goal name is required")
    if body.target_amount <= 0:
        raise HTTPException(400, "Target amount must be greater than 0")
    if body.current_amount < 0:
        raise HTTPException(400, "Saved amount cannot be negative")
    db.execute(text("""
        INSERT INTO financial_goals (user_id, goal_name, target_amount, current_amount, target_date, status)
        VALUES (:u,:n,:t,:c,:d,'active')
    """), {"u": user.id, "n": body.goal_name.strip(), "t": body.target_amount,
           "c": body.current_amount, "d": body.target_date})
    db.commit()
    return {"ok": True}


class ReminderIn(BaseModel):
    title: str
    amount: float
    due_date: date
    category: str = "other"


@router.post("/reminders", status_code=201)
def add_reminder(body: ReminderIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not body.title.strip():
        raise HTTPException(400, "Title is required")
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be greater than 0")
    cat = body.category if body.category in ("insurance", "card", "loan", "other") else "other"
    db.execute(text("""
        INSERT INTO reminders (user_id, title, category, amount, due_date)
        VALUES (:u,:t,:c,:a,:d)
    """), {"u": user.id, "t": body.title.strip(), "c": cat, "a": body.amount, "d": body.due_date})
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------- opt-in sample data
def _clear_sample(db: Session, uid: int):
    db.execute(text("DELETE FROM transactions WHERE user_id=:u AND source='SYSTEM'"), {"u": uid})
    db.execute(text("DELETE FROM financial_goals WHERE user_id=:u AND description='SAMPLE'"), {"u": uid})
    db.execute(text("DELETE FROM loans WHERE user_id=:u AND description='SAMPLE'"), {"u": uid})
    db.execute(text("DELETE FROM reminders WHERE user_id=:u AND is_sample"), {"u": uid})


@router.post("/sample-data")
def load_sample(db: Session = Depends(get_db), user=Depends(get_current_user)):
    uid, today = user.id, date.today()
    _clear_sample(db, uid)

    incomes = [90000, 100000, 105000, 105000, 110000, 120000]
    expenses = [50000, 55000, 58000, 60000, 62000, 65000]
    shares = [
        ("Housing", .3077, [("Rent", 1.0, 3)]),
        ("Food & Dining", .1846, [("Zomato", .35, 7), ("Swiggy", .25, 12), ("BigBasket", .40, 18)]),
        ("Transport", .1231, [("Uber", .6, 9), ("Metro Pass", .4, 5)]),
        ("Utilities", .0923, [("Electricity Bill", 1.0, 14)]),
        ("Shopping", .1077, [("Amazon", 1.0, 20)]),
        ("Others", .1846, [("Miscellaneous", 1.0, 22)]),
    ]
    sal_cat = _category_id(db, uid, "Salary", "income")

    def clamp_day(m: date, day: int) -> date:
        last = monthrange(m.year, m.month)[1]
        d = min(day, last)
        if m == _first(today):
            d = min(d, today.day)
        return date(m.year, m.month, max(d, 1))

    def add_tx(ttype, amt, d, title, cat_id):
        db.execute(text("""
            INSERT INTO transactions (user_id, category_id, amount, transaction_type, description,
                                      merchant_name, transaction_date, source, status)
            VALUES (:u,:c,:a,:t,:d,:m,:dt,'SYSTEM','COMPLETED')
        """), {"u": uid, "c": cat_id, "a": amt, "t": ttype, "d": title, "m": title, "dt": d})

    for i in range(6):
        m = _add_months(_first(today), i - 5)
        add_tx("INCOME", incomes[i], clamp_day(m, 1), "Salary", sal_cat)
        for cname, share, parts in shares:
            cid = _category_id(db, uid, cname, "expense")
            for title, frac, day in parts:
                amt = round(expenses[i] * share * frac / 10) * 10
                if amt > 0:
                    add_tx("EXPENSE", amt, clamp_day(m, day), title, cid)

    for name, target, current, months in (
        ("Buy a Car", 600000, 240000, 14), ("Emergency Fund", 150000, 80000, 12),
        ("Europe Trip", 250000, 120000, 7),
    ):
        db.execute(text("""
            INSERT INTO financial_goals (user_id, goal_name, target_amount, current_amount,
                                         target_date, status, description)
            VALUES (:u,:n,:t,:c,:d,'active','SAMPLE')
        """), {"u": uid, "n": name, "t": target, "c": current,
               "d": _add_months(_first(today), months)})

    db.execute(text("""
        INSERT INTO loans (user_id, loan_type, lender_name, principal_amount, outstanding_amount,
                           interest_rate, minimum_payment, next_payment_date, description)
        VALUES (:u,'PERSONAL','Home Loan EMI',600000,180000,8.5,25000,:d,'SAMPLE')
    """), {"u": uid, "d": today + timedelta(days=5)})
    for title, cat, amt, days in (("Car Insurance", "insurance", 6500, 9),
                                  ("Credit Card Bill", "card", 7850, 14)):
        db.execute(text("""
            INSERT INTO reminders (user_id, title, category, amount, due_date, is_sample)
            VALUES (:u,:t,:c,:a,:d,TRUE)
        """), {"u": uid, "t": title, "c": cat, "a": amt, "d": today + timedelta(days=days)})
    db.commit()
    return {"ok": True}


@router.delete("/sample-data")
def remove_sample(db: Session = Depends(get_db), user=Depends(get_current_user)):
    _clear_sample(db, user.id)
    db.commit()
    return {"ok": True}
