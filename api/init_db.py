from database import SessionLocal, User, Collection, Endpoint, ApiKey, Base, engine
from passlib.context import CryptContext
import os
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin user configuration from environment variables
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_FULL_NAME = os.getenv("ADMIN_FULL_NAME", "Administrator")

def init_db():
    # Create all tables (MySQL handles its own storage)
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if not admin_user:
            # Create admin user
            admin_user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                full_name=ADMIN_FULL_NAME,
                hashed_password=pwd_context.hash(ADMIN_PASSWORD),
                disabled=False
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Admin user created successfully")
            print(f"Username: {ADMIN_USERNAME}")
            print(f"Password: {ADMIN_PASSWORD}")
            
            # Create default collections for admin user
            create_demo_fixtures(db, admin_user.id)
        else:
            print(f"Admin user '{ADMIN_USERNAME}' already exists")
            # Check if collections exist, create them if not
            existing_collections = db.query(Collection).filter(Collection.owner_id == admin_user.id).count()
            if existing_collections == 0:
                print("Creating demo collections...")
                create_demo_fixtures(db, admin_user.id)
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

def create_demo_fixtures(db, user_id):
    """Create default collections and endpoints for demo user"""
    
    # Collection 1: GitHub API
    github_collection = Collection(
        name="GitHub API",
        description="GitHub REST API endpoints for testing",
        owner_id=user_id
    )
    db.add(github_collection)
    db.commit()
    db.refresh(github_collection)
    
    github_endpoints = [
        Endpoint(name="Get Users", url="https://api.github.com/users", method="GET", 
                 min_latency=100, max_latency=500, fail_rate=0, collection_id=github_collection.id),
        Endpoint(name="Get Repos", url="https://api.github.com/repositories", method="GET",
                 min_latency=150, max_latency=600, fail_rate=5, collection_id=github_collection.id),
        Endpoint(name="Rate Limit", url="https://api.github.com/rate_limit", method="GET",
                 min_latency=50, max_latency=200, fail_rate=0, collection_id=github_collection.id),
    ]
    for ep in github_endpoints:
        db.add(ep)
    
    # Collection 2: JSONPlaceholder
    jsonplaceholder_collection = Collection(
        name="JSONPlaceholder",
        description="Free fake API for testing and prototyping",
        owner_id=user_id
    )
    db.add(jsonplaceholder_collection)
    db.commit()
    db.refresh(jsonplaceholder_collection)
    
    jsonplaceholder_endpoints = [
        Endpoint(name="Get Posts", url="https://jsonplaceholder.typicode.com/posts", method="GET",
                 min_latency=200, max_latency=800, fail_rate=10, collection_id=jsonplaceholder_collection.id),
        Endpoint(name="Get Users", url="https://jsonplaceholder.typicode.com/users", method="GET",
                 min_latency=250, max_latency=900, fail_rate=15, collection_id=jsonplaceholder_collection.id),
        Endpoint(name="Get Comments", url="https://jsonplaceholder.typicode.com/comments", method="GET",
                 min_latency=300, max_latency=1000, fail_rate=10, collection_id=jsonplaceholder_collection.id),
    ]
    for ep in jsonplaceholder_endpoints:
        db.add(ep)
    
    # Collection 3: HTTPBin
    httpbin_collection = Collection(
        name="HTTPBin",
        description="HTTP Request & Response Service",
        owner_id=user_id
    )
    db.add(httpbin_collection)
    db.commit()
    db.refresh(httpbin_collection)
    
    httpbin_endpoints = [
        Endpoint(name="GET Request", url="https://httpbin.org/get", method="GET",
                 min_latency=500, max_latency=1500, fail_rate=20, collection_id=httpbin_collection.id),
        Endpoint(name="Delay 1s", url="https://httpbin.org/delay/1", method="GET",
                 min_latency=1000, max_latency=2000, fail_rate=30, collection_id=httpbin_collection.id),
        Endpoint(name="Status 200", url="https://httpbin.org/status/200", method="GET",
                 min_latency=100, max_latency=300, fail_rate=0, collection_id=httpbin_collection.id),
    ]
    for ep in httpbin_endpoints:
        db.add(ep)
    
    db.commit()
    print("Demo collections and endpoints created successfully")
    print("- GitHub API (3 endpoints)")
    print("- JSONPlaceholder (3 endpoints)")
    print("- HTTPBin (3 endpoints)")
    
    # Create a demo API key with access to all collections
    demo_api_key = ApiKey(
        name="Demo API Key",
        key=f"lp_{secrets.token_urlsafe(32)}",
        is_active=True,
        all_collections=True,
        owner_id=user_id
    )
    db.add(demo_api_key)
    db.commit()
    print(f"Demo API key created: {demo_api_key.key}")

if __name__ == "__main__":
    init_db() 