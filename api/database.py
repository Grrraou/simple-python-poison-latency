from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, JSON, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Use a proper path in the Docker environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////data/users.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Association table for ApiKey <-> Collection many-to-many relationship
apikey_collections = Table(
    'apikey_collections',
    Base.metadata,
    Column('apikey_id', Integer, ForeignKey('api_keys.id'), primary_key=True),
    Column('collection_id', Integer, ForeignKey('collections.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    collections = relationship("Collection", back_populates="owner")
    api_keys = relationship("ApiKey", back_populates="owner", cascade="all, delete-orphan")

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    request_count = Column(Integer, default=0)  # Usage counter - incremented by Go API
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="collections")
    endpoints = relationship("Endpoint", back_populates="collection", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", secondary=apikey_collections, back_populates="collections")

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String)
    method = Column(String)
    headers = Column(JSON)
    body = Column(JSON)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    collection = relationship("Collection", back_populates="endpoints")
    fail_rate = Column(Integer, default=0)
    min_latency = Column(Integer, default=0)
    max_latency = Column(Integer, default=1000)
    sandbox = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    request_count = Column(Integer, default=0)  # Usage counter - incremented by Go API

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    key = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    all_collections = Column(Boolean, default=False)  # If true, grants access to all collections
    request_count = Column(Integer, default=0)  # Usage counter - incremented by Go API
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="api_keys")
    collections = relationship("Collection", secondary=apikey_collections, back_populates="api_keys")

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 