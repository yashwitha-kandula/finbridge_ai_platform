"""
Goal Analysis Module — FinBridge AI

Analyzes financial goals, calculates progress, required monthly contribution,
and feasibility given income constraints.
"""

from datetime import date, datetime
from typing import List, Dict, Any, Optional


def analyze_goals(
    goals: List[Dict[str, Any]],
    monthly_income: Optional[float] = None
) -> Dict[str, Any]:
    """
    Analyze a list of financial goals.

    Parameters
    ----------
    goals : list of dicts with keys:
        name, target_amount, current_amount, target_date
    monthly_income : optional float
        Used to assess feasibility of required contributions.

    Returns
    -------
    dict with keys: goal_count, total_target, total_saved,
                    overall_progress_pct, goals (list of analyzed goals),
                    total_required_monthly, feasibility_note
    """
    analyzed = []
    total_target = 0.0
    total_saved = 0.0
    total_required_monthly = 0.0

    today = date.today()

    for goal in goals:
        name = goal.get("name", "Unnamed Goal")
        target = float(goal.get("target_amount", 0) or 0)
        current = float(goal.get("current_amount", 0) or 0)
        target_date_str = goal.get("target_date", "")

        # Remaining amount
        remaining = max(0.0, target - current)

        # Progress percentage
        progress_pct = (
            round((current / target) * 100, 1)
            if target > 0 else 0.0
        )

        # Months remaining
        months_remaining = None
        required_monthly = None
        days_remaining = None

        try:
            target_dt = datetime.strptime(
                target_date_str, "%Y-%m-%d"
            ).date()
            days_remaining = (target_dt - today).days

            if days_remaining > 0:
                months_remaining = max(
                    1,
                    round(days_remaining / 30.44)
                )
                required_monthly = (
                    round(remaining / months_remaining, 2)
                    if remaining > 0 else 0.0
                )
            else:
                months_remaining = 0
                required_monthly = remaining  # overdue

        except (ValueError, TypeError):
            pass

        # Feasibility
        feasibility = "Unknown"
        if required_monthly is not None and monthly_income and monthly_income > 0:
            ratio = required_monthly / monthly_income
            if ratio <= 0.10:
                feasibility = "Highly Feasible"
            elif ratio <= 0.20:
                feasibility = "Feasible"
            elif ratio <= 0.35:
                feasibility = "Challenging"
            else:
                feasibility = "Needs Review"

        if days_remaining is not None and days_remaining <= 0 and remaining > 0:
            feasibility = "Overdue"
        elif progress_pct >= 100:
            feasibility = "Achieved"

        total_target += target
        total_saved += current
        if required_monthly is not None:
            total_required_monthly += required_monthly

        analyzed.append({
            "name": name,
            "target_amount": round(target, 2),
            "current_amount": round(current, 2),
            "remaining_amount": round(remaining, 2),
            "progress_pct": progress_pct,
            "target_date": target_date_str,
            "days_remaining": days_remaining,
            "months_remaining": months_remaining,
            "required_monthly_contribution": required_monthly,
            "feasibility": feasibility
        })

    # Sort: overdue first, then by progress ascending
    analyzed.sort(
        key=lambda g: (
            g["feasibility"] != "Overdue",
            g["progress_pct"]
        )
    )

    overall_progress = (
        round((total_saved / total_target) * 100, 1)
        if total_target > 0 else 0.0
    )

    # Feasibility summary
    if monthly_income and monthly_income > 0 and total_required_monthly > 0:
        combined_ratio = total_required_monthly / monthly_income
        if combined_ratio <= 0.30:
            feasibility_note = (
                f"Combined goal contributions (₹{total_required_monthly:,.0f}/mo) "
                f"are {round(combined_ratio * 100, 1)}% of income — manageable."
            )
        else:
            feasibility_note = (
                f"Combined goal contributions (₹{total_required_monthly:,.0f}/mo) "
                f"are {round(combined_ratio * 100, 1)}% of income — consider "
                "prioritizing or extending timelines."
            )
    else:
        feasibility_note = "Provide monthly income for feasibility assessment."

    return {
        "goal_count": len(goals),
        "total_target": round(total_target, 2),
        "total_saved": round(total_saved, 2),
        "total_remaining": round(total_target - total_saved, 2),
        "overall_progress_pct": overall_progress,
        "total_required_monthly": round(total_required_monthly, 2),
        "feasibility_note": feasibility_note,
        "goals": analyzed
    }
