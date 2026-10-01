from fastapi import FastAPI, HTTPException, status
from app.schemas import ExpenseCreate, ExpenseUpdate

app = FastAPI(
    title="FinBridge AI ",
    description="Backend API for AI-powered personal financial management",
    version="1.0.0"
)


# Temporary data
expenses = [
    {
        "id": 1,
        "amount": 500,
        "category": "Food",
        "description": "Lunch"
    },
    {
        "id": 2,
        "amount": 1000,
        "category": "Transport",
        "description": "Fuel"
    }
]


# -------------------------
# HOME
# -------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to FinBridge AI",
        "status": "Backend is running"
    }


# -------------------------
# GET ALL EXPENSES
# -------------------------

@app.get("/expenses")
def get_expenses():
    return {
        "success": True,
        "expenses": expenses
    }


# -------------------------
# GET ONE EXPENSE
# -------------------------

@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):

    for expense in expenses:
        if expense["id"] == expense_id:
            return {
                "success": True,
                "expense": expense
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )


# -------------------------
# CREATE EXPENSE
# -------------------------

@app.post(
    "/expenses",
    status_code=status.HTTP_201_CREATED
)
def create_expense(expense: ExpenseCreate):

    new_expense = {
        "id": len(expenses) + 1,
        "amount": expense.amount,
        "category": expense.category,
        "description": expense.description
    }

    expenses.append(new_expense)

    return {
        "success": True,
        "message": "Expense created successfully",
        "expense": new_expense
    }


# -------------------------
# UPDATE EXPENSE
# -------------------------

@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate
):

    for item in expenses:

        if item["id"] == expense_id:

            item["amount"] = expense.amount
            item["category"] = expense.category
            item["description"] = expense.description

            return {
                "success": True,
                "message": "Expense updated successfully",
                "expense": item
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )


# -------------------------
# DELETE EXPENSE
# -------------------------

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):

    for expense in expenses:

        if expense["id"] == expense_id:

            expenses.remove(expense)

            return {
                "success": True,
                "message": "Expense deleted successfully"
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )
    