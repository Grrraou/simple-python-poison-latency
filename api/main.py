from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import json
import secrets

from database import get_db, User as DBUser, ConfigApiKey as DBConfigApiKey

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

# Config API Key (one key -> one target URL + chaos)
class ConfigApiKeyBase(BaseModel):
    name: str
    target_url: Optional[str] = None
    fail_rate: int = 0
    min_latency: int = 0
    max_latency: int = 0
    method: str = "ANY"
    error_codes: List[int] = []

class ConfigApiKeyCreate(ConfigApiKeyBase):
    pass

class ConfigApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    target_url: Optional[str] = None
    fail_rate: Optional[int] = None
    min_latency: Optional[int] = None
    max_latency: Optional[int] = None
    method: Optional[str] = None
    error_codes: Optional[List[int]] = None

class ConfigApiKeyResponse(ConfigApiKeyBase):
    id: int
    key: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db: Session, username: str):
    return db.query(DBUser).filter(DBUser.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# Routes
@app.post("/api/auth/login")
async def login_for_access_token(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        username = body.get("username")
        password = body.get("password")
        if not username or not password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username and password are required")
        user = authenticate_user(db, username, password)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
        access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON in request body")

@app.post("/api/auth/register")
async def register_user(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        username = body.get("username")
        email = body.get("email")
        password = body.get("password")
        full_name = body.get("full_name")
        if not username or not email or not password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username, email, and password are required")
        if db.query(DBUser).filter(DBUser.username == username).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
        if db.query(DBUser).filter(DBUser.email == email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        db_user = DBUser(
            username=username, email=email, full_name=full_name,
            hashed_password=pwd_context.hash(password), disabled=False
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return User(username=db_user.username, email=db_user.email, full_name=db_user.full_name, disabled=db_user.disabled)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON in request body")

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: DBUser = Depends(get_current_user)):
    return User(username=current_user.username, email=current_user.email, full_name=current_user.full_name, disabled=current_user.disabled)

@app.get("/")
async def root():
    return {"message": "Welcome to Latency Poison API"}

# Config API Keys
def generate_config_api_key():
    return f"lp_{secrets.token_urlsafe(32)}"

@app.post("/api/config-keys/", response_model=ConfigApiKeyResponse)
async def create_config_key(data: ConfigApiKeyCreate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    db_key = DBConfigApiKey(
        name=data.name, key=generate_config_api_key(), is_active=True,
        target_url=(data.target_url or "").strip() or None,
        fail_rate=min(100, max(0, data.fail_rate)), min_latency=data.min_latency or 0, max_latency=data.max_latency or 0,
        method=(data.method or "ANY").upper(), error_codes=data.error_codes or [], owner_id=current_user.id
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return db_key

@app.get("/api/config-keys/", response_model=List[ConfigApiKeyResponse])
async def list_config_keys(db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    return db.query(DBConfigApiKey).filter(DBConfigApiKey.owner_id == current_user.id).all()

@app.get("/api/config-keys/{key_id}/", response_model=ConfigApiKeyResponse)
async def get_config_key(key_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    k = db.query(DBConfigApiKey).filter(DBConfigApiKey.id == key_id, DBConfigApiKey.owner_id == current_user.id).first()
    if k is None:
        raise HTTPException(status_code=404, detail="Config key not found")
    return k

@app.put("/api/config-keys/{key_id}/", response_model=ConfigApiKeyResponse)
async def update_config_key(key_id: int, data: ConfigApiKeyUpdate, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    k = db.query(DBConfigApiKey).filter(DBConfigApiKey.id == key_id, DBConfigApiKey.owner_id == current_user.id).first()
    if k is None:
        raise HTTPException(status_code=404, detail="Config key not found")
    if data.name is not None:
        k.name = data.name
    if data.is_active is not None:
        k.is_active = data.is_active
    if data.target_url is not None:
        k.target_url = data.target_url.strip() or None
    if data.fail_rate is not None:
        k.fail_rate = min(100, max(0, data.fail_rate))
    if data.min_latency is not None:
        k.min_latency = data.min_latency
    if data.max_latency is not None:
        k.max_latency = data.max_latency
    if data.method is not None:
        k.method = data.method.upper()
    if data.error_codes is not None:
        k.error_codes = data.error_codes
    if k.min_latency > k.max_latency:
        raise HTTPException(status_code=400, detail="min_latency cannot be greater than max_latency")
    db.commit()
    db.refresh(k)
    return k

@app.delete("/api/config-keys/{key_id}/")
async def delete_config_key(key_id: int, db: Session = Depends(get_db), current_user: DBUser = Depends(get_current_user)):
    k = db.query(DBConfigApiKey).filter(DBConfigApiKey.id == key_id, DBConfigApiKey.owner_id == current_user.id).first()
    if k is None:
        raise HTTPException(status_code=404, detail="Config key not found")
    db.delete(k)
    db.commit()
    return {"message": "Config key deleted"}
