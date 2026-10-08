# AI Financial Assistant

**Implementation:** `ml/services/ai_assistant.py` · **Endpoint:** `POST /api/ai/chat`

## Flow
```
question → intent (regex: spending, income, savings, debt, forecast, goals, health, recommendations, categories, general)
         → the same analytics function the dashboard uses
         → verified key_figures
         → templated answer + data_source + grounded=true
```

## Hallucination prevention
- The answer contains only numbers computed from the supplied transactions, loans, goals and history.
- When data is missing (no loans, no goals, fewer than 2 months of history), the assistant says so and returns empty `key_figures`. It doesn't guess.
- Each response includes a `data_source` so the user can tell facts, calculations, forecasts and recommendations apart.
- Tests: `tests/test_analytics.py::test_ai_*`. `scripts/e2e_check.py` also asserts that the AI figure equals the analytics figure.

## Limitations
- No LLM is connected (there is no API key in `.env`), so phrasing is templated and intent matching is keyword-based.

## Adding an LLM (future)
Replace the response composition step: send the LLM `{question, intent, key_figures}` with a system prompt such as *"Answer only from key_figures; if a value is absent, say it is unavailable."* Keep the key in `.env` (`LLM_API_KEY`). A future MCP/tool-calling setup can expose each analytics function as a tool.