# FinBridge AI is designed as an adaptive financial management and decision-support platform rather than a fixed monthly budgeting application. Its architecture should accommodate diverse income frequencies, irregular cash flows, user-defined financial categories, different debt structures, family configurations, and evolving financial goals.

# FinBridge AI

## Adaptive AI-Powered Personal & Family Financial Management and Decision-Support Platform

---

# ▶ Minor Project — Implementation, Setup & Status (2026-10-06)

> The vision document follows below. This section describes **what is actually implemented and verified**.

**Status:** working end to end. `pytest`: 29 passed. `scripts/e2e_check.py`: 13/13 passed (incl. PostgreSQL). Frontend build OK.
See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the per-module evidence.

### Quick start (Windows PowerShell, from `finbridge_ai_platform/`)
```powershell
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env      # then set DATABASE_URL
python -m uvicorn backend.app.main:app --port 8000      # API + Swagger: http://localhost:8000/docs
cd frontend; npm install; npm run dev                    # UI: http://localhost:5173
python -m pytest                                         # tests
python scripts/e2e_check.py                              # end-to-end demo check (backend + frontend running)
```

### Team
M1 — Backend / DB · M2 — Frontend / dashboard / M2 analytics service · M3 — ML, forecasting, recommendations, AI assistant

### Tech stack
FastAPI · Pydantic v2 · SQLAlchemy · PostgreSQL · scikit-learn · NumPy/Pandas · DuckDB · React 18 · Vite · Recharts

### Implemented modules
Data processing · spending analysis · forecasting (with MAE/MAPE backtest) · debt prioritization · goals · financial health · explainable recommendations · grounded AI assistant · dashboard (7 pages, Light/Dark/System theme) · family household panel · LR/RF classifier (test F1 0.973 / 0.919).

### Honest limitations
- Transactions come from a **simulated demo connector** (`/api/demo/dataset`). There is **no live bank integration**.
- The AI assistant is rule-based with grounded templates. No LLM is connected yet.
- The analytics APIs take data in the request; they aren't yet reading from the DB tables. There is no authentication.
- `ml/data/transactions_50M.parquet` (1.5 GB) is in Git history. It must be removed from history before pushing to GitHub.

### Documentation
[Architecture](docs/ARCHITECTURE.md) · [Demo guide](docs/DEMO_GUIDE.md) · [Final outcomes](docs/FINAL_OUTCOMES.md) · [Changelog](docs/CHANGELOG.md) ·
[backend](backend/README.md) · [frontend](frontend/README.md) · [ml](ml/README.md) · [database](database/README.md) · [ai](ai/README.md)

### Future (major project)
Regulated account-aggregator integration and consent management, auth and RBAC, DB-driven analytics, LLM + MCP tools, property valuation and market alerts, advanced family finance, multilingual UI, deployment.

---

# 1. Project Vision

FinBridge AI is an adaptive financial management and decision-support platform designed to support people and families with different financial lifestyles.

The application should not assume that every user:

- receives a fixed monthly salary,
- spends the same amount every month,
- has only one income source,
- follows predefined financial categories,
- receives income on a fixed date,
- has a simple family structure,
- has only institutional loans, or
- follows a traditional monthly budgeting model.

Instead, FinBridge AI should adapt to the user's actual financial situation.

The system should support:

- salaried employees
- daily-wage workers
- farmers and seasonal-income families
- freelancers
- business owners
- startup founders
- people with multiple income sources
- families with multiple earners
- users with irregular or delayed income
- users with different loan and debt structures
- users with different assets and properties
- users with different financial goals

---

# 2. Core Philosophy

## "FinBridge should adapt to the user's financial life, not force the user's financial life into a fixed template."

The system should provide structure where structure is useful while allowing flexibility where real-world financial situations differ.

### Standardized

The system should standardize information that is necessary for reliable calculations.

Examples:

- transaction type
- financial event status
- dates
- amounts
- authentication
- database relationships

### Flexible

Users should be able to define information that cannot realistically be predicted in advance.

