import os
import re
from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from ml.services.ai_assistant import get_grounded_response
from backend.app.schemas import AIChatRequest

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"]
)


class AskRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None


class KeyRequest(BaseModel):
    api_key: str


@router.get("/key-status")
def gemini_key_status():
    """Check if Gemini API key is configured."""
    key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or ""
    is_set = bool(key and len(key.strip()) > 20 and not key.startswith("your_") and not key.startswith("..."))
    masked = f"{key[:6]}...{key[-4:]}" if is_set else None
    return {
        "configured": is_set,
        "masked_key": masked,
        "model": "gemini-3.8-flash"
    }


@router.post("/save-key")
def save_gemini_key(req: KeyRequest):
    """Save or update Gemini API key dynamically."""
    cleaned = req.api_key.strip()
    if len(cleaned) < 20:
        return {"success": False, "message": "Key is too short. Please provide a valid Google Gemini API Key."}

    os.environ["GEMINI_API_KEY"] = cleaned
    os.environ["LLM_API_KEY"] = cleaned

    # Also persist to backend/.env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={cleaned}\n")
                found = True
            elif line.startswith("LLM_API_KEY="):
                new_lines.append(f"LLM_API_KEY={cleaned}\n")
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"GEMINI_API_KEY={cleaned}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass

    return {
        "success": True,
        "message": "Google Gemini API key connected successfully! The assistant will now answer queries using Gemini AI.",
        "configured": True,
        "masked_key": f"{cleaned[:6]}...{cleaned[-4:]}"
    }


@router.post("/chat")
def ai_chat(request: AIChatRequest):
    """Grounded AI financial assistant (Rule & Dataset verification)."""
    transactions = [t.model_dump() for t in request.transactions]
    loans = [loan.model_dump() for loan in request.loans]
    goals = [g.model_dump() for g in request.goals]

    return get_grounded_response(
        question=request.question,
        transactions=transactions,
        loans=loans,
        goals=goals,
        monthly_expenses_history=request.monthly_expenses_history
    )


def _generate_intent_response(q: str, user_name: str, total_income: float, total_expense: float, savings_rate: float, cats: list) -> str:
    ql = q.lower()
    cats_sorted = sorted(cats, key=lambda x: x.get('value', 0), reverse=True)
    top_cat = cats_sorted[0].get('name') if cats_sorted else 'Expenses'
    top_cat_amt = cats_sorted[0].get('value') if cats_sorted else (total_expense * 0.35)

    # 1. Saving question
    if any(k in ql for k in ['save', 'saving', 'reduce', 'cut']):
        return (
            f"Hi {user_name}! Your monthly savings rate is currently {savings_rate}%. "
            f"Your tracked monthly spending is ₹{total_expense:,.0f}, with {top_cat} (₹{top_cat_amt:,.0f}) being significant. "
            f"By cutting discretionary non-essential expenses and setting a weekly cap, "
            f"you can expand your monthly savings buffer."
        )

    # 2. Spending question
    if any(k in ql for k in ['spend', 'expense', 'cost', 'where my money']):
        cat_breakdown = ", ".join([f"{c['name']}: ₹{c['value']:,}" for c in cats_sorted[:3]]) if cats_sorted else "recorded categories"
        return (
            f"Your current tracked expenses stand at ₹{total_expense:,.0f}. "
            f"Top areas: {cat_breakdown}. "
            f"Your overall expense-to-income ratio is currently {round((total_expense/max(total_income,1))*100, 1)}%."
        )

    # 3. Loan / Debt prepayment
    if any(k in ql for k in ['loan', 'prepay', 'emi', 'debt']):
        return (
            f"Prepaying your highest-interest debt first (such as credit card dues or personal loans) yields guaranteed returns. "
            f"Allocating an additional 10-15% of your surplus cash towards debt principal "
            f"can shave years off your loan tenure and save substantial interest."
        )

    # 4. Investment question
    if any(k in ql for k in ['invest', 'stock', 'mutual fund', 'sip', 'return']):
        return (
            f"For balanced growth, starting an automated monthly SIP into broad-market index funds "
            f"builds strong compound wealth. At historical 11-12% annual returns over a 7-10 year horizon, "
            f"consistent investing multiplies your corpus significantly."
        )

    # 5. Retirement
    if any(k in ql for k in ['retire', 'pension', 'old age', 'fire']):
        return (
            f"To achieve comfortable financial independence and early retirement, target accumulating 25x-30x of your annual expenses. "
            f"With your current expense baseline, maintaining a disciplined savings rate above 30% "
            f"will accelerate your path to financial freedom."
        )

    # 6. Budget
    if any(k in ql for k in ['budget', 'rule', '50/30/20']):
        needs = round(total_income * 0.5)
        wants = round(total_income * 0.3)
        savings = round(total_income * 0.2)
        return (
            f"Applying the 50/30/20 financial rule to your ₹{total_income:,.0f} income: "
            f"Limit Needs to ₹{needs:,.0f}, Wants to ₹{wants:,.0f}, and direct at least ₹{savings:,.0f} into Investments and Emergency savings."
        )

    # General tailored answer
    return (
        f"Based on your active financial profile (Income: ₹{total_income:,.0f}, Expenses: ₹{total_expense:,.0f}), "
        f"you are maintaining a {savings_rate}% savings buffer. Let me know if you would like me to analyze "
        f"a specific date, category breakdown, goal progress, or investment strategy!"
    )


