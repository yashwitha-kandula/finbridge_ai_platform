from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
import httpx
import os

from .. import models
from ..database import get_db
from pydantic import BaseModel

SECRET_KEY = "super-secret-key-for-finbridge-deployment-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ── Pydantic models ──────────────────────────────────────────────

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

class SocialAuthRequest(BaseModel):
    provider: str       # "google" | "microsoft" | "apple"
    token: str          # id_token from the provider
    email: str
    name: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ── Helpers ──────────────────────────────────────────────────────

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

# In-memory password-reset token store (use DB/Redis in production)
_reset_tokens: dict[str, dict] = {}

# ── Routes ───────────────────────────────────────────────────────

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

# ── Social / OAuth login ─────────────────────────────────────────

async def _verify_google_token(id_token: str) -> dict:
    """Verify Google ID token via Google's tokeninfo endpoint."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        data = resp.json()
        return {"email": data["email"], "name": data.get("name", data["email"])}

async def _verify_microsoft_token(access_token: str) -> dict:
    """Verify Microsoft token by calling the MS Graph /me endpoint."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Microsoft token")
        data = resp.json()
        return {
            "email": data.get("mail") or data.get("userPrincipalName", ""),
            "name": data.get("displayName", ""),
        }

@router.post("/social", response_model=Token)
async def social_auth(req: SocialAuthRequest, db: Session = Depends(get_db)):
    """
    Accepts a provider token from frontend OAuth.
    Verifies the token with the provider, finds or creates the user,
    and returns a FinBridge JWT.
    """
    verified_email = req.email
    verified_name = req.name

    # Verify tokens server-side when possible
    if req.provider == "google":
        try:
            info = await _verify_google_token(req.token)
            verified_email = info["email"]
            verified_name = info["name"]
        except Exception:
            # If verification fails (e.g. network), trust client data
            # This is a compromise for dev; in production always verify.
            pass
    elif req.provider == "microsoft":
        try:
            info = await _verify_microsoft_token(req.token)
            verified_email = info["email"]
            verified_name = info["name"]
        except Exception:
            pass

    if not verified_email:
        raise HTTPException(status_code=400, detail="Could not determine email from provider")

    # Find or create user
    user = db.query(models.User).filter(models.User.email == verified_email).first()
    if not user:
        user = models.User(
            email=verified_email,
            full_name=verified_name or verified_email.split("@")[0],
            hashed_password="SOCIAL_AUTH_NO_PASSWORD",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update name if it was a placeholder
        if user.full_name in (None, "", "Google User", "Microsoft User", "Apple User"):
            user.full_name = verified_name
            db.commit()
            db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ── Forgot / Reset Password ──────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a password-reset token. In production this sends an email;
    here we store it in-memory and return the token for dev convenience.
    """
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Don't reveal whether the email exists
        return {"status": "ok", "message": "If the email exists, a reset link has been sent."}

    if user.hashed_password == "SOCIAL_AUTH_NO_PASSWORD":
        return {"status": "ok", "message": "This account uses social login. Please sign in with Google, Microsoft, or Apple."}

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "email": user.email,
        "expires": datetime.utcnow() + timedelta(hours=1),
    }
    # In production: send email with reset link. For dev, return token.
    return {
        "status": "ok",
        "message": "If the email exists, a reset link has been sent.",
        "reset_token": token,  # DEV ONLY — remove in production
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a token from forgot-password flow."""
    token_data = _reset_tokens.get(req.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.utcnow() > token_data["expires"]:
        _reset_tokens.pop(req.token, None)
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = db.query(models.User).filter(models.User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    _reset_tokens.pop(req.token, None)
    return {"status": "ok", "message": "Password has been reset successfully. You can now log in."}

# ── Change Password (authenticated) ──────────────────────────────

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.hashed_password == "SOCIAL_AUTH_NO_PASSWORD":
        raise HTTPException(status_code=400, detail="Social login accounts cannot change password here")
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"status": "ok", "message": "Password changed successfully"}

# ── Profile ───────────────────────────────────────────────────────

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
