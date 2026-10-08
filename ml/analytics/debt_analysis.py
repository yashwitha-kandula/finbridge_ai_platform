from typing import List, Dict, Any


def analyze_debt(
    loans: List[Dict[str, Any]]
) -> Dict[str, Any]:

    total_principal = 0.0
    total_outstanding = 0.0
    annual_interest = 0.0

    loan_details = []

    for loan in loans:

        principal = float(
            loan.get("principal", 0) or 0
        )

        outstanding = float(
            loan.get("outstanding_balance", 0) or 0
        )

        interest_rate = float(
            loan.get("interest_rate", 0) or 0
        )

        total_principal += principal
        total_outstanding += outstanding

        annual_interest += (
            outstanding * interest_rate / 100
        )

        loan_details.append({
            "loan_id": loan.get("loan_id"),
            "lender": loan.get("lender"),
            "principal": principal,
            "outstanding_balance": outstanding,
            "interest_rate": interest_rate
        })

    loan_details.sort(
        key=lambda x: x["interest_rate"],
        reverse=True
    )

    return {
        "total_principal": round(total_principal, 2),
        "total_outstanding": round(total_outstanding, 2),
        "estimated_annual_interest": round(
            annual_interest, 2
        ),
        "loan_count": len(loans),
        "priority_order": loan_details
    }