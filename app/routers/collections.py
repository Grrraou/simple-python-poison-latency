from fastapi import APIRouter, HTTPException, Depends
from ..core.security import get_current_user
from ..schemas.collection import Collection, CollectionCreate, CollectionUpdate
from ..schemas.endpoint import Endpoint
from ..schemas.user import TokenData
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/collections", tags=["collections"])

# Default fixtures for demo user
DEMO_USER_EMAIL = "demo@example.com"

DEFAULT_COLLECTIONS = [
    Collection(
        id="demo-github-api",
        name="GitHub API",
        base_url="https://api.github.com",
        default_latency_ms=100,
        default_fail_rate=0.0,
        user_email=DEMO_USER_EMAIL,
        endpoints=[
            Endpoint(id="demo-github-users", path="/users", latency_ms=100, fail_rate=0.0, collection_id="demo-github-api"),
            Endpoint(id="demo-github-repos", path="/repositories", latency_ms=150, fail_rate=0.05, collection_id="demo-github-api"),
            Endpoint(id="demo-github-rate-limit", path="/rate_limit", latency_ms=50, fail_rate=0.0, collection_id="demo-github-api"),
        ]
    ),
    Collection(
        id="demo-jsonplaceholder",
        name="JSONPlaceholder",
        base_url="https://jsonplaceholder.typicode.com",
        default_latency_ms=200,
        default_fail_rate=0.1,
        user_email=DEMO_USER_EMAIL,
        endpoints=[
            Endpoint(id="demo-jsonplaceholder-posts", path="/posts", latency_ms=200, fail_rate=0.1, collection_id="demo-jsonplaceholder"),
            Endpoint(id="demo-jsonplaceholder-users", path="/users", latency_ms=250, fail_rate=0.15, collection_id="demo-jsonplaceholder"),
            Endpoint(id="demo-jsonplaceholder-comments", path="/comments", latency_ms=300, fail_rate=0.1, collection_id="demo-jsonplaceholder"),
        ]
    ),
    Collection(
        id="demo-httpbin",
        name="HTTPBin",
        base_url="https://httpbin.org",
        default_latency_ms=500,
        default_fail_rate=0.2,
        user_email=DEMO_USER_EMAIL,
        endpoints=[
            Endpoint(id="demo-httpbin-get", path="/get", latency_ms=500, fail_rate=0.2, collection_id="demo-httpbin"),
            Endpoint(id="demo-httpbin-delay", path="/delay/1", latency_ms=1000, fail_rate=0.3, collection_id="demo-httpbin"),
            Endpoint(id="demo-httpbin-status", path="/status/200", latency_ms=100, fail_rate=0.0, collection_id="demo-httpbin"),
        ]
    ),
]

# In-memory storage for collections (replace with database in production)
collections = {c.id: c for c in DEFAULT_COLLECTIONS}

@router.post("/", response_model=Collection)
async def create_collection(
    collection: CollectionCreate,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        logger.info(f"Creating collection for user: {current_user.email}")
        collection_id = str(uuid.uuid4())
        new_collection = Collection(
            id=collection_id,
            name=collection.name,
            base_url=collection.base_url,
            default_latency_ms=collection.default_latency_ms,
            default_fail_rate=collection.default_fail_rate,
            user_email=current_user.email,
            endpoints=[]
        )
        collections[collection_id] = new_collection
        return new_collection
    except Exception as e:
        logger.error(f"Error creating collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list[Collection])
async def get_collections(current_user: TokenData = Depends(get_current_user)):
    try:
        logger.info(f"Getting collections for user: {current_user.email}")
        logger.info(f"Available collections: {list(collections.keys())}")
        logger.info(f"Collection emails: {[c.user_email for c in collections.values()]}")
        user_collections = [
            collection for collection in collections.values()
            if collection.user_email == current_user.email
        ]
        logger.info(f"Found {len(user_collections)} collections for user {current_user.email}")
        return user_collections
    except Exception as e:
        logger.error(f"Error getting collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{collection_id}", response_model=Collection)
async def get_collection(
    collection_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        logger.info(f"Getting collection {collection_id} for user: {current_user.email}")
        collection = collections.get(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to access this collection")
        return collection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{collection_id}", response_model=Collection)
async def update_collection(
    collection_id: str,
    collection_update: CollectionUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        logger.info(f"Updating collection {collection_id} for user: {current_user.email}")
        collection = collections.get(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to update this collection")
        
        if collection_update.name is not None:
            collection.name = collection_update.name
        
        collections[collection_id] = collection
        return collection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        logger.info(f"Deleting collection {collection_id} for user: {current_user.email}")
        collection = collections.get(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to delete this collection")
        
        del collections[collection_id]
        return {"message": "Collection deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 