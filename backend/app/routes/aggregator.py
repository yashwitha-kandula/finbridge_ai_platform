from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from .auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/aggregator", tags=["Bank Aggregation"])

class BankTransactionSync(BaseModel):
    date: str
    type: str
    category: str
    amount: float
    description: str

@router.post("/webhook/sync")
def sync_bank_transactions(
    transactions: List[BankTransactionSync], 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Webhook for external bank aggregators (like Plaid or Setu).
    Automatically imports and categorizes transactions into the user's database.
    """
    new_records = []
    for tx in transactions:
        record = models.Transaction(
            user_id=current_user.id,
            date=tx.date,
            type=tx.type,
            category=tx.category,
            amount=tx.amount,
            description=tx.description,
            source="aggregator_webhook"
        )
        new_records.append(record)
    
    db.add_all(new_records)
    db.commit()
    return {"status": "success", "synced_records": len(new_records)}
