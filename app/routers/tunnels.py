from fastapi import APIRouter, HTTPException, Depends
from typing import List
import secrets
import uuid
import logging
from datetime import datetime

from ..core.security import get_current_user
from ..schemas.tunnel import ProxyTunnel, ProxyTunnelCreate, ProxyTunnelUpdate, TunnelTarget
from ..schemas.user import TokenData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tunnels", tags=["tunnels"])

# In-memory storage for tunnels
tunnels = {}

def generate_tunnel_key():
    """Generate a unique tunnel key"""
    return f"tun_{secrets.token_urlsafe(24)}"

def generate_target_id():
    """Generate a unique target id"""
    return str(uuid.uuid4())[:8]

@router.get("/", response_model=List[ProxyTunnel])
async def get_tunnels(
    current_user: TokenData = Depends(get_current_user)
):
    """Get all proxy tunnels for the current user"""
    try:
        logger.info(f"Getting tunnels for user: {current_user.email}")
        user_tunnels = [
            tunnel for tunnel in tunnels.values()
            if tunnel.user_email == current_user.email
        ]
        return user_tunnels
    except Exception as e:
        logger.error(f"Error getting tunnels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tunnel_id}/", response_model=ProxyTunnel)
async def get_tunnel(
    tunnel_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get a specific proxy tunnel"""
    try:
        logger.info(f"Getting tunnel {tunnel_id} for user: {current_user.email}")
        tunnel = tunnels.get(tunnel_id)
        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")
        if tunnel.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to access this tunnel")
        return tunnel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tunnel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProxyTunnel)
async def create_tunnel(
    tunnel_data: ProxyTunnelCreate,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a new proxy tunnel"""
    try:
        logger.info(f"Creating tunnel for user: {current_user.email}")
        tunnel_id = str(uuid.uuid4())
        
        # Process targets and assign IDs
        processed_targets = []
        for t in tunnel_data.targets:
            target = TunnelTarget(
                id=generate_target_id(),
                name=t.name,
                host=t.host,
                port=t.port,
                use_tls=t.use_tls,
                path_prefix=t.path_prefix,
                min_latency=t.min_latency,
                max_latency=t.max_latency,
                fail_rate=t.fail_rate,
                is_active=t.is_active
            )
            processed_targets.append(target)
        
        tunnel = ProxyTunnel(
            id=tunnel_id,
            name=tunnel_data.name,
            tunnel_key=generate_tunnel_key(),
            description=tunnel_data.description,
            is_active=tunnel_data.is_active,
            default_min_latency=tunnel_data.default_min_latency,
            default_max_latency=tunnel_data.default_max_latency,
            default_fail_rate=tunnel_data.default_fail_rate,
            targets=processed_targets,
            request_count=0,
            created_at=datetime.utcnow(),
            last_used_at=None,
            user_email=current_user.email
        )
        tunnels[tunnel_id] = tunnel
        logger.info(f"Created tunnel {tunnel_id} with {len(processed_targets)} targets")
        return tunnel
    except Exception as e:
        logger.error(f"Error creating tunnel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tunnel_id}/", response_model=ProxyTunnel)
async def update_tunnel(
    tunnel_id: str,
    tunnel_data: ProxyTunnelUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    """Update a proxy tunnel"""
    try:
        logger.info(f"Updating tunnel {tunnel_id} for user: {current_user.email}")
        tunnel = tunnels.get(tunnel_id)
        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")
        if tunnel.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to update this tunnel")
        
        update_data = tunnel_data.dict(exclude_unset=True)
        
        # Handle targets update - assign IDs to new targets
        new_targets = tunnel.targets
        if 'targets' in update_data and update_data['targets'] is not None:
            new_targets = []
            for t in update_data['targets']:
                if isinstance(t, dict):
                    target = TunnelTarget(
                        id=t.get('id') or generate_target_id(),
                        name=t.get('name', ''),
                        host=t.get('host', ''),
                        port=t.get('port', 443),
                        use_tls=t.get('use_tls', True),
                        path_prefix=t.get('path_prefix', ''),
                        min_latency=t.get('min_latency', 0),
                        max_latency=t.get('max_latency', 0),
                        fail_rate=t.get('fail_rate', 0),
                        is_active=t.get('is_active', True)
                    )
                else:
                    target = TunnelTarget(
                        id=t.id or generate_target_id(),
                        name=t.name,
                        host=t.host,
                        port=t.port,
                        use_tls=t.use_tls,
                        path_prefix=t.path_prefix,
                        min_latency=t.min_latency,
                        max_latency=t.max_latency,
                        fail_rate=t.fail_rate,
                        is_active=t.is_active
                    )
                new_targets.append(target)
        
        # Create a new tunnel object with updated values
        updated_tunnel = ProxyTunnel(
            id=tunnel.id,
            name=update_data.get('name', tunnel.name),
            tunnel_key=tunnel.tunnel_key,
            description=update_data.get('description', tunnel.description),
            is_active=update_data.get('is_active', tunnel.is_active),
            default_min_latency=update_data.get('default_min_latency', tunnel.default_min_latency),
            default_max_latency=update_data.get('default_max_latency', tunnel.default_max_latency),
            default_fail_rate=update_data.get('default_fail_rate', tunnel.default_fail_rate),
            targets=new_targets,
            request_count=tunnel.request_count,
            created_at=tunnel.created_at,
            last_used_at=tunnel.last_used_at,
            user_email=tunnel.user_email
        )
        tunnels[tunnel_id] = updated_tunnel
        return updated_tunnel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tunnel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tunnel_id}/")
async def delete_tunnel(
    tunnel_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a proxy tunnel"""
    try:
        logger.info(f"Deleting tunnel {tunnel_id} for user: {current_user.email}")
        tunnel = tunnels.get(tunnel_id)
        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")
        if tunnel.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to delete this tunnel")
        
        del tunnels[tunnel_id]
        return {"message": "Tunnel deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tunnel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tunnel_id}/regenerate-key/", response_model=ProxyTunnel)
async def regenerate_tunnel_key_endpoint(
    tunnel_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Regenerate the tunnel key"""
    try:
        logger.info(f"Regenerating key for tunnel {tunnel_id} for user: {current_user.email}")
        tunnel = tunnels.get(tunnel_id)
        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")
        if tunnel.user_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to regenerate this tunnel key")
        
        # Create a new tunnel object with regenerated key
        updated_tunnel = ProxyTunnel(
            id=tunnel.id,
            name=tunnel.name,
            tunnel_key=generate_tunnel_key(),
            description=tunnel.description,
            is_active=tunnel.is_active,
            default_min_latency=tunnel.default_min_latency,
            default_max_latency=tunnel.default_max_latency,
            default_fail_rate=tunnel.default_fail_rate,
            targets=tunnel.targets,
            request_count=tunnel.request_count,
            created_at=tunnel.created_at,
            last_used_at=tunnel.last_used_at,
            user_email=tunnel.user_email
        )
        tunnels[tunnel_id] = updated_tunnel
        return updated_tunnel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating tunnel key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
