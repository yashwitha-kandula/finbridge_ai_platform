import duckdb

FILE_PATH = "finbridge_ai_platform/ml/data/transactions_50M.parquet"

con = duckdb.connect()

print("=" * 70)
print("FINBRIDGE AI - DATASET 2 INSPECTION")
print("=" * 70)

# 1. Total rows
print("\n1. TOTAL ROWS")

result = con.execute(f"""
    SELECT COUNT(*) AS total_rows
    FROM read_parquet('{FILE_PATH}')
""").fetchone()

print(f"Total rows: {result[0]:,}")


# 2. Columns and data types
print("\n2. COLUMNS AND DATA TYPES")

schema = con.execute(f"""
    DESCRIBE SELECT *
    FROM read_parquet('{FILE_PATH}')
""").fetchdf()

print(schema.to_string(index=False))


# 3. First 10 rows
print("\n3. FIRST 10 ROWS")

sample = con.execute(f"""
    SELECT *
    FROM read_parquet('{FILE_PATH}')
    LIMIT 10
""").fetchdf()

print(sample.to_string(index=False))


# 4. Missing values
print("\n4. MISSING VALUES")

columns = schema["column_name"].tolist()

for column in columns:

    query = f"""
        SELECT COUNT(*) AS missing_count
        FROM read_parquet('{FILE_PATH}')
        WHERE "{column}" IS NULL
    """

    missing = con.execute(query).fetchone()[0]

    print(f"{column}: {missing:,}")


# 5. Summary
print("\n5. DATASET SUMMARY")

print(f"Number of columns: {len(columns)}")
print(f"Number of rows: {result[0]:,}")

print("\n" + "=" * 70)
print("DATASET 2 INSPECTION COMPLETED")
print("=" * 70)

con.close()