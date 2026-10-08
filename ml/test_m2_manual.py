from ml.services.m2_service import generate_m2_analysis


transactions = [
    {
        "date": "2026-08-01",
        "type": "Income",
        "category": "Salary",
        "amount": 30000
    },
    {
        "date": "2026-08-03",
        "type": "Expense",
        "category": "Food",
        "amount": 3500
    },
    {
        "date": "2026-08-05",
        "type": "Expense",
        "category": "Transport",
        "amount": 1800
    },
    {
        "date": "2026-08-10",
        "type": "Expense",
        "category": "Education",
        "amount": 4000
    }
]


loans = [
    {
        "loan_id": 5,
        "lender": "Test Lender",
        "principal": 100000,
        "outstanding_balance": 96000,
        "interest_rate": 12,
        "borrowed_date": "2026-08-31"
    }
]


result = generate_m2_analysis(
    transactions,
    loans
)


print("\n==============================")
print("FINBRIDGE AI - M2 TEST")
print("==============================")

print(result)