Examples:

- custom categories
- custom income sources
- custom goals
- custom financial events
- different family structures
- unusual financial situations

### AI-assisted

AI should interpret, analyze and recommend.

AI should not silently rewrite the user's original financial information.

---

# 3. Major Project Goal

By the completion of the major project, FinBridge AI should become a flexible financial intelligence platform capable of understanding different financial patterns rather than functioning only as a basic expense tracker.

The system should eventually understand:

```text
WHO is the user?
        ↓
HOW does the user earn?
        ↓
WHEN does the user receive money?
        ↓
WHAT expenses occur?
        ↓
WHAT debts exist?
        ↓
WHAT assets exist?
        ↓
WHO depends on the user?
        ↓
WHAT financial goals exist?
        ↓
WHAT future financial events are coming?
        ↓
WHAT is the user's projected cash flow?
        ↓
WHAT financial decisions may require attention?
```

---

# 4. Real-World Financial Patterns

FinBridge must be designed to support different financial patterns.

## Farmer

Example:

- income after harvest
- seasonal expenses
- seeds
- fertilizer
- labour
- agricultural loans
- household expenses
- education expenses

The system must not incorrectly convert seasonal income into an artificial monthly salary.

---

## Daily-Wage Worker

Example:

- daily earnings
- variable working days
- irregular monthly income
- daily expenses
- family responsibilities

The system should calculate financial patterns from actual income events.

---

## Salaried Employee

Example:

- monthly salary
- recurring expenses
- investments
- loans
- emergency fund
- future goals

Traditional monthly budgeting should work naturally.

---

## Freelancer

Example:

- project-based income
- completed work
- pending payments
- delayed client payments
- irregular expenses
- multiple clients

The system should distinguish expected income from actually received income.

---

## Business Owner

Example:

- multiple business income sources
- variable revenue
- business expenses
- personal expenses
- loans
- assets
- investments

---

## Startup Founder

Example:

- irregular personal income
- investments
- loans
- business-related financial obligations
- long-term goals

---

# 5. Three-Member Architecture

FinBridge AI is divided into three major development areas.

```text
MEMBER 1
Backend + Database + Financial Data Architecture + Core Financial Engine

        ↓

MEMBER 2
Frontend + User Experience + Financial Dashboard + User Interaction

        ↓

MEMBER 3
AI/ML + Forecasting + Recommendations + AI Assistant
```

The members work independently where possible but follow shared contracts.

---

# 6. MEMBER 1 — Backend, Database & Financial Engine

## Primary Goal

Member 1 is responsible for building the reliable financial foundation of FinBridge.

Member 1 should ensure that the application can correctly store, validate, retrieve and calculate financial information.

### Member 1 owns:

- Backend architecture
- FastAPI
- API contracts
- PostgreSQL
- Database design
- SQLAlchemy/ORM
- Authentication backend
- Financial APIs
- Transaction processing
- Income processing
- Expense processing
- Loan processing
- Asset/property processing
- Goal processing
- Family data
- Future financial events
- Cash-flow calculations
- Core financial business logic
- Backend testing
- API documentation

---

# 7. Member 1 — Architecture Principle

Member 1 must not design the database only around monthly salaried users.

The database must support:

```text
Daily
Weekly
Biweekly
Monthly
Quarterly
Half-yearly
Yearly
Seasonal
Project-based
Irregular
```

where appropriate.

---

# 8. Member 1 — Income Architecture

Income must support:

```text
Income Source
    ↓
Income Events
```

An income source may contain:

- source name
- source type
- frequency
- expected amount
- actual amount
- expected date
- received date
- status
- category
- user

Possible statuses:

```text
EXPECTED
PARTIALLY_RECEIVED
RECEIVED
DELAYED
CANCELLED
```

This supports:

- salary
- agriculture
- daily wages
- freelance projects
- rental income
- business income
- multiple income sources

---

# 9. Member 1 — Flexible Categories

FinBridge should provide system categories for convenience.

Users must also be able to create their own categories.

Example:

