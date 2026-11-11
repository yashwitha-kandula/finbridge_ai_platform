from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from .. import models
from ..database import get_db
from pydantic import BaseModel

SECRET_KEY = "super-secret-key-for-finbridge-deployment-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    mobile: Optional[str] = None
    preferred_language: str = "English"
    country: str = "India"
    currency: str = "INR (₹)"
    dob: Optional[str] = None
    profession: str = "Software Engineer"
    income_type: str = "Salary / Fixed Income"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    dob: Optional[str] = None
    country: Optional[str] = None
    preferred_language: Optional[str] = None
    currency: Optional[str] = None
    profession: Optional[str] = None
    income_type: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        mobile=user.mobile,
        preferred_language=user.preferred_language,
        country=user.country,
        currency=user.currency,
        dob=user.dob,
        profession=user.profession,
        income_type=user.income_type
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "mobile": current_user.mobile,
        "preferred_language": current_user.preferred_language,
        "country": current_user.country,
        "currency": current_user.currency,
        "dob": current_user.dob,
        "profession": current_user.profession,
        "income_type": current_user.income_type,
        "cibil_score": current_user.cibil_score
    }

@router.put("/me")
@router.post("/me")
def update_user_profile(
    updates: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if updates.full_name is not None:
        current_user.full_name = updates.full_name.strip()
    if updates.mobile is not None:
        current_user.mobile = updates.mobile.strip()
    if updates.dob is not None:
        current_user.dob = updates.dob
    if updates.country is not None:
        current_user.country = updates.country
    if updates.preferred_language is not None:
        current_user.preferred_language = updates.preferred_language
    if updates.currency is not None:
        current_user.currency = updates.currency
    if updates.profession is not None:
        current_user.profession = updates.profession
    if updates.income_type is not None:
        current_user.income_type = updates.income_type

    db.commit()
    db.refresh(current_user)
    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "mobile": current_user.mobile,
            "preferred_language": current_user.preferred_language,
            "country": current_user.country,
            "currency": current_user.currency,
            "dob": current_user.dob,
            "profession": current_user.profession,
            "income_type": current_user.income_type
        }
    }
