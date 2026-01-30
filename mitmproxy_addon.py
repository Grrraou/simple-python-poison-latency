"""
Latency Poison mitmproxy addon

Usage:
    mitmproxy -p 9090 -s mitmproxy_addon.py --set apikey=YOUR_API_KEY --set proxy_host=localhost:8080

Or with mitmdump (headless):
    mitmdump -p 9090 -s mitmproxy_addon.py --set apikey=YOUR_API_KEY --set proxy_host=localhost:8080

Then configure your browser to use localhost:9090 as HTTP/HTTPS proxy.

First time setup - install mitmproxy CA certificate:
    1. Run mitmproxy once
    2. CA cert is at ~/.mitmproxy/mitmproxy-ca-cert.pem
    3. Import into browser (Firefox: Settings → Privacy → Certificates → Import)
"""

import mitmproxy.http
from mitmproxy import ctx
import urllib.parse


class LatencyPoisonAddon:
    def load(self, loader):
        loader.add_option(
            name="apikey",
            typespec=str,
            default="",
            help="Latency Poison API key"
        )
        loader.add_option(
            name="proxy_host",
            typespec=str,
            default="localhost:8080",
            help="Latency Poison proxy host:port"
        )

    def request(self, flow: mitmproxy.http.HTTPFlow) -> None:
        apikey = ctx.options.apikey
        proxy_host = ctx.options.proxy_host
        
        if not apikey:
            ctx.log.warn("No API key configured! Use --set apikey=YOUR_KEY")
            return
        
        # Build the original URL
        original_url = flow.request.pretty_url
        
        # Skip requests to the proxy itself to avoid loops
        if proxy_host in original_url or "latencypoison" in original_url.lower():
            return
        
        # URL encode the target
        encoded_url = urllib.parse.quote(original_url, safe='')
        
        # Rewrite to go through Latency Poison proxy
        proxy_url = f"http://{proxy_host}/proxy/?url={encoded_url}"
        
        ctx.log.info(f"Redirecting: {original_url} -> Latency Poison proxy")
        
        # Modify the request
        flow.request.host = proxy_host.split(':')[0]
        flow.request.port = int(proxy_host.split(':')[1]) if ':' in proxy_host else 8080
        flow.request.scheme = "http"
        flow.request.path = f"/proxy/?url={encoded_url}"
        
        # Add API key header
        flow.request.headers["X-API-Key"] = apikey
        
        # Keep original headers that might be needed
        if "Host" in flow.request.headers:
            flow.request.headers["X-Original-Host"] = flow.request.headers["Host"]
        
        flow.request.headers["Host"] = proxy_host


addons = [LatencyPoisonAddon()]
