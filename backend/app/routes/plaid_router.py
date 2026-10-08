import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from .auth import get_current_user
from pydantic import BaseModel

PLAID_CLIENT_ID = "6ac4bdd5e7835a000da4fc29"
PLAID_SECRET = "b456077a7237946f169abc21f1aeef"
PLAID_ENV = "sandbox"
PLAID_URL = f"https://{PLAID_ENV}.plaid.com"

router = APIRouter(prefix="/api/plaid", tags=["Plaid Bank Integration"])

@router.post("/create_link_token")
def create_link_token(current_user: models.User = Depends(get_current_user)):
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "client_name": "FinBridge AI",
        "country_codes": ["US"],
        "language": "en",
        "user": {"client_user_id": str(current_user.id)},
        "products": ["transactions"]
    }
    res = requests.post(f"{PLAID_URL}/link/token/create", json=payload)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail=res.json())
    return res.json()

class ExchangeRequest(BaseModel):
    public_token: str

@router.post("/exchange_public_token")
def exchange_public_token(req: ExchangeRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "public_token": req.public_token
    }
    res = requests.post(f"{PLAID_URL}/item/public_token/exchange", json=payload)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail=res.json())
    
    data = res.json()
    current_user.plaid_access_token = data["access_token"]
    db.commit()
    
    return {"status": "success", "message": "Bank connected!"}
    
@router.post("/sync")
def sync_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.plaid_access_token:
        raise HTTPException(status_code=400, detail="Bank not connected")
        
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "access_token": current_user.plaid_access_token
    }
    res = requests.post(f"{PLAID_URL}/transactions/sync", json=payload)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail=res.json())
        
    data = res.json()
    added = data.get("added", [])
    
    # Save to DB
    new_records = []
    for tx in added:
        # Map Plaid tx to our schema
        record = models.Transaction(
            user_id=current_user.id,
            date=tx.get("date") or tx.get("authorized_date", "2026-10-01"),
            type="Expense" if tx["amount"] > 0 else "Income",
            category=tx["category"][0] if tx.get("category") else "General",
            amount=abs(tx["amount"]),
            description=tx.get("name", "Bank Transaction"),
            source="plaid"
        )
        new_records.append(record)
        
    if new_records:
        db.add_all(new_records)
        db.commit()
        
    return {"status": "success", "synced": len(new_records)}