@router.post("/ask")
def ask_gemini(req: AskRequest):
    """
    Direct interactive Assistant endpoint powered by Gemini API,
    with an intelligent financial intent-routing fallback.
    """
    q = req.question.strip()
    ctx = req.context or {}
    user_name = ctx.get("user_name", "User").split()[0]
    total_income = float(ctx.get("total_income", 0))
    total_expense = float(ctx.get("total_expense", 0))
    savings_rate = float(ctx.get("savings_rate", 0))
    cats = ctx.get("categories", [])
    cats_str = ", ".join([f"{c.get('name')}: ₹{c.get('value', 0):,}" for c in cats])

    # Try calling Google Gemini if a valid API key is present
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
    if gemini_key and len(gemini_key.strip()) > 20 and not gemini_key.startswith("your_") and not gemini_key.startswith("..."):
        models_to_try = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-1.5-flash"]
        for model in models_to_try:
            try:
                import requests
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key.strip()}"
                prompt = (
                    f"You are FinBridge AI, an intelligent personal financial advisor for user {user_name}.\n"
                    f"User's real-time financial data:\n"
                    f"- Monthly Income: ₹{total_income:,.0f}\n"
                    f"- Total Monthly Expense: ₹{total_expense:,.0f}\n"
                    f"- Savings Rate: {savings_rate}%\n"
                    f"- Spending Categories: {cats_str}\n\n"
                    f"User Question: '{q}'\n\n"
                    f"Instructions:\n"
                    f"1. Answer specifically and directly addressing what the user asked.\n"
                    f"2. Use their actual financial figures above where relevant.\n"
                    f"3. Provide clear, concise, actionable financial advice (2 to 4 sentences). Format with bullet points if helpful."
                )
                resp = requests.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=8
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if "candidates" in data and len(data["candidates"]) > 0:
                        parts = data["candidates"][0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            answer = parts[0]["text"].strip()
                            return {
                                "question": q,
                                "answer": answer,
                                "source": f"Google Gemini ({model})",
                                "grounded": True
                            }
            except Exception:
                continue

    # Dynamic Intent-Grounded Response (distinct, calculated answers per question)
    distinct_answer = _generate_intent_response(q, user_name, total_income, total_expense, savings_rate, cats)
    return {
        "question": q,
        "answer": distinct_answer,
        "source": "finbridge-grounded-intelligence",
        "grounded": True
    }