```text
System:
Food
Transportation
Education
Healthcare

User:
Pet Care
Festival Expenses
Farming
Special Business Expense
```

System categories and user-created categories must remain distinguishable.

The original user category must be preserved.

---

# 10. Member 1 — Financial Modules

Member 1 should implement the backend foundation for:

```text
Users
Profiles
Income Sources
Income Events
Transactions
Categories
Expenses
Loans
Loan Payments
Investments
Assets
Properties
Financial Goals
Family Members
Future Expenses
Cash Flow
Forecast Data
Recommendations
Conversations
Messages
Audit Logs
```

The exact database schema should be finalized during architecture validation before implementation.

---

# 11. Member 1 — Core Financial Engine

The backend should eventually calculate:

- total income
- total expenses
- total investments
- outstanding debt
- interest burden
- loan payment history
- available cash
- projected cash flow
- upcoming financial obligations
- goal progress
- income variability
- expense patterns

The engine should support both historical and future financial events.

---

# 12. MEMBER 2 — Frontend, UX & User Interaction

## Primary Goal

Member 2 is responsible for making FinBridge understandable and usable for different types of users.

Member 2 should not build a frontend that assumes the user understands financial terminology.

The UI should make complex financial information simple.

---

# 13. Member 2 — Main Responsibilities

Member 2 owns:

- frontend architecture
- UI/UX
- responsive design
- dashboard
- forms
- navigation
- financial visualizations
- transaction interface
- income interface
- expense interface
- loan interface
- goals interface
- family interface
- property/assets interface
- AI assistant interface
- API integration
- frontend validation
- loading/error states
- accessibility
- responsive layouts

---

# 14. Member 2 — Flexible User Interface

The frontend must reflect the flexible backend architecture.

For example:

```text
Add Income
     ↓
Choose / create income source
     ↓
Select frequency
     ↓
Expected amount
     ↓
Expected date
     ↓
Actual amount
     ↓
Received date
     ↓
Status
```

It should not simply ask:

```text
Monthly Salary: ₹____
```

because that would exclude many users.

---

# 15. Member 2 — Flexible Categories UI

The interface should show suggested system categories.

Example:

```text
Choose Category

Food
Transportation
Education
Healthcare
Housing
Shopping

+ Create my own category
```

A user can create:

```text
Pet Care
```

or any other category they require.

The UI should never force the user into an "Other" category merely because the developer did not predict their situation.

---

# 16. Member 2 — Dashboard

The dashboard should eventually show:

```text
Current Financial Position
        ↓
Income
Expenses
Cash Flow
Debt
Assets
Goals
Upcoming Events
Recommendations
```

But the dashboard should adapt to available user data.

For example, a user with seasonal income should not see a misleading "monthly salary" indicator.

---

# 17. Member 2 — Visualizations

Possible visualizations:

- income trends
- expense trends
- category distribution
- cash-flow timeline
- debt progress
- loan balance
- goal progress
- future obligations
- expected vs received income
- investment allocation

Charts must communicate information clearly rather than simply adding decorative graphs.

---

# 18. MEMBER 3 — AI/ML & Financial Intelligence

## Primary Goal

Member 3 is responsible for transforming FinBridge from a financial record system into an intelligent decision-support system.

Member 3 owns:

- data analysis
- feature engineering
- forecasting
- financial pattern detection
- recommendation engine
- AI assistant
- model evaluation
- AI prompts
- AI response processing
- model integration
- explainability
- AI safety/validation

---

# 19. Member 3 — ML/AI Principle

The AI must not assume that every user has a fixed monthly income.

Models should consider:

```text
Income frequency
Income variability
Seasonality
Historical events
Expected income
Delayed income
Expense frequency
Future expenses
Debt obligations
Goals
Family responsibilities
```

---

# 20. Member 3 — Forecasting

Forecasting should eventually include:

### Expense forecasting

Predict likely future expenses using:

- historical transactions
- categories
- frequency
- seasonal patterns
- recurring expenses

### Income forecasting

Support:

