# Latency Poison Proxy

High-performance Go proxy server for Latency Poison. Handles request proxying with configurable latency injection and failure simulation.

## Requirements

- Go 1.21+
- SQLite (shared database with Python API)

## Running Standalone

### With Go installed locally

```bash
# Set environment variables
export DATABASE_PATH=../api/users.db
export PORT=8080

# Run
go run ./cmd/server

# Or build and run
go build -o bin/latency-poison-proxy ./cmd/server
./bin/latency-poison-proxy
```

### With Docker

```bash
# Build
docker build -t latency-poison-proxy:latest .

# Run (mount the shared database)
docker run -p 8080:8080 \
  -e DATABASE_PATH=/data/users.db \
  -e PORT=8080 \
  -v /path/to/data:/data \
  latency-poison-proxy:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `/data/users.db` | Path to SQLite database |
| `PORT` | `8080` | Port to listen on |

## API Endpoints

### Health Check
```
GET /health
```

### Sandbox (No Auth)
```
GET /sandbox?url=<target>&minLatency=<ms>&maxLatency=<ms>&failrate=<0-1>&failCodes=<codes>
```

### Proxy (With API Key)
```
ANY /proxy/:collectionId?api_key=<key>&url=<target>
```

## Project Structure

```
proxy/
├── cmd/
│   └── server/
│       └── main.go       # Entry point
├── internal/
│   ├── config/
│   │   └── sqlite.go     # Database connection
│   ├── handlers/
│   │   └── handlers.go   # HTTP handlers
│   ├── models/
│   │   └── models.go     # Data models & repository
│   └── proxy/
│       └── proxy.go      # Proxy logic
├── Dockerfile
├── go.mod
├── Makefile
└── README.md
```
