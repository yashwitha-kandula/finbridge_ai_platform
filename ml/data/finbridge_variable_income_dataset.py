import csv
import random
from datetime import date, timedelta

random.seed(42)

NUM_USERS = 1000
START_DATE = date(2025, 1, 1)
DAYS = 365

profiles = [
    "salaried",
    "daily_wage",
    "freelancer",
    "farmer",
    "small_business",
    "mixed_income"
]

payment_methods = [
    "cash",
    "upi",
    "bank_transfer",
    "debit_card"
]

expense_categories = [
    "Food",
    "Groceries",
    "Rent",
    "Utilities",
    "Transport",
    "Education",
    "Healthcare",
    "Shopping",
    "Entertainment",
    "Insurance"
]

income_sources = {
    "salaried": ["Salary"],
    "daily_wage": ["Daily Wage"],
    "freelancer": ["Freelance"],
    "farmer": ["Crop Sale"],
    "small_business": ["Business Revenue"],
    "mixed_income": ["Salary", "Freelance", "Business Revenue"]
}


def random_date():
    return START_DATE + timedelta(days=random.randint(0, DAYS - 1))


def random_expense():
    category = random.choice(expense_categories)

    ranges = {
        "Food": (100, 1500),
        "Groceries": (300, 4000),
        "Rent": (5000, 18000),
        "Utilities": (500, 4000),
        "Transport": (100, 2500),
        "Education": (500, 10000),
        "Healthcare": (300, 15000),
        "Shopping": (300, 8000),
        "Entertainment": (100, 4000),
        "Insurance": (1000, 10000)
    }

    low, high = ranges[category]
    return category, round(random.uniform(low, high), 2)


def generate_income(profile, current_date):
    """
    Returns:
        income_source, amount
    """

    month = current_date.month

    if profile == "salaried":
        return "Salary", round(random.uniform(28000, 40000), 2)

    if profile == "daily_wage":
        return "Daily Wage", round(random.uniform(500, 1200), 2)

    if profile == "freelancer":
        return "Freelance", round(random.uniform(8000, 60000), 2)

    if profile == "farmer":
        # Seasonal crop income.
        # Higher probability/value during harvest months.
        if month in [4, 5, 10, 11]:
            return "Crop Sale", round(random.uniform(40000, 180000), 2)
        else:
            return "Crop Sale", round(random.uniform(0, 5000), 2)

    if profile == "small_business":
        return "Business Revenue", round(random.uniform(5000, 50000), 2)

    if profile == "mixed_income":
        source = random.choice(
            ["Salary", "Freelance", "Business Revenue"]
        )

        if source == "Salary":
            amount = random.uniform(25000, 40000)
        elif source == "Freelance":
            amount = random.uniform(5000, 30000)
        else:
            amount = random.uniform(5000, 30000)

        return source, round(amount, 2)


rows = []

for user_number in range(1, NUM_USERS + 1):

    user_id = f"U{user_number:04d}"
    profile = random.choice(profiles)

    current_date = START_DATE

    while current_date <= START_DATE + timedelta(days=DAYS - 1):

        # -------------------------
        # INCOME
        # -------------------------

        if profile == "salaried":
            # Salary around the beginning of every month
            if current_date.day == random.randint(1, 3):
                source, amount = generate_income(profile, current_date)

                rows.append([
                    user_id,
                    profile,
                    current_date,
                    "Income",
                    source,
                    "Salary",
                    amount,
                    "bank_transfer",
                    True
                ])

        elif profile == "daily_wage":
            # Income on many working days
            if current_date.weekday() < 6 and random.random() < 0.75:
                source, amount = generate_income(profile, current_date)

                rows.append([
                    user_id,
                    profile,
                    current_date,
                    "Income",
                    source,
                    "Wages",
                    amount,
                    "cash",
                    False
                ])

        elif profile == "freelancer":
            # Irregular project payments
            if random.random() < 0.08:
                source, amount = generate_income(profile, current_date)

                rows.append([
                    user_id,
                    profile,
                    current_date,
                    "Income",
                    source,
                    "Freelance",
                    amount,
                    "bank_transfer",
                    False
                ])

        elif profile == "farmer":
            # Seasonal income
            if current_date.month in [4, 5, 10, 11]:
                if random.random() < 0.04:
                    source, amount = generate_income(profile, current_date)

                    rows.append([
                        user_id,
                        profile,
                        current_date,
                        "Income",
                        source,
                        "Crop Sale",
                        amount,
                        "bank_transfer",
                        False
                    ])

        elif profile == "small_business":
            # Frequent variable business revenue
            if random.random() < 0.25:
                source, amount = generate_income(profile, current_date)

                rows.append([
                    user_id,
                    profile,
                    current_date,
                    "Income",
                    source,
                    "Business Revenue",
                    amount,
                    random.choice(["cash", "upi", "bank_transfer"]),
                    False
                ])

        elif profile == "mixed_income":
            if random.random() < 0.08:
                source, amount = generate_income(profile, current_date)

                category = {
                    "Salary": "Salary",
                    "Freelance": "Freelance",
                    "Business Revenue": "Business Revenue"
                }[source]

                rows.append([
                    user_id,
                    profile,
                    current_date,
                    "Income",
                    source,
                    category,
                    amount,
                    random.choice(["upi", "bank_transfer"]),
                    source == "Salary"
                ])

        # -------------------------
        # EXPENSES
        # -------------------------

        if random.random() < 0.35:

            category, amount = random_expense()

            rows.append([
                user_id,
                profile,
                current_date,
                "Expense",
                "",
                category,
                amount,
                random.choice(payment_methods),
                False
            ])

        # -------------------------
        # INVESTMENT
        # -------------------------

        if current_date.day == 10 and random.random() < 0.25:

            amount = random.uniform(1000, 10000)

            rows.append([
                user_id,
                profile,
                current_date,
                "Investment",
                "",
                "Investment",
                round(amount, 2),
                "bank_transfer",
                True
            ])

        # -------------------------
        # LOAN
        # -------------------------

        if random.random() < 0.005:

            amount = random.uniform(10000, 100000)

            rows.append([
                user_id,
                profile,
                current_date,
                "Loan",
                "",
                "Personal Loan",
                round(amount, 2),
                "bank_transfer",
                False
            ])

        # -------------------------
        # LOAN PAYMENT
        # -------------------------

        if current_date.day == 15 and random.random() < 0.10:

            amount = random.uniform(1000, 15000)

            rows.append([
                user_id,
                profile,
                current_date,
                "Loan Payment",
                "",
                "Loan Repayment",
                round(amount, 2),
                "bank_transfer",
                True
            ])

        # -------------------------
        # TRANSFER
        # -------------------------

        if random.random() < 0.03:

            amount = random.uniform(500, 10000)

            rows.append([
                user_id,
                profile,
                current_date,
                "Transfer",
                "",
                "Account Transfer",
                round(amount, 2),
                "bank_transfer",
                False
            ])

        current_date += timedelta(days=1)


# -----------------------------------------
# SAVE DATASET
# -----------------------------------------

output_file = "finbridge_variable_income_dataset.csv"

headers = [
    "user_id",
    "profile_type",
    "transaction_date",
    "transaction_type",
    "income_source",
    "category",
    "amount",
    "payment_method",
    "is_recurring"
]

with open(output_file, "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file)

    writer.writerow(headers)

    writer.writerows(rows)


print("=" * 60)
print("FINBRIDGE AI DATASET 3 CREATED")
print("=" * 60)
print(f"Users: {NUM_USERS}")
print(f"Transactions: {len(rows):,}")
print(f"Output file: {output_file}")
print("=" * 60)