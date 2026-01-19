from fastapi import APIRouter, HTTPException, Depends, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from ..schemas.user import UserCreate, User, Token, TokenData
import jwt
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Demo account
DEMO_USER = {
    "username": "demo",
    "email": "demo@example.com",
    "hashed_password": get_password_hash("demo123"),
}

# In-memory user storage (replace with database in production)
users_by_email = {
    DEMO_USER["email"]: DEMO_USER
}
users_by_username = {
    DEMO_USER["username"]: DEMO_USER
}

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    if user.email in users_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.username in users_by_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
    }
    users_by_email[user.email] = new_user
    users_by_username[user.username] = new_user
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    user = users_by_username.get(login_request.username)
    if not user or not verify_password(login_request.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token({"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: TokenData = Depends(get_current_user)):
    user = users_by_email.get(current_user.email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"username": user["username"], "email": user["email"]}

@router.get("/test-token")
async def test_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, "your-secret-key-here", algorithms=["HS256"])
        return {"valid": True, "payload": payload}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token") 