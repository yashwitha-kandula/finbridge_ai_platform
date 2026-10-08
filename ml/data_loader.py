import pandas as pd
from sqlalchemy import create_engine, text


# --------------------------------------------------
# FinBridge AI - M3 Day 1
# PostgreSQL Database Connection
# --------------------------------------------------

DATABASE_URL = (
    "postgresql+psycopg2://postgres:YOUR_PASSWORD"
    "@localhost:5432/financial_ai_db"
)

engine = create_engine(DATABASE_URL)


def load_transactions(user_id=None):
    """
    Load transaction data from the FinBridge AI database.
    """

    query = """
        SELECT
            id,
            user_id,
            category_id,
            income_source_id,
            amount,
            transaction_type,
            description,
            transaction_date,
            payment_method,
            is_recurring
        FROM transactions
    """

    params = {}

    if user_id is not None:
        query += " WHERE user_id = :user_id"
        params["user_id"] = user_id

    query += " ORDER BY transaction_date ASC"

    with engine.connect() as connection:
        dataframe = pd.read_sql(
            text(query),
            connection,
            params=params
        )

    return dataframe


# --------------------------------------------------
# Test the data loader
# --------------------------------------------------

if __name__ == "__main__":

    print("===================================")
    print(" FinBridge AI - M3 Day 1")
    print(" Transaction Data Loader")
    print("===================================")

    print("\nLoading transactions...")

    transactions = load_transactions()

    print("\nTransaction Data:")
    print(transactions)

    print("\nShape:")
    print(transactions.shape)

    print("\nColumns:")
    print(transactions.columns.tolist())

    print("\nData Types:")
    print(transactions.dtypes)

    print("\nMissing Values:")
    print(transactions.isnull().sum())

    print("\nData loading completed successfully!")