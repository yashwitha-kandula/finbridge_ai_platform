from ml.analytics.financial_analytics import (
    calculate_financial_summary,
    category_analysis
)

from ml.analytics.spending_analysis import (
    spending_insights,
    detect_large_expenses
)

from ml.analytics.debt_analysis import (
    analyze_debt
)

from ml.analytics.financial_health import (
    financial_health_score
)

from ml.recommendations.recommendation_engine import (
    generate_recommendations
)


def generate_m2_analysis(
    transactions,
    loans
):

    summary = calculate_financial_summary(
        transactions
    )

    categories = category_analysis(
        transactions
    )

    spending = spending_insights(
        transactions
    )

    alerts = detect_large_expenses(
        transactions
    )

    debt = analyze_debt(
        loans
    )

    health = financial_health_score(
        summary["total_income"],
        summary["total_expense"],
        debt["total_outstanding"]
    )

    recommendations = generate_recommendations(
        summary,
        debt,
        spending
    )

    return {
        "summary": summary,
        "categories": categories,
        "spending": spending,
        "alerts": alerts,
        "debt": debt,
        "financial_health": health,
        "recommendations": recommendations
    }