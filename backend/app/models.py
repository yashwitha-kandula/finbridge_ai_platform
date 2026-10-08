from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    mobile = Column(String, nullable=True)
    preferred_language = Column(String, default="English")
    country = Column(String, default="India")
    currency = Column(String, default="INR (₹)")
    dob = Column(String, nullable=True)
    profession = Column(String, default="Software Engineer")
    income_type = Column(String, default="Salary / Fixed Income")
    cibil_score = Column(Integer, default=None)
    plaid_access_token = Column(String, nullable=True)
    
    transactions = relationship("Transaction", back_populates="owner")
    loans = relationship("Loan", back_populates="owner")
    goals = relationship("FinancialGoal", back_populates="owner")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String)
    type = Column(String) # Income, Expense
    category = Column(String)
    amount = Column(Float)
    description = Column(String, nullable=True)
    source = Column(String, default="manual") # manual or aggregator
    
    owner = relationship("User", back_populates="transactions")

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lender = Column(String)
    principal = Column(Float)
    outstanding_balance = Column(Float)
    interest_rate = Column(Float)
    
    owner = relationship("User", back_populates="loans")

class FinancialGoal(Base):
    __tablename__ = "financial_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float)
    target_date = Column(String)
    
    owner = relationship("User", back_populates="goals")
