from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TunnelTarget(BaseModel):
    """A target configuration for a tunnel"""
    id: Optional[str] = None
    name: str
    host: str
    port: int = 443
    use_tls: bool = True
    path_prefix: str = ""  # Match paths starting with this prefix (empty = catch-all)
    min_latency: int = 0
    max_latency: int = 0
    fail_rate: int = 0  # Percentage 0-100
    is_active: bool = True

class TunnelTargetCreate(BaseModel):
    name: str
    host: str
    port: int = 443
    use_tls: bool = True
    path_prefix: str = ""
    min_latency: int = 0
    max_latency: int = 0
    fail_rate: int = 0
    is_active: bool = True

class ProxyTunnelBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    # Global settings (applied when target doesn't override)
    default_min_latency: int = 0
    default_max_latency: int = 0
    default_fail_rate: int = 0  # Percentage 0-100

class ProxyTunnelCreate(ProxyTunnelBase):
    targets: List[TunnelTargetCreate] = []

class ProxyTunnelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    default_min_latency: Optional[int] = None
    default_max_latency: Optional[int] = None
    default_fail_rate: Optional[int] = None
    targets: Optional[List[TunnelTarget]] = None

class ProxyTunnel(ProxyTunnelBase):
    id: str
    tunnel_key: str
    targets: List[TunnelTarget] = []
    request_count: int = 0
    created_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    user_email: str

    class Config:
        from_attributes = True
