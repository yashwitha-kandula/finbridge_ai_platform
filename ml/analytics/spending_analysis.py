from typing import Dict, Any, List


def spending_insights(
    transactions: List[Dict[str, Any]]
) -> Dict[str, Any]:

    category_totals = {}

    for tx in transactions:

        if str(tx.get("type", "")).lower() != "expense":
            continue

        category = tx.get("category") or "Uncategorized"

        amount = float(tx.get("amount", 0) or 0)

        category_totals[category] = (
            category_totals.get(category, 0) + amount
        )

    if not category_totals:
        return {
            "highest_category": None,
            "highest_amount": 0,
            "categories": {}
        }

    highest_category = max(
        category_totals,
        key=category_totals.get
    )

    return {
        "highest_category": highest_category,
        "highest_amount": round(
            category_totals[highest_category], 2
        ),
        "categories": {
            key: round(value, 2)
            for key, value in category_totals.items()
        }
    }


def detect_large_expenses(
    transactions: List[Dict[str, Any]],
    threshold: float = 10000
):

    alerts = []

    for tx in transactions:

        if str(tx.get("type", "")).lower() != "expense":
            continue

        amount = float(tx.get("amount", 0) or 0)

        if amount >= threshold:
            alerts.append({
                "date": tx.get("date"),
                "category": tx.get("category"),
                "amount": amount,
                "message": "High-value expense detected."
            })

    return alerts