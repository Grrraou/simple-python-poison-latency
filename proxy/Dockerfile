# Build stage - using standard golang image for CGO support (required by sqlite3)
FROM golang:1.21 AS builder

WORKDIR /app

# Install build dependencies for SQLite
RUN apt-get update && apt-get install -y gcc musl-dev

# Copy go mod file
COPY go.mod ./

# Copy source code
COPY . .

# Download and verify dependencies
RUN go get -d -v ./... && \
    go mod download && \
    go mod verify

# Build the application with CGO enabled for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/main ./cmd/server

# Final stage
FROM debian:bookworm-slim

WORKDIR /app

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/main /app/

# Create data directory for database
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Make the binary executable
RUN chmod +x /app/main

# Run the application
CMD ["/app/main"]
