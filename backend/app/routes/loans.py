from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from .auth import get_current_user
import random

router = APIRouter(prefix="/api/loans", tags=["Loans & CIBIL"])

@router.get("/cibil-score")
def generate_or_get_cibil(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates a realistic CIBIL score based on user's debt and transaction history,
    or returns existing if generated.
    """
    if current_user.cibil_score:
        return {"cibil_score": current_user.cibil_score, "status": "Existing"}
        
    # Heuristic algorithm to generate score
    txs = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    loans = db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()
    
    total_income = sum(t.amount for t in txs if t.type.lower() == "income")
    total_debt = sum(l.outstanding_balance for l in loans)
    
    base_score = 650
    
    if total_income > 0:
        dti_ratio = total_debt / total_income
        if dti_ratio < 0.2:
            base_score += 100
        elif dti_ratio < 0.4:
            base_score += 50
        elif dti_ratio > 0.8:
            base_score -= 80
            
    if len(loans) > 3:
        base_score -= 20 # Too many credit lines
        
    final_score = min(max(base_score + random.randint(-15, 15), 300), 900)
    
    current_user.cibil_score = final_score
    db.commit()
    
    return {"cibil_score": final_score, "status": "Generated"}

@router.get("/suggestions")
def get_loan_suggestions(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Suggests loan products based on CIBIL score"""
    score_res = generate_or_get_cibil(db, current_user)
    score = score_res["cibil_score"]
    
    suggestions = []
    if score >= 750:
        suggestions.append({"type": "Pre-approved Personal Loan", "interest_rate": "10.5%", "max_amount": 500000, "provider": "HDFC Bank", "likelihood": "High"})
        suggestions.append({"type": "Premium Credit Card", "interest_rate": "18.0%", "max_amount": 300000, "provider": "SBI Card", "likelihood": "High"})
    elif score >= 650:
        suggestions.append({"type": "Standard Personal Loan", "interest_rate": "14.0%", "max_amount": 200000, "provider": "ICICI Bank", "likelihood": "Medium"})
    else:
        suggestions.append({"type": "Secured Gold Loan", "interest_rate": "9.5%", "max_amount": 100000, "provider": "Muthoot Finance", "likelihood": "High"})
        suggestions.append({"type": "Credit Builder Card", "interest_rate": "24.0%", "max_amount": 20000, "provider": "OneCard", "likelihood": "High"})
        
    return {
        "cibil_score": score,
        "suggestions": suggestions
    }
