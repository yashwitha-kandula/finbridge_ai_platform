# Database (PostgreSQL)

- **DB:** `finbridge_ai_db` (verified connected on 2026-10-06 via `/db-health`)
- **Connection:** `DATABASE_URL` in `backend/.env` (SQLAlchemy + psycopg2)

## Tables (created by M1)
users · profiles (language, currency, timezone) · transactions · categories (system vs user-created) · income_sources · loans · loan_payments · assets · properties · financial_goals · family_members · future_expenses · forecasts · recommendations · conversations · messages · audit_logs

Key relationships: `profiles`, `transactions`, `income_sources`, `loans`, `financial_goals` and `family_members` → `users`; `loan_payments` → `loans`; `transactions` → `categories` / `income_sources`.

Transaction types are standardized (Income, Expense, Investment, Loan, Loan Payment, Transfer). The raw category is preserved, and the AI never rewrites it.

## Test data (not real user data)
User 3 · Salary ₹30,000/month · Test Lender loan ₹100,000 @ 12% (₹96,000 outstanding) · goals: Emergency Fund, College Fees.

## Setup / backup
The repo does not contain a schema file yet. To export it from the working DB:
```powershell
pg_dump -U postgres -s finbridge_ai_db > database/schema.sql
```
Restore with `psql -U postgres -d finbridge_ai_db -f database/schema.sql`.

## Troubleshooting
"password authentication failed": make sure `DATABASE_URL` matches the `postgres` user password (`ALTER USER postgres PASSWORD '...'` in psql) and that the PostgreSQL service is running.
