import duckdb

FILE_PATH = "finbridge_ai_platform/ml/data/transactions_50M.parquet"

con = duckdb.connect()

print("=" * 70)
print("FINBRIDGE AI - DATASET 2 DISTRIBUTION ANALYSIS")
print("=" * 70)


# --------------------------------------------------
# 1. Transaction types
# --------------------------------------------------

print("\n1. TRANSACTION TYPES")

transaction_types = con.execute(f"""
    SELECT
        transaction_type,
        COUNT(*) AS transaction_count
    FROM read_parquet('{FILE_PATH}')
    GROUP BY transaction_type
    ORDER BY transaction_count DESC
""").fetchdf()

print(transaction_types.to_string(index=False))


# --------------------------------------------------
# 2. Merchant categories
# --------------------------------------------------

print("\n2. MERCHANT CATEGORIES")

merchant_categories = con.execute(f"""
    SELECT
        merchant_category,
        COUNT(*) AS transaction_count
    FROM read_parquet('{FILE_PATH}')
    GROUP BY merchant_category
    ORDER BY transaction_count DESC
""").fetchdf()

print(merchant_categories.to_string(index=False))


# --------------------------------------------------
# 3. Currency distribution
# --------------------------------------------------

print("\n3. CURRENCIES")

currencies = con.execute(f"""
    SELECT
        currency,
        COUNT(*) AS transaction_count
    FROM read_parquet('{FILE_PATH}')
    GROUP BY currency
    ORDER BY transaction_count DESC
""").fetchdf()

print(currencies.to_string(index=False))


# --------------------------------------------------
# 4. Status distribution
# --------------------------------------------------

print("\n4. TRANSACTION STATUS")

statuses = con.execute(f"""
    SELECT
        status,
        COUNT(*) AS transaction_count
    FROM read_parquet('{FILE_PATH}')
    GROUP BY status
    ORDER BY transaction_count DESC
""").fetchdf()

print(statuses.to_string(index=False))


# --------------------------------------------------
# 5. Amount statistics
# --------------------------------------------------

print("\n5. AMOUNT STATISTICS")

amount_stats = con.execute(f"""
    SELECT
        MIN(amount) AS minimum_amount,
        MAX(amount) AS maximum_amount,
        AVG(amount) AS average_amount,
        MEDIAN(amount) AS median_amount
    FROM read_parquet('{FILE_PATH}')
""").fetchdf()

print(amount_stats.to_string(index=False))


# --------------------------------------------------
# 6. Date range
# --------------------------------------------------

print("\n6. TRANSACTION DATE RANGE")

date_range = con.execute(f"""
    SELECT
        MIN(transaction_timestamp) AS earliest_transaction,
        MAX(transaction_timestamp) AS latest_transaction
    FROM read_parquet('{FILE_PATH}')
""").fetchdf()

print(date_range.to_string(index=False))


print("\n" + "=" * 70)
print("DATASET 2 ANALYSIS COMPLETED")
print("=" * 70)

con.close()