- regular income
- irregular income
- seasonal income
- project income
- delayed income
- multiple income sources

### Cash-flow forecasting

Estimate:

```text
Future Income
-
Future Expenses
-
Debt Obligations
-
Planned Investments
=
Projected Cash Position
```

---

# 21. Member 3 — Recommendation Engine

Recommendations should be generated from the user's actual financial situation.

Potential inputs:

```text
Income
Expenses
Debt
Interest rates
Cash flow
Goals
Future expenses
Family obligations
Assets
Investments
Historical patterns
```

Examples of recommendation areas:

- cash-flow planning
- debt management
- goal planning
- upcoming obligations
- savings opportunities
- spending patterns
- emergency planning

Recommendations should explain the relevant financial factors rather than producing unexplained commands.

---

# 22. Member 3 — AI Assistant

The AI assistant should allow natural-language questions.

Examples:

```text
"How much money do I have available?"

"What are my biggest expense categories?"

"What payments are coming next month?"

"How much debt do I currently have?"

"How much do I need to save for my goal?"

"My income is irregular. How should I plan my upcoming expenses?"

"I have an expected income after harvest. What expenses should I plan for before then?"
```

The assistant should use structured financial data supplied by the backend.

---

# 23. AI Data Principle

The user's original financial data is the source of truth.

For example:

```text
Original Category:
Pet Care

AI Interpretation:
Pets
```

The AI interpretation must not overwrite:

```text
Pet Care
```

The AI may suggest:

```text
Suggested Group: Pets
```

but the user remains in control.

---

# 24. Member Dependencies

The development order is:

```text
                    MEMBER 1
                       │
                       │ API + Database
                       ▼
                    MEMBER 2
                       │
                       │ User Interaction
                       ▼
                    MEMBER 3
                       │
                       │ AI/ML Integration
                       ▼
                 COMPLETE SYSTEM
```

However, the members should work in parallel wherever possible.

---

# 25. Shared Contracts

All members must agree on:

### API contract

Member 1 defines the API.

Member 2 consumes the API.

Member 3 consumes structured financial data through backend services.

### Database contract

Member 1 owns the database.

Member 2 should not directly manipulate PostgreSQL.

Member 3 should not directly modify production financial records.

### Git contract

Use:

```text
main
develop
feature/member1-*
feature/member2-*
feature/member3-*
```

Each member should work in their own feature branches.

---

# 26. Development Sequence

## Stage 1 — Architecture

Members jointly understand:

- project vision
- database model
- API contract
- user flows
- AI requirements

---

## Stage 2 — Foundation

Member 1:

- backend
- database
- APIs

Member 2:

- frontend structure
- navigation
- reusable components

Member 3:

- data understanding
- dataset preparation
- ML environment
- feature definitions

---

## Stage 3 — Core Financial System

Member 1:

- users
- income
- transactions
- expenses
- loans
- goals

Member 2:

- forms
- dashboards
- transaction screens
- financial views

Member 3:

- exploratory data analysis
- financial metrics
- initial analytics

---

## Stage 4 — Intelligence

Member 1:

- analytics APIs
- cash-flow engine
- data services

Member 2:

- charts
- forecast screens
- recommendation screens

Member 3:

- forecasting
- recommendation engine
- AI assistant

---

## Stage 5 — Integration

All members:

```text
Frontend
   ↓
Backend
   ↓
Database
   ↓
Analytics
   ↓
ML
   ↓
AI Assistant
```

---

# 27. Six-Persona Validation

Before declaring the architecture complete, FinBridge should be tested against:

### Persona 1 — Farmer

Seasonal income + farm expenses + loan + family.

### Persona 2 — Daily-Wage Worker

Daily income + variable workdays + family expenses.

### Persona 3 — Salaried Employee

Monthly income + recurring expenses + investments.

### Persona 4 — Freelancer

Project income + delayed payments + irregular expenses.

### Persona 5 — Business Owner

Variable business income + expenses + loans + assets.

### Persona 6 — Startup Founder

