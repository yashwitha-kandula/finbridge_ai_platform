import os
import json
from typing import Dict, Any, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ml.services.ai_assistant import get_grounded_response
from backend.app.schemas import AIChatRequest
from ..database import get_db
from ..models import AssistantChat
from .auth import get_current_user

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"]
)
GEMINI_MODEL = "gemini-3.5-flash-lite"


class AskRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None


class KeyRequest(BaseModel):
    api_key: str


class ConversationMessage(BaseModel):
    id: int
    sender: Literal["user", "ai"]
    text: str = Field(min_length=1, max_length=5000)
    time: str = ""
    hasAnalysis: bool = False


class SaveChatRequest(BaseModel):
    chat_id: Optional[int] = None
    title: str = Field(min_length=1, max_length=120)
    messages: list[ConversationMessage] = Field(min_length=2, max_length=100)


def _is_supported_gemini_key(key: str) -> bool:
    key = key.strip()
    return len(key) > 20 and key.startswith(("AIza", "AQ."))


@router.get("/key-status")
def gemini_key_status():
    """Check if Gemini API key is configured."""
    key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or ""
    is_set = _is_supported_gemini_key(key)
    masked = f"{key[:6]}...{key[-4:]}" if is_set else None
    return {
        "configured": is_set,
        "masked_key": masked,
        "model": GEMINI_MODEL,
        "format_valid": is_set
    }


@router.post("/save-key")
def save_gemini_key(req: KeyRequest):
    """Save or update Gemini API key dynamically."""
    cleaned = req.api_key.strip()
    if not _is_supported_gemini_key(cleaned):
        return {"success": False, "message": "Enter a valid Google Gemini API key."}

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


@router.get("/history")
def get_chat_history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    chats = (
        db.query(AssistantChat)
        .filter(AssistantChat.user_id == user.id)
        .order_by(AssistantChat.updated_at.desc(), AssistantChat.id.desc())
        .limit(3)
        .all()
    )
    return {
        "chats": [
            {
                "id": chat.id,
                "title": chat.title,
                "messages": chat.messages,
                "updated_at": chat.updated_at.isoformat(),
            }
            for chat in chats
        ]
    }


