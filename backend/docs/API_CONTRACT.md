# FinBridge AI - API Contract

## Version

API Version: v1

Base URL:

http://127.0.0.1:8000/api/v1

---

# 1. API Design Principle

FinBridge AI uses structured transaction types with flexible user-defined categories.

The system provides predefined transaction types for consistency.

Users can select existing system categories or create their own categories.

The system must preserve the original user-defined category.

AI/ML components may later suggest grouping or normalization, but AI must not silently modify the user's original financial data.

---

# 2. Transaction Classification

## Transaction Type

Transaction type is standardized.

Available transaction types:

- INCOME
- EXPENSE
- INVESTMENT
- LOAN
- LOAN_PAYMENT
- TRANSFER

Example:

{
    "transaction_type": "EXPENSE"
}

---

# 3. Category System

Categories are divided into two sources.

## System Categories

Categories provided by FinBridge AI.

Examples:

- Food
- Transportation
- Education
- Healthcare
- Housing
- Shopping
- Entertainment
- Family
- Travel

## User Categories

Categories created by the user.

Examples:

- Pet Care
- Festival Expenses
- Farming
- Side Business
- Special Events

Users are not restricted to the predefined system categories.

---

# 4. Category Data Model

A category should contain:

- id
- user_id
- name
- transaction_type
- parent_category_id
- source
- created_at

Source values:

SYSTEM
USER

Example system category:

{
    "id": 1,
    "user_id": null,
    "name": "Food",
    "transaction_type": "EXPENSE",
    "parent_category_id": null,
    "source": "SYSTEM"
}

Example user-created category:

{
    "id": 25,
    "user_id": 3,
    "name": "Pet Care",
    "transaction_type": "EXPENSE",
    "parent_category_id": null,
    "source": "USER"
}

---

# 5. Transactions

## Create Transaction

POST /api/v1/transactions

Request:

{
    "transaction_type": "EXPENSE",
    "category_id": 25,
    "amount": 1200,
    "transaction_date": "2026-09-24"
}

Response:

{
    "success": true,
    "message": "Transaction created successfully",
    "transaction_id": 101
}

---

# 6. Create User Category

POST /api/v1/categories

Request:

{
    "name": "Pet Care",
    "transaction_type": "EXPENSE"
}

Response:

{
    "success": true,
    "message": "Category created successfully",
    "category": {
        "id": 25,
        "name": "Pet Care",
        "transaction_type": "EXPENSE",
        "source": "USER"
    }
}

---

# 7. Get Available Categories

GET /api/v1/categories

Example response:

{
    "success": true,
    "categories": [
        {
            "id": 1,
            "name": "Food",
            "transaction_type": "EXPENSE",
            "source": "SYSTEM"
        },
        {
            "id": 2,
            "name": "Transportation",
            "transaction_type": "EXPENSE",
            "source": "SYSTEM"
        },
        {
            "id": 25,
            "name": "Pet Care",
            "transaction_type": "EXPENSE",
            "source": "USER"
        }
    ]
}

---

# 8. Income

## Create Income

POST /api/v1/income

Request:

{
    "category_id": 10,
    "amount": 30000,
    "income_date": "2026-09-01"
}

Possible system categories:

- Salary
- Freelance
- Business
- Rental Income
- Interest
- Dividend
- Pension
- Scholarship

Users may also create their own income categories.

---

# 9. Expenses

## Create Expense

POST /api/v1/expenses

Request:

{
    "category_id": 5,
    "amount": 1500,
    "expense_date": "2026-09-24"
}

## Get Expenses

GET /api/v1/expenses

## Update Expense

PUT /api/v1/expenses/{expense_id}

## Delete Expense

DELETE /api/v1/expenses/{expense_id}

---

# 10. Investments

## Create Investment

POST /api/v1/investments

Possible system categories:

- Stocks
- Mutual Funds
- Fixed Deposit
- Recurring Deposit
- Gold
- Bonds
- Retirement

Users may create additional investment categories.

---

# 11. Loans

## Create Loan

POST /api/v1/loans

Request:

{
    "loan_type": "PERSONAL",
    "lender_name": "Test Lender",
    "principal_amount": 100000,
    "interest_rate": 12.0,
    "borrowed_date": "2026-09-01"
}

Possible loan types:

- Personal
- Education
- Home
- Vehicle
- Gold
- Business
- Other user-defined types

The existing database column name `borrowed_date` must be retained.

---

# 12. Loan Payments

## Add Loan Payment

POST /api/v1/loans/{loan_id}/payments