Irregular income + investments + debt + long-term goals.

The system should handle all six without changing the fundamental architecture.

---

# 28. Zero-Cost Development Principle

The project should prioritize free/open-source tools.

Preferred foundation:

```text
Python
FastAPI
PostgreSQL

For AI, prefer locally runnable or genuinely free options during development.

The architecture should avoid unnecessary dependence on paid APIs.
---
# 29. Security Principles

Financial data is sensitive.

The application should eventually implement:

authentication

authorization

password hashing

user-level data isolation

input validation

secure API design

database constraints

audit logging

safe AI data access

prevention of unauthorized financial-data access

# 30. What Success Means

FinBridge should not be considered successful merely because:

Login works
+
Expense can be added
+
Dashboard exists

The real success criterion is:

Can FinBridge represent and intelligently analyze different real-world financial lives without forcing users into an unrealistic fixed financial model?

If yes, we are achieving the project's central goal.

## 31. Final Architecture

                         FINBRIDGE AI
                              │
                              ▼
                         USER PROFILE
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
          INCOME          EXPENSES          ASSETS
              │               │                │
              ▼               ▼                ▼
       Income Events     Transactions      Properties
              │               │
              └───────┬───────┘
                      ▼
                 CASH FLOW
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
       DEBT          GOALS         FAMILY
        │             │              │
        └─────────────┼──────────────┘
                      ▼
              FUTURE EVENTS
                      │
                      ▼
             FINANCIAL ENGINE
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     ANALYTICS    FORECASTING   PATTERNS
          │           │           │
          └───────────┼───────────┘
                      ▼
             RECOMMENDATION ENGINE
                      │
                      ▼
                AI ASSISTANT
                      │
                      ▼
               USER DECISION

## 32. Member Ownership Summary

Area

M1

M2

M3

Backend

Primary

—

Support

PostgreSQL

Primary

—

Consume

API

Primary

Consume

Consume

Authentication

Primary

UI

—

Financial Logic

Primary

Display

Analyze

Frontend

—

Primary

Support

UX

—

Primary

Support

Dashboard

API support

Primary

Analytics support

Charts

Data API

Primary

Data/ML

ML

Data support

Display

Primary

Forecasting

API

Display

Primary

Recommendations

API

Display

Primary

AI Assistant

API/data

UI

Primary

Testing

Backend

Frontend

ML/AI

Integration

Primary

Primary

Primary

## 33. Immediate Next Steps

Member 1

Complete:

Day 9 API contract

Financial architecture blueprint

Day 10 architecture validation

Database ER design

PostgreSQL implementation

Backend APIs

Core financial engine

Member 2

Complete:

Frontend architecture

Navigation

Authentication UI

Dashboard

Income UI

Expense/transaction UI

Loan UI

Goals UI

Family UI

Analytics UI

AI assistant UI

API integration

Member 3

Complete:

Data architecture understanding

Financial feature definitions

Exploratory analysis

Expense forecasting

Income/cash-flow forecasting

Pattern detection

Recommendation engine

AI assistant

AI integration

Model evaluation

## 34. Development Rule

Whenever a new feature is proposed, ask:

Question 1

Does this work for a salaried employee?

Question 2

Does this work for an irregular-income user?

Question 3

Does this work for a seasonal-income user?

Question 4

Can the user define something we did not predict?

Question 5

Will the database preserve the original user information?

Question 6

Can AI analyze it without changing the source data?

If the answer is no, reconsider the architecture before implementation.

## 35. Final Project Principle

FinBridge AI should be:

Flexible enough for different financial lives.

Structured enough for reliable calculations.

Intelligent enough to identify patterns.

Simple enough for ordinary users to understand.

Extensible enough to grow during the major project.

User-controlled rather than AI-controlled.

## 36. Ultimate Vision

FinBridge AI should eventually move beyond:

"Where did my money go?"

towards:

"What is happening with my financial situation, what is likely to happen next, and what decisions should I consider?"

while still allowing the user to make the final decision.

This is the long-term direction of the project.