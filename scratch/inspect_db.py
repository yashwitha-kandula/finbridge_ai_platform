import os
from dotenv import load_dotenv
import psycopg2

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
c = psycopg2.connect(os.environ["DATABASE_URL"].replace("postgresql+psycopg2", "postgresql"))
cur = c.cursor()
for t in ("loans", "financial_goals", "categories"):
    cur.execute(
        "select conname, pg_get_constraintdef(oid) from pg_constraint "
        "where conrelid=%s::regclass and contype='c'", (t,))
    print(t, cur.fetchall())
    cur.execute(
        "select column_name, column_default from information_schema.columns "
        "where table_name=%s and is_nullable='NO' and column_default is not null", (t,))
    print(" defaults:", cur.fetchall())
cur.execute("select column_name,column_default from information_schema.columns where table_name='transactions' and column_default is not null")
print("tx defaults:", cur.fetchall())
cur.execute("select to_regclass('public.reminders')")
print("reminders:", cur.fetchall())
