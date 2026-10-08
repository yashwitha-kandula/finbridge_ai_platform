from typing import Dict, List


def generate_recommendations(
    summary: Dict,
    debt: Dict,
    spending: Dict
) -> List[Dict]:

    recommendations = []

    income = summary.get("total_income", 0)
    expenses = summary.get("total_expense", 0)
    savings_rate = summary.get("savings_rate", 0)

    if income > 0 and savings_rate < 10:

        recommendations.append({
            "type": "savings",
            "priority": "high",
            "title": "Improve savings",
            "message": (
                "Your current savings rate is relatively low."
            ),
            "reason": (
                f"Current savings rate: {savings_rate}%"
            )
        })

    if debt.get("estimated_annual_interest", 0) > 0:

        priority_loans = debt.get(
            "priority_order", []
        )

        if priority_loans:

            highest = priority_loans[0]

            recommendations.append({
                "type": "debt",
                "priority": "high",
                "title": "Review high-interest debt",
                "message": (
                    f"Review the loan from "
                    f"{highest.get('lender', 'the listed lender')}."
                ),
                "reason": (
                    f"Interest rate: "
                    f"{highest.get('interest_rate', 0)}%"
                )
            })

    highest_category = spending.get(
        "highest_category"
    )

    if highest_category:

        recommendations.append({
            "type": "spending",
            "priority": "medium",
            "title": "Review largest spending category",
            "message": (
                f"{highest_category} is currently "
                "your largest expense category."
            ),
            "reason": (
                f"Amount: ₹"
                f"{spending.get('highest_amount', 0):,.2f}"
            )
        })

    return recommendations