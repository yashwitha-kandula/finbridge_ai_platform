def financial_health_score(
    income: float,
    expenses: float,
    debt: float
):

    if income <= 0:
        return {
            "score": 0,
            "status": "Insufficient data"
        }

    savings_rate = (
        (income - expenses) / income
    ) * 100

    debt_ratio = (
        debt / income
    ) * 100

    score = 50

    if savings_rate >= 30:
        score += 20
    elif savings_rate >= 10:
        score += 10
    else:
        score -= 10

    if debt_ratio <= 30:
        score += 20
    elif debt_ratio <= 60:
        score += 10
    else:
        score -= 10

    score = max(0, min(100, score))

    if score >= 75:
        status = "Strong"
    elif score >= 50:
        status = "Moderate"
    else:
        status = "Needs attention"

    return {
        "score": score,
        "status": status,
        "savings_rate": round(savings_rate, 2),
        "debt_ratio": round(debt_ratio, 2)
    }