.PHONY: build run test clean docker-build docker-run

# Variables
BINARY_NAME=latency-poison-proxy
DOCKER_IMAGE=latency-poison-proxy:latest

# Build the application
build:
	go build -o bin/$(BINARY_NAME) ./cmd/server

# Run the application locally
run:
	DATABASE_PATH=../api/users.db PORT=8080 go run ./cmd/server

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/
	go clean

# Build Docker image standalone
docker-build:
	docker build -t $(DOCKER_IMAGE) .

# Run with Docker standalone (creates its own network)
docker-run:
	docker run -p 8080:8080 \
		-e DATABASE_PATH=/data/users.db \
		-e PORT=8080 \
		-v $(PWD)/../data:/data \
		$(DOCKER_IMAGE)

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Help
help:
	@echo "Latency Poison Proxy (Go API)"
	@echo ""
	@echo "Available commands:"
	@echo "  make build        - Build the binary"
	@echo "  make run          - Run locally (requires Go installed)"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run with Docker standalone"
	@echo "  make fmt          - Format code"
	@echo "  make help         - Show this help"

.DEFAULT_GOAL := help