Request:

{
    "payment_amount": 5000,
    "principal_paid": 4000,
    "interest_paid": 1000,
    "payment_date": "2026-09-24"
}

---

# 13. Goals

## Create Goal

POST /api/v1/goals

Request:

{
    "name": "Emergency Fund",
    "target_amount": 100000,
    "current_amount": 30000,
    "target_date": "2027-03-31"
}

Possible system goal categories:

- Emergency Fund
- Education
- Vehicle
- Home
- Travel
- Marriage
- Retirement

Users may create their own goal categories.

---

# 14. Properties

## Create Property

POST /api/v1/properties

Possible system types:

- Residential
- Commercial
- Land

Users may create additional property types when required.

---

# 15. Family

## Add Family Member

POST /api/v1/family

Possible relationship types:

- Parent
- Child
- Sibling
- Spouse
- Grandparent
- Other user-defined relationship

---

# 16. Analytics

## Monthly Summary

GET /api/v1/analytics/monthly-summary

The response may contain:

- Total income
- Total expenses
- Total investments
- Total loan payments
- Net cash flow
- Category-wise spending

---

# 17. Cash Flow

GET /api/v1/analytics/cash-flow

Example:

{
    "total_income": 50000,
    "total_expense": 30000,
    "total_investment": 5000,
    "loan_payment": 5000,
    "remaining_cash": 10000
}

---

# 18. Forecasting

GET /api/v1/forecast/expenses

The forecasting system may use:

- Historical transactions
- Transaction type
- Categories
- User-created categories
- Monthly spending patterns
- Income patterns
- Previous forecasts

Example:

{
    "predicted_monthly_expense": 25000,
    "lower_range": 20000,
    "upper_range": 30000,
    "confidence": 0.85
}

---

# 19. Recommendations

GET /api/v1/recommendations

The recommendation engine may analyze:

- Income
- Expenses
- Investments
- Loans
- Loan interest
- Financial goals
- Future expenses
- Spending categories
- User-created categories
- Cash flow
- Historical patterns

Example:

{
    "recommendations": [
        {
            "title": "Review high-interest debt",
            "priority": "HIGH"
        }
    ]
}

---

# 20. AI Assistant

POST /api/v1/assistant/ask

Request:

{
    "question": "How much can I save in the next six months?"
}

The AI assistant may use structured financial data from:

- Transactions
- Income
- Expenses
- Investments
- Loans
- Goals
- Family expenses
- Future expenses
- Forecasts
- Recommendations

The AI should explain its reasoning using available financial data.

The AI must not modify financial records without explicit user action.

---

# 21. AI Category Understanding

FinBridge AI may maintain two separate concepts:

## Original User Category

The exact category entered or selected by the user.

Example:

"Pet Care"

## AI Suggested Category

An optional AI interpretation.

Example:

"Pets"

The AI suggestion must not replace the original user category automatically.

Example:

{
    "original_category": "Pet Care",
    "ai_suggested_group": "Pets"
}

The original category must remain preserved.

---

# 22. Authentication

## Register

POST /api/v1/auth/register

## Login

POST /api/v1/auth/login

## Current User

GET /api/v1/users/me

---

# 23. Standard HTTP Status Codes

200 - Successful request

201 - Resource created

400 - Bad request

401 - Authentication required

403 - Access denied

404 - Resource not found

409 - Conflict

422 - Validation error

500 - Internal server error

---

# 24. API Design Rules

1. Transaction types should be standardized.

2. Categories should be flexible.

3. System categories and user-created categories must be distinguishable.

4. Users must be able to create their own categories.

5. User-created categories must belong to the correct user.

6. User-created categories must not affect another user's categories.

7. Original user data must be preserved.

8. AI suggestions must not silently modify user data.

9. Database IDs should be used instead of repeatedly storing category names.

10. The API should return clear validation errors.

11. Financial calculations must be performed using reliable numeric types.

12. Authentication and authorization must be applied to user-specific financial data.

---

# 25. Future Architecture

User
  ↓
Frontend
  ↓
FastAPI Backend
  ↓
Validation
  ↓
Database
  ↓
Analytics
  ↓
ML Forecasting
  ↓
Recommendation Engine
  ↓
AI Assistant

The category system will provide structured information throughout this architecture.

---

# 26. Core Design Principle

FinBridge AI should guide users without restricting them.

Predefined choices make the application easier to use.

User-created categories provide flexibility.

AI provides intelligent interpretation and recommendations.

The user's original financial information remains the source of truth.