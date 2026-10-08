from fastapi import APIRouter
from backend.app.schemas import AIChatRequest
from ml.services.ai_assistant import get_grounded_response


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"]
)


@router.post("/chat")
def ai_chat(request: AIChatRequest):
    """
    Grounded AI financial assistant.

    The assistant DOES NOT invent financial data.
    All numerical answers are derived from the supplied transactions, loans,
    goals, and forecast data. The assistant identifies the user's intent,
    routes to the appropriate analytics function, and returns a verified answer.

    Architecture note: This endpoint implements the context-extraction and
    data-grounding layer. An LLM (OpenAI/Gemini) can be plugged in at the
    response-generation step once an API key is configured.
    """
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
