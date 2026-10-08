from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import ExpenseCreate, ExpenseUpdate
from .database import get_db
from .routes.m2 import router as m2_router
from .routes.forecast import router as forecast_router
from .routes.goals import router as goals_router
from .routes.ai_assistant import router as ai_router
from .routes.demo import router as demo_router
from .routes.auth import router as auth_router
from .routes.aggregator import router as aggregator_router
from .routes.loans import router as loans_router
from .routes.plaid_router import router as plaid_router
from .routes.dashboard import router as dashboard_router
from .database import init_db

# Initialize database tables
init_db()

# ============================================================
# FINBRIDGE AI - FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="FinBridge AI",
    description=(
        "AI-powered personal and family financial management "
        "and decision-support platform. Supports variable income, "
        "family finance, debt analysis, forecasting, and grounded AI assistance."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ============================================================
# CORS — allow frontend dev server (Vite default: 5173)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(m2_router)
app.include_router(forecast_router)
app.include_router(goals_router)
app.include_router(ai_router)
app.include_router(demo_router)
app.include_router(auth_router)
app.include_router(aggregator_router)
app.include_router(loans_router)
app.include_router(plaid_router)
app.include_router(dashboard_router)


# ============================================================
# BASIC PROJECT ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to FinBridge AI",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinBridge AI Backend"
    }


@app.get("/project")
def project_info():
    return {
        "project": "FinBridge AI",
        "description": (
            "AI-powered personal and family financial management "
            "and decision-support platform"
        ),
        "scope": "Minor Project",
        "team_size": 3
    }


@app.get("/version")
def version():
    return {"version": "1.0.0"}


@app.get("/team")
def team():
    return {
        "members": 3,
        "roles": {
            "M1": (
                "Backend + Financial Data Architecture + "
                "Core Financial Intelligence"
            ),
            "M2": (
                "Frontend + User Experience + "
                "Financial Dashboard"
            ),
            "M3": (
                "AI/ML + Forecasting + Recommendations + "
                "AI Assistant"
            )
        }
    }


@app.get("/features")
def features():
    return {
        "features": [
            "Variable Income Management",
            "Expense Tracking & Analysis",
            "Transaction Processing",
            "Loan & Debt Prioritization",
            "Financial Goals Tracking",
            "Cash Flow Analytics",
            "Expense Forecasting",
            "Spending Pattern Detection",
            "Financial Health Assessment",
            "Personalized Recommendations",
            "Grounded AI Financial Assistant",
            "Family Finance Foundation"
        ]
    }


@app.get("/status")
def project_status():
    return {
        "project": "FinBridge AI",
        "status": "development",
        "backend": "FastAPI",
        "database": "PostgreSQL",
        "ml_pipeline": "operational",
        "ai_assistant": "grounded-rule-based"
    }


# ============================================================
# TEMPORARY EXPENSE CRUD ENDPOINTS (Day 8 learning — preserved)
# ============================================================

expenses = []


@app.post(
    "/expenses",
    status_code=status.HTTP_201_CREATED
)
def create_expense(expense: ExpenseCreate):

    new_expense = {
        "id": len(expenses) + 1,
        "amount": expense.amount,
        "description": expense.description
    }

    expenses.append(new_expense)

    return {
        "message": "Expense created successfully",
        "expense": new_expense
    }


@app.get("/expenses")
def get_expenses():
    return {
        "count": len(expenses),
        "expenses": expenses
    }


@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):

    for expense in expenses:

        if expense["id"] == expense_id:
            return expense

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate
):

    for expense in expenses:

        if expense["id"] == expense_id:

            if expense_update.amount is not None:
                expense["amount"] = expense_update.amount

            if expense_update.description is not None:
                expense["description"] = (
                    expense_update.description
                )

            return {
                "message": "Expense updated successfully",
                "expense": expense
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):

    for index, expense in enumerate(expenses):

        if expense["id"] == expense_id:

            deleted_expense = expenses.pop(index)

            return {
                "message": "Expense deleted successfully",
                "expense": deleted_expense
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Expense not found"
    )


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

@app.get("/db-health")
def database_health(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("SELECT current_database()")
    )

    database_name = result.scalar()

    return {
        "status": "connected",
        "database": database_name
    }


@app.get("/db-test/transactions")
def database_transaction_test(
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                id,
                amount,
                transaction_type,
                description
            FROM transactions
            ORDER BY id
        """)
    )

    transactions = []

    for row in result:

        transactions.append({
            "id": row.id,
            "amount": float(row.amount),
            "transaction_type": row.transaction_type,
            "description": row.description
        })

    return {
        "count": len(transactions),
        "transactions": transactions
    }