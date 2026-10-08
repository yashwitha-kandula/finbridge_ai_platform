from fastapi import APIRouter

router = APIRouter(prefix="/api/demo", tags=["Demo Data"])


@router.get("/dataset")
def demo_dataset():
    """
    DEMONSTRATION DATA ONLY (not real user data).

    Simulated transaction feed standing in for a future bank/account-aggregator
    connector. The frontend loads this, then calls the real analytics APIs.
    """
    return {
        "is_demo": True,
        "source": "Simulated demo connector (no live bank integration)",
        "profile": {"language": "en", "currency": "INR", "timezone": "Asia/Kolkata"},
        "transactions": [
            {"date": "2026-08-01", "type": "Income", "category": "Salary", "amount": 30000},
            {"date": "2026-08-02", "type": "Income", "category": "Freelance", "amount": 6000},
            {"date": "2026-08-03", "type": "Expense", "category": "Food", "amount": 3500},
            {"date": "2026-08-05", "type": "Expense", "category": "Transport", "amount": 1800},
            {"date": "2026-08-10", "type": "Expense", "category": "Education", "amount": 4000},
            {"date": "2026-08-14", "type": "Expense", "category": "Rent", "amount": 12000},
            {"date": "2026-08-18", "type": "Expense", "category": "Utilities", "amount": 2200},
            {"date": "2026-08-22", "type": "Expense", "category": "Medical", "amount": 10500},
        ],
        "loans": [
            {"loan_id": 1, "lender": "Test Lender (bank)", "principal": 100000,
             "outstanding_balance": 96000, "interest_rate": 12},
            {"loan_id": 2, "lender": "Informal loan (relative)", "principal": 20000,
             "outstanding_balance": 15000, "interest_rate": 6},
            {"loan_id": 3, "lender": "Gold loan", "principal": 50000,
             "outstanding_balance": 48000, "interest_rate": 18},
        ],
        "goals": [
            {"name": "Emergency Fund", "target_amount": 100000, "current_amount": 30000,
             "target_date": "2027-03-31"},
            {"name": "College Fees", "target_amount": 20000, "current_amount": 20000,
             "target_date": "2026-10-01"},
            {"name": "New Laptop", "target_amount": 80000, "current_amount": 45000,
             "target_date": "2027-06-30"},
        ],
        "monthly_expenses_history": [18000, 19500, 22000, 20500, 21000, 23000, 34000],
        "family_members": [
            {"name": "Self", "role": "Earner", "monthly_income": 36000},
            {"name": "Spouse", "role": "Earner", "monthly_income": 18000},
            {"name": "Parent", "role": "Dependent", "monthly_income": 0},
        ],
    }