@router.post("/history")
def save_chat_history(
    req: SaveChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    messages = [message.model_dump(mode="json") for message in req.messages]
    chat = None
    if req.chat_id is not None:
        chat = (
            db.query(AssistantChat)
            .filter(AssistantChat.id == req.chat_id, AssistantChat.user_id == user.id)
            .first()
        )
        if chat is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        chat.title = req.title
        chat.messages = messages
    else:
        chat = AssistantChat(user_id=user.id, title=req.title, messages=messages)
        db.add(chat)

    db.commit()
    db.refresh(chat)

    stale_chat_ids = [
        row[0]
        for row in (
            db.query(AssistantChat.id)
            .filter(AssistantChat.user_id == user.id)
            .order_by(AssistantChat.updated_at.desc(), AssistantChat.id.desc())
            .offset(3)
            .all()
        )
    ]
    if stale_chat_ids:
        (
            db.query(AssistantChat)
            .filter(AssistantChat.user_id == user.id, AssistantChat.id.in_(stale_chat_ids))
            .delete(synchronize_session=False)
        )
        db.commit()

    return {
        "id": chat.id,
        "title": chat.title,
        "messages": chat.messages,
        "updated_at": chat.updated_at.isoformat(),
    }


def _generate_intent_response(q: str, user_name: str, total_income: float, total_expense: float, savings_rate: float, cats: list) -> str:
    ql = q.lower()
    cats_sorted = sorted(cats, key=lambda x: x.get('value', 0), reverse=True)

    # 1. Saving question
    if any(k in ql for k in ['save', 'saving', 'reduce', 'cut']):
        if total_income <= 0 and total_expense <= 0:
            return (
                f"Hi {user_name}! I can't calculate a personalized savings plan yet because no income or "
                "expense transactions are recorded for this month. Add those records and ask again; "
                "then I can identify which categories have room to reduce."
            )
        if total_income <= 0:
            return (
                f"Your account has ₹{total_expense:,.0f} in tracked spending but no income recorded this month, "
                "so I can't calculate a savings rate yet. Add your income to get a useful savings plan."
            )
        if total_expense <= 0:
            return (
                f"You have ₹{total_income:,.0f} in tracked monthly income and no expenses recorded yet. "
                "I can't identify a spending category to cut; keep tracking expenses before setting a realistic cap."
            )
        if total_expense >= total_income:
            top = (
                f" Your largest recorded category is {cats_sorted[0]['name']} "
                f"(₹{cats_sorted[0]['value']:,.0f}); review whether any of it is flexible."
            ) if cats_sorted else ""
            return (
                f"Your tracked spending (₹{total_expense:,.0f}) is at or above your income "
                f"(₹{total_income:,.0f}), leaving no monthly surplus to grow savings.{top} "
                "Start by reviewing flexible costs and avoid cutting essentials."
            )
        top = (
            f" Your largest recorded category is {cats_sorted[0]['name']} "
            f"(₹{cats_sorted[0]['value']:,.0f}); check whether any part is optional."
        ) if cats_sorted else ""
        return (
            f"Your monthly income is ₹{total_income:,.0f} and tracked expenses are ₹{total_expense:,.0f}, "
            f"leaving ₹{total_income - total_expense:,.0f} before savings; your savings rate is {savings_rate}%. "
            f"Aim to protect part of that surplus first.{top}"
        )

    # 2. Spending question
    if any(k in ql for k in ['spend', 'expense', 'cost', 'where my money']):
        if total_expense <= 0:
            return "I don't see any expense transactions recorded for this month yet, so I can't identify your spending or top category. Add transactions and ask me again."
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
    Answer the user's exact question using their financial snapshot when Gemini is configured.
    """
    q = req.question.strip()
    ctx = req.context or {}
    user_name = ctx.get("user_name", "User").split()[0]
    total_income = float(ctx.get("total_income") or ctx.get("declared_monthly_income") or 0)
    total_expense = float(ctx.get("total_expense", 0))
    savings_rate = float(ctx.get("savings_rate", 0))
    cats = ctx.get("categories", [])
    financial_snapshot = {
        "monthly_income": total_income,
        "declared_monthly_income": float(ctx.get("declared_monthly_income") or total_income),
        "income_sources": ctx.get("income_sources", []),
        "monthly_expenses": total_expense,
        "savings_rate_percent": savings_rate,
        "currency": ctx.get("currency", "INR (₹)"),
        "expense_categories": cats,
        "goals": ctx.get("goals", []),
        "current_goal": {
            "name": ctx.get("goal_name"),
            "target_amount": ctx.get("target_amount"),
            "current_savings": ctx.get("current_savings"),
            "monthly_saving_plan": ctx.get("monthly_save"),
            "months_left": ctx.get("months_left"),
            "expected_return_percent": ctx.get("expected_return"),
        },
        "recent_transactions": ctx.get("recent_transactions", []),
        "upcoming_bills": ctx.get("upcoming_bills", []),
        "monthly_trend": ctx.get("monthly_trend", []),
        "has_financial_data": ctx.get("has_data", bool(total_income or total_expense or cats)),
    }

    # Use the API-key header so both legacy and newer Google API key formats work.
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
    if _is_supported_gemini_key(gemini_key or ""):
        import requests

        model = GEMINI_MODEL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        prompt = (
            "You are FinBridge AI, a helpful personal finance assistant. Answer the user's exact question "
            "directly; do not substitute a generic savings, spending, or investment tip when it does not answer "
            "the question. Personalize using only the supplied financial snapshot. If relevant data is missing "
            "or zero, say so plainly and ask only for the information needed. Never invent transactions, loans, "
            "goals, rates, or balances. Give clear practical guidance, explain calculations when useful, and "
            "avoid claiming investment returns are guaranteed. Use the snapshot's currency for its amounts. "
            "If the question uses a different currency, do not compare the amounts without an exchange rate.\n\n"
            f"User: {user_name}\n"
            f"Financial snapshot (JSON): {json.dumps(financial_snapshot, ensure_ascii=False)}\n\n"
            f"User's question: {q}"
        )
        try:
            resp = requests.post(
                url,
                headers={"x-goog-api-key": gemini_key.strip()},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 700},
                },
                timeout=(5, 30),
            )
        except requests.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail="Gemini could not be reached. Check the backend connection and try again.",
            ) from exc

        if resp.status_code != 200:
            try:
                provider_error = resp.json().get("error", {})
                error_code = provider_error.get("status") or provider_error.get("code")
            except ValueError:
                error_code = None
            error_suffix = f", {error_code}" if error_code else ""
            raise HTTPException(
                status_code=502,
                detail=f"Gemini rejected the request (HTTP {resp.status_code}{error_suffix}). Check the model name and API key access.",
            )

        data = resp.json()
        candidates = data.get("candidates") or []
        parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
        answer = "\n".join(part["text"].strip() for part in parts if part.get("text", "").strip())
        if not answer:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned no answer. Please rephrase your question and try again.",
            )
        return {
            "question": q,
            "answer": answer,
            "source": f"Google Gemini ({model})",
            "grounded": True,
        }

    # Dynamic Intent-Grounded Response (distinct, calculated answers per question)
    distinct_answer = _generate_intent_response(q, user_name, total_income, total_expense, savings_rate, cats)
    return {
        "question": q,
        "answer": distinct_answer,
        "source": "finbridge-grounded-intelligence",
        "grounded": True
    }
