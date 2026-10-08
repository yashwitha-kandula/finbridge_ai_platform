from typing import Dict, Any, List
from statistics import mean


def calculate_financial_summary(
    transactions: List[Dict[str, Any]]
) -> Dict[str, float]:

    income = 0.0
    expenses = 0.0

    for tx in transactions:
        tx_type = str(tx.get("type", "")).lower()
        amount = float(tx.get("amount", 0) or 0)

        if tx_type == "income":
            income += amount

        elif tx_type == "expense":
            expenses += amount

    savings = income - expenses

    savings_rate = (
        (savings / income) * 100
        if income > 0
        else 0
    )

    expense_ratio = (
        (expenses / income) * 100
        if income > 0
        else 0
    )

    return {
        "total_income": round(income, 2),
        "total_expense": round(expenses, 2),
        "savings": round(savings, 2),
        "savings_rate": round(savings_rate, 2),
        "expense_ratio": round(expense_ratio, 2),
    }


def category_analysis(
    transactions: List[Dict[str, Any]]
) -> Dict[str, float]:

    categories = {}

    for tx in transactions:

        if str(tx.get("type", "")).lower() != "expense":
            continue

        category = tx.get("category") or "Uncategorized"
        amount = float(tx.get("amount", 0) or 0)

        categories[category] = (
            categories.get(category, 0) + amount
        )

    return {
        key: round(value, 2)
        for key, value in sorted(
            categories.items(),
            key=lambda item: item[1],
            reverse=True
        )
    }