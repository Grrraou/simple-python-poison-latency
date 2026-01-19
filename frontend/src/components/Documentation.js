import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Dns as DnsIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { PROXY_API_BASE_URL } from '../config';

function CodeBlock({ children, title }) {
  return (
    <Paper sx={{ my: 2, overflow: 'hidden' }}>
      {title && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.800', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {title}
          </Typography>
        </Box>
      )}
      <Box
        component="pre"
        sx={{
          p: 2,
          m: 0,
          overflow: 'auto',
          bgcolor: 'grey.900',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          '& code': { color: 'success.light' },
        }}
      >
        <code>{children}</code>
      </Box>
    </Paper>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Icon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h4">{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function Documentation() {
  const proxyBaseUrl = PROXY_API_BASE_URL || 'http://localhost:8080';

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" gutterBottom>
            Documentation
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Learn how to configure and integrate Latency Poison into your development workflow
          </Typography>
        </Box>

        {/* How It Works */}
        <Section icon={ApiIcon} title="How It Works">
          <Typography variant="body1" paragraph>
            Latency Poison acts as a proxy between your application and external APIs. Instead of calling 
            the target API directly, you call Latency Poison with the target URL as a parameter:
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Without Latency Poison:</strong><br />
            <code>curl https://api.github.com/users</code>
            <br /><br />
            <strong>With Latency Poison:</strong><br />
            <code>curl "{proxyBaseUrl}/proxy/1?api_key=lp_xxx&url=https://api.github.com/users"</code>
          </Alert>

          <Typography variant="body1" paragraph>
            The proxy applies your configured latency and failure settings, then forwards the request to the 
            real API. Your application receives the response as if it came directly from the target API.
          </Typography>

          <CodeBlock title="Flow">
{`Your App                         Latency Poison                      Real API
    |                                   |                                  |
    |-- GET /proxy/1?url=github.com --> |                                  |
    |                                   |                                  |
    |                              [add latency]                           |
    |                              [maybe fail]                            |
    |                                   |                                  |
    |                                   |-- GET github.com/users --------->|
    |                                   |                                  |
    |                                   |<-------- response ---------------|
    |                                   |                                  |
    |<-------- response ----------------|                                  |`}
          </CodeBlock>
        </Section>

        <Divider sx={{ my: 6 }} />

        {/* Admin Configuration */}
        <Section icon={DashboardIcon} title="Admin Configuration">
          <Typography variant="body1" paragraph>
            Before using the proxy, you need to configure your collections, endpoints, and API keys in the admin panel.
            <strong> Sign up or log in</strong> to access the admin features.
          </Typography>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 1: Create a Collection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                A <strong>Collection</strong> groups related API endpoints together. For example, you might have 
                a "GitHub API" collection or a "Payment APIs" collection.
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>Go to <strong>Endpoints</strong> page in the navigation</li>
                  <li>Click <strong>"Add Collection"</strong></li>
                  <li>Enter a name (e.g., "GitHub API") and optional description</li>
                  <li>Click <strong>"Create"</strong></li>
                </ol>
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Each collection has a unique ID (shown in the URL). You'll use this ID when calling the proxy: 
                <code>/proxy/&#123;collectionId&#125;?...</code>
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 2: Add Endpoints to Collection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Endpoints</strong> define the URL patterns you want to proxy and their latency/failure settings.
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>Expand the collection you created</li>
                  <li>Click <strong>"Add Endpoint"</strong></li>
                  <li>Configure the endpoint:
                    <ul>
                      <li><strong>Name:</strong> A descriptive name (e.g., "Get Users")</li>
                      <li><strong>URL Pattern:</strong> The target URL or pattern (e.g., <code>https://api.github.com/*</code>)</li>
                      <li><strong>Min/Max Latency:</strong> Delay range in milliseconds</li>
                      <li><strong>Fail Rate:</strong> Percentage chance of returning an error (0-100%)</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Save"</strong></li>
                </ol>
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>URL Pattern Examples</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Pattern</strong></TableCell>
                      <TableCell><strong>Matches</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><code>https://api.github.com/users</code></TableCell>
                      <TableCell>Exact URL only</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>https://api.github.com/*</code></TableCell>
                      <TableCell>Any path under api.github.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>https://*.github.com/*</code></TableCell>
                      <TableCell>Any subdomain and path</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>*</code></TableCell>
                      <TableCell>Any URL (catch-all)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Pattern Priority:</strong> More specific patterns take precedence. If you have both 
                <code> https://api.github.com/users</code> and <code>https://api.github.com/*</code>, 
                the exact match will be used for <code>/users</code> requests.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 3: Create an API Key</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>API Keys</strong> authenticate requests to the proxy and control access to collections.
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>Go to <strong>API Keys</strong> page in the navigation</li>
                  <li>Click <strong>"Create API Key"</strong></li>
                  <li>Enter a name (e.g., "Development", "CI/CD", "Team A")</li>
                  <li>Choose collection access:
                    <ul>
                      <li><strong>All Collections:</strong> Key can access any collection</li>
                      <li><strong>Specific Collections:</strong> Select which collections this key can access</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Create"</strong></li>
                  <li><strong>Copy the API key</strong> - it starts with <code>lp_</code> and is shown only once!</li>
                </ol>
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Save your API key!</strong> It's only shown once when created. Store it in a secure 
                location like environment variables or a secrets manager.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 4: Test Your Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Use the built-in test feature in the Endpoints page to verify your configuration works:
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>In the <strong>Endpoints</strong> page, select your API key from the dropdown</li>
                  <li>Find the endpoint you want to test</li>
                  <li>Click the <strong>"Test"</strong> button</li>
                  <li>View the response, status code, and actual response time (including injected latency)</li>
                </ol>
              </Typography>
              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                You can also copy the cURL command or proxy URL to test externally.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Section>

        <Divider sx={{ my: 6 }} />

        {/* API Reference */}
        <Section icon={CodeIcon} title="API Reference">
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label="ANY" color="primary" size="small" />
                <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
                  /proxy/:collectionId
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Proxy requests using pre-configured endpoint settings. Supports all HTTP methods 
                (GET, POST, PUT, DELETE, PATCH, etc.). The latency and fail rate are defined in the 
                collection configuration.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Parameter</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Required</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><code>:collectionId</code></TableCell>
                      <TableCell>integer</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Path parameter - ID of the collection (from Endpoints page)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>api_key</code></TableCell>
                      <TableCell>string</TableCell>
                      <TableCell>Yes*</TableCell>
                      <TableCell>Your API key (query param, header, or bearer token)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>url</code></TableCell>
                      <TableCell>string</TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Target URL - must match a configured endpoint pattern</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Authentication Methods</Typography>
              <Typography variant="body2" paragraph>
                You can provide the API key in three ways:
              </Typography>
              
              <CodeBlock title="Method 1: Query Parameter (recommended for testing)">
{`curl "${proxyBaseUrl}/proxy/1?api_key=lp_xxxxxxxxxxxx&url=https://api.github.com/users"`}
              </CodeBlock>
              <CodeBlock title="Method 2: X-API-Key Header">
{`curl -H "X-API-Key: lp_xxxxxxxxxxxx" \\
  "${proxyBaseUrl}/proxy/1?url=https://api.github.com/users"`}
              </CodeBlock>
              <CodeBlock title="Method 3: Bearer Token">
{`curl -H "Authorization: Bearer lp_xxxxxxxxxxxx" \\
  "${proxyBaseUrl}/proxy/1?url=https://api.github.com/users"`}
              </CodeBlock>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Example: POST Request</Typography>
              <CodeBlock title="POST with JSON body">
{`curl -X POST "${proxyBaseUrl}/proxy/1?api_key=lp_xxxxxxxxxxxx&url=https://jsonplaceholder.typicode.com/posts" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Test", "body": "Hello World"}'`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>
        </Section>

        <Divider sx={{ my: 6 }} />

        {/* Integration Examples */}
        <Section icon={SettingsIcon} title="Integration Examples">
          <Typography variant="body1" paragraph>
            The key concept is to replace direct API calls with calls to Latency Poison, passing the original 
            URL as a parameter. Here are patterns for different languages and frameworks:
          </Typography>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">JavaScript / Node.js</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CodeBlock title="config.js">
{`// Configuration
const USE_LATENCY_POISON = process.env.USE_LATENCY_POISON === 'true';
const LATENCY_POISON_URL = process.env.LATENCY_POISON_URL || '${proxyBaseUrl}';
const LATENCY_POISON_COLLECTION = process.env.LATENCY_POISON_COLLECTION || '1';
const LATENCY_POISON_API_KEY = process.env.LATENCY_POISON_API_KEY || '';

/**
 * Wraps a URL to go through Latency Poison proxy
 * @param {string} targetUrl - The actual API URL you want to call
 * @returns {string} - Either the proxied URL or the original URL
 */
function proxyUrl(targetUrl) {
  if (!USE_LATENCY_POISON) {
    return targetUrl;
  }
  const params = new URLSearchParams({
    api_key: LATENCY_POISON_API_KEY,
    url: targetUrl
  });
  return \`\${LATENCY_POISON_URL}/proxy/\${LATENCY_POISON_COLLECTION}?\${params}\`;
}

module.exports = { proxyUrl };`}
              </CodeBlock>
              <CodeBlock title="api.js - Usage">
{`const { proxyUrl } = require('./config');

async function getGitHubUser(username) {
  // Without Latency Poison: https://api.github.com/users/octocat
  // With Latency Poison:    ${proxyBaseUrl}/proxy/1?api_key=xxx&url=https://api.github.com/users/octocat
  const url = proxyUrl(\`https://api.github.com/users/\${username}\`);
  
  const response = await fetch(url);
  return response.json();
}

async function createPost(data) {
  // POST requests work the same way
  const url = proxyUrl('https://jsonplaceholder.typicode.com/posts');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}`}
              </CodeBlock>
              <CodeBlock title=".env">
{`# Enable Latency Poison in development
USE_LATENCY_POISON=true
LATENCY_POISON_URL=${proxyBaseUrl}
LATENCY_POISON_COLLECTION=1
LATENCY_POISON_API_KEY=lp_xxxxxxxxxxxx`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Python</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CodeBlock title="config.py">
{`import os
from urllib.parse import urlencode

USE_LATENCY_POISON = os.getenv('USE_LATENCY_POISON', 'false').lower() == 'true'
LATENCY_POISON_URL = os.getenv('LATENCY_POISON_URL', '${proxyBaseUrl}')
LATENCY_POISON_COLLECTION = os.getenv('LATENCY_POISON_COLLECTION', '1')
LATENCY_POISON_API_KEY = os.getenv('LATENCY_POISON_API_KEY', '')

def proxy_url(target_url: str) -> str:
    """
    Wraps a URL to go through Latency Poison proxy.
    
    Args:
        target_url: The actual API URL you want to call
        
    Returns:
        Either the proxied URL or the original URL
    """
    if not USE_LATENCY_POISON:
        return target_url
    
    params = urlencode({
        'api_key': LATENCY_POISON_API_KEY,
        'url': target_url
    })
    return f"{LATENCY_POISON_URL}/proxy/{LATENCY_POISON_COLLECTION}?{params}"`}
              </CodeBlock>
              <CodeBlock title="api.py - Usage">
{`import requests
from config import proxy_url

def get_github_user(username: str) -> dict:
    # Without Latency Poison: https://api.github.com/users/octocat
    # With Latency Poison:    ${proxyBaseUrl}/proxy/1?api_key=xxx&url=https://api.github.com/users/octocat
    url = proxy_url(f'https://api.github.com/users/{username}')
    
    response = requests.get(url)
    return response.json()

def create_post(data: dict) -> dict:
    # POST requests work the same way
    url = proxy_url('https://jsonplaceholder.typicode.com/posts')
    
    response = requests.post(url, json=data)
    return response.json()`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">React / Frontend</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <CodeBlock title="src/utils/proxy.js">
{`const USE_LATENCY_POISON = process.env.REACT_APP_USE_LATENCY_POISON === 'true';
const LATENCY_POISON_URL = process.env.REACT_APP_LATENCY_POISON_URL || '${proxyBaseUrl}';
const LATENCY_POISON_COLLECTION = process.env.REACT_APP_LATENCY_POISON_COLLECTION || '1';
const LATENCY_POISON_API_KEY = process.env.REACT_APP_LATENCY_POISON_API_KEY || '';

export function proxyUrl(targetUrl) {
  if (!USE_LATENCY_POISON) {
    return targetUrl;
  }
  const params = new URLSearchParams({
    api_key: LATENCY_POISON_API_KEY,
    url: targetUrl
  });
  return \`\${LATENCY_POISON_URL}/proxy/\${LATENCY_POISON_COLLECTION}?\${params}\`;
}`}
              </CodeBlock>
              <CodeBlock title="src/api/github.js - Usage">
{`import { proxyUrl } from '../utils/proxy';

export async function fetchGitHubUser(username) {
  // In production: calls https://api.github.com/users/octocat directly
  // In development: calls ${proxyBaseUrl}/proxy/1?api_key=xxx&url=https://api.github.com/users/octocat
  const url = proxyUrl(\`https://api.github.com/users/\${username}\`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
}`}
              </CodeBlock>
              <CodeBlock title=".env.development">
{`REACT_APP_USE_LATENCY_POISON=true
REACT_APP_LATENCY_POISON_URL=${proxyBaseUrl}
REACT_APP_LATENCY_POISON_COLLECTION=1
REACT_APP_LATENCY_POISON_API_KEY=lp_xxxxxxxxxxxx`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Docker Compose</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Run Latency Poison alongside your application in Docker:
              </Typography>
              <CodeBlock title="docker-compose.yml">
{`version: '3.8'

services:
  # Your application
  app:
    build: .
    environment:
      - USE_LATENCY_POISON=true
      # Use Docker service name as host
      - LATENCY_POISON_URL=http://latency-poison:8080
      - LATENCY_POISON_COLLECTION=1
      - LATENCY_POISON_API_KEY=lp_xxxxxxxxxxxx
    depends_on:
      - latency-poison

  # Latency Poison proxy
  latency-poison:
    image: latency-poison:latest
    ports:
      - "8080:8080"  # Expose for debugging
    volumes:
      - latency-poison-data:/data

volumes:
  latency-poison-data:`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>
        </Section>

        <Divider sx={{ my: 6 }} />

        {/* DNS / Hosts Setup */}
        <Section icon={DnsIcon} title="Advanced: Transparent Proxy with DNS Override">
          <Alert severity="info" sx={{ mb: 3 }}>
            This advanced setup allows you to intercept API calls <strong>without modifying your application code</strong>.
            Your app calls <code>api.github.com</code> normally, but the request is secretly routed through Latency Poison.
          </Alert>

          <Typography variant="body1" paragraph>
            <strong>How it works:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 3 }}>
            <ol>
              <li>Modify your <code>/etc/hosts</code> file to point <code>api.github.com</code> to <code>127.0.0.1</code></li>
              <li>Run a local nginx that listens on port 443 (HTTPS) for <code>api.github.com</code></li>
              <li>Nginx receives the request and forwards it to Latency Poison with the original URL as a parameter</li>
              <li>Latency Poison applies latency/failures and calls the real <code>api.github.com</code></li>
            </ol>
          </Typography>

          <CodeBlock title="Flow diagram">
{`Your App                    Local Machine                     Latency Poison                Real API
    |                             |                                   |                           |
    |-- GET api.github.com/users->|                                   |                           |
    |   (resolves to 127.0.0.1)   |                                   |                           |
    |                             |                                   |                           |
    |                        [nginx:443]                              |                           |
    |                             |                                   |                           |
    |                             |-- GET /proxy/1?api_key=xxx&url=https://api.github.com/users ->|
    |                             |                                   |                           |
    |                             |                              [add latency]                    |
    |                             |                              [maybe fail]                     |
    |                             |                                   |                           |
    |                             |                                   |-- GET /users ------------>|
    |                             |                                   |                           |
    |                             |                                   |<-- response --------------|
    |                             |                                   |                           |
    |                             |<---------- response --------------|                           |
    |                             |                                   |                           |
    |<------- response -----------|                                   |                           |`}
          </CodeBlock>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 1: Generate SSL Certificate</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Create a self-signed certificate for the domains you want to intercept:
              </Typography>
              <CodeBlock title="generate-cert.sh">
{`#!/bin/bash
# Generate self-signed certificate for local HTTPS interception

mkdir -p /etc/nginx/ssl

# Generate certificate for api.github.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout /etc/nginx/ssl/api.github.com.key \\
  -out /etc/nginx/ssl/api.github.com.crt \\
  -subj "/CN=api.github.com"

# Trust the certificate (macOS)
sudo security add-trusted-cert -d -r trustRoot \\
  -k /Library/Keychains/System.keychain \\
  /etc/nginx/ssl/api.github.com.crt

# Trust the certificate (Ubuntu/Debian)
# sudo cp /etc/nginx/ssl/api.github.com.crt /usr/local/share/ca-certificates/
# sudo update-ca-certificates`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 2: Configure Nginx</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Configure nginx to intercept requests and forward them to Latency Poison:
              </Typography>
              <CodeBlock title="nginx.conf">
{`# Nginx config to intercept api.github.com and route through Latency Poison

events {
    worker_connections 1024;
}

http {
    # Latency Poison upstream (adjust host/port as needed)
    upstream latency_poison {
        server 127.0.0.1:8080;  # Or your Latency Poison server address
    }

    # HTTPS server for api.github.com
    server {
        listen 443 ssl;
        server_name api.github.com;

        ssl_certificate /etc/nginx/ssl/api.github.com.crt;
        ssl_certificate_key /etc/nginx/ssl/api.github.com.key;

        location / {
            # Build the Latency Poison proxy URL
            set $lp_collection "1";
            set $lp_api_key "lp_xxxxxxxxxxxx";
            set $target_url "https://api.github.com$request_uri";

            # Forward to Latency Poison
            proxy_pass http://latency_poison/proxy/$lp_collection?api_key=$lp_api_key&url=$target_url;
            
            # Pass through headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # HTTP server (optional)
    server {
        listen 80;
        server_name api.github.com;

        location / {
            set $lp_collection "1";
            set $lp_api_key "lp_xxxxxxxxxxxx";
            set $target_url "http://api.github.com$request_uri";

            proxy_pass http://latency_poison/proxy/$lp_collection?api_key=$lp_api_key&url=$target_url;
        }
    }
}`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Step 3: Modify Hosts File</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Point the domain to your local machine so nginx can intercept the requests:
              </Typography>
              <CodeBlock title="/etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)">
{`# Latency Poison DNS Override
# Redirect these domains to local nginx
127.0.0.1    api.github.com

# Add more domains as needed:
# 127.0.0.1    jsonplaceholder.typicode.com
# 127.0.0.1    api.stripe.com`}
              </CodeBlock>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Important:</strong> Remove these entries when you're done testing!
                Otherwise all your requests to these domains will fail when nginx/Latency Poison isn't running.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Docker Alternative</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                For Docker-based applications, use the <code>extra_hosts</code> option to override DNS 
                and a custom network to route traffic:
              </Typography>
              <CodeBlock title="docker-compose.yml">
{`version: '3.8'

services:
  # Your application
  app:
    build: .
    extra_hosts:
      # Point api.github.com to the nginx container's IP
      - "api.github.com:172.28.0.10"
    networks:
      - proxy-net
    depends_on:
      - nginx

  # Nginx intercept proxy
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      proxy-net:
        ipv4_address: 172.28.0.10  # Fixed IP for extra_hosts
    depends_on:
      - latency-poison

  # Latency Poison
  latency-poison:
    image: latency-poison:latest
    networks:
      - proxy-net

networks:
  proxy-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16`}
              </CodeBlock>
            </AccordionDetails>
          </Accordion>
        </Section>

        <Divider sx={{ my: 6 }} />

        {/* Security */}
        <Section icon={SecurityIcon} title="Security Best Practices">
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Never use Latency Poison in production!</strong> It's designed for development and testing only.
          </Alert>

          <Typography variant="body1" component="div">
            <ul>
              <li>
                <strong>API Keys:</strong> Keep your API keys secret. Use environment variables, never commit them to version control.
              </li>
              <li>
                <strong>Environment Check:</strong> Always verify Latency Poison is disabled in production builds.
              </li>
              <li>
                <strong>Network Isolation:</strong> Run Latency Poison on a private network, not exposed to the internet.
              </li>
              <li>
                <strong>Hosts File:</strong> Remember to remove hosts file overrides when not testing.
              </li>
            </ul>
          </Typography>

          <CodeBlock title="Production safety check (JavaScript)">
{`// Add this check at application startup
if (process.env.NODE_ENV === 'production') {
  if (process.env.USE_LATENCY_POISON === 'true') {
    throw new Error('FATAL: Latency Poison must not be enabled in production!');
  }
}`}
          </CodeBlock>

          <CodeBlock title="Production safety check (Python)">
{`import os
import sys

if os.getenv('ENVIRONMENT') == 'production':
    if os.getenv('USE_LATENCY_POISON', '').lower() == 'true':
        print('FATAL: Latency Poison must not be enabled in production!', file=sys.stderr)
        sys.exit(1)`}
          </CodeBlock>
        </Section>

        {/* Footer */}
        <Box sx={{ mt: 8, py: 4, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? <a href="/register" style={{ color: 'inherit' }}>Create an account</a> to configure your collections and endpoints.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Documentation;
