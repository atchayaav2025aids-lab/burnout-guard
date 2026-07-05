import os
import json
import base64
import hmac
import hashlib
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models.db_models import User

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/auth", tags=["authentication"])

SECRET_KEY = "employee-stress-risk-analysis-key-jwt-signing-sha256"

# Pure Python Password Hashing System
def hash_password(password: str) -> str:
    salt = uuid.uuid4().hex
    pwd_hash = hashlib.sha256(salt.encode() + password.encode()).hexdigest()
    return f"{pwd_hash}:{salt}"

def verify_password(password: str, stored_hash_salt: str) -> bool:
    try:
        stored_hash, salt = stored_hash_salt.split(":")
        pwd_hash = hashlib.sha256(salt.encode() + password.encode()).hexdigest()
        return hmac.compare_digest(pwd_hash, stored_hash)
    except Exception:
        return False

# Pure Python JWT Encoder/Decoder System
def create_jwt_token(payload: dict, expires_in_minutes: int = 1440) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    
    # Set expiration time
    exp_time = int((datetime.datetime.now() + datetime.timedelta(minutes=expires_in_minutes)).timestamp())
    payload = payload.copy()
    payload["exp"] = exp_time
    
    header_json = json.dumps(header).encode('utf-8')
    payload_json = json.dumps(payload).encode('utf-8')
    
    header_b64 = base64.urlsafe_b64encode(header_json).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode().rstrip("=")
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
            
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify Signature
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        expected_signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        # Parse payload
        payload_b64_padded = payload_b64 + "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64_padded.encode()).decode())
        
        # Check Expiration
        if payload.get("exp", 0) < int(datetime.datetime.now().timestamp()):
            return None
            
        return payload
    except Exception:
        return None

# Pydantic schemas
class SignUpInput(BaseModel):
    username: str
    email: str
    password: str

class LoginInput(BaseModel):
    username_or_email: str
    password: str

class PasswordResetInput(BaseModel):
    username_or_email: str
    new_password: str

security = HTTPBearer()

# Dependency to get current user context
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired or invalid."
        )
        
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="User session has been cleared due to server reset. Please log in again."
        )
        
    return user

# API Endpoints
@router.post("/signup")
def signup(input_data: SignUpInput, db: Session = Depends(get_db)):
    # Clean input usernames/emails
    username = input_data.username.strip()
    email = input_data.email.strip().lower()
    
    # Validate email format
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email address format.")
        
    # Validate uniqueness
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")
        
    new_user = User(
        username=username,
        email=email,
        hashed_password=hash_password(input_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_jwt_token({"user_id": new_user.id, "username": new_user.username})
    return {"token": token, "username": new_user.username, "email": new_user.email}

@router.post("/login")
def login(input_data: LoginInput, db: Session = Depends(get_db)):
    login_id = input_data.username_or_email.strip()
    
    # Support username or email login
    user = db.query(User).filter(
        (User.username == login_id) | (User.email == login_id.lower())
    ).first()
    
    if not user or not verify_password(input_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username/email or password.")
        
    token = create_jwt_token({"user_id": user.id, "username": user.username})
    return {"token": token, "username": user.username, "email": user.email}

@router.post("/forgot-password")
def forgot_password(input_data: PasswordResetInput, db: Session = Depends(get_db)):
    login_id = input_data.username_or_email.strip()
    user = db.query(User).filter(
        (User.username == login_id) | (User.email == login_id.lower())
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    user.hashed_password = hash_password(input_data.new_password)
    db.commit()
    return {"message": "Password successfully updated. Please login."}

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at
    }
