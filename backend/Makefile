.PHONY: build run dev test lint lint-fix fmt vet clean help docker docker-run

# Load .env if it exists
ENV_FILE := .env
ifneq (,$(wildcard $(ENV_FILE)))
  include $(ENV_FILE)
  export
endif

# Build variables
VERSION  ?= $(shell cd .. && node -p "require('./package.json').version" 2>/dev/null || echo "dev")
GIT_SHA  ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS  := -s -w \
  -X github.com/rotki/rotki.com/backend/internal/version.Version=$(VERSION) \
  -X github.com/rotki/rotki.com/backend/internal/version.GitSHA=$(GIT_SHA)
BINARY   := server

## help: Show this help message
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | column -t -s ':'

## build: Build the server binary
build:
	CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BINARY) ./cmd/server

## run: Run the server (requires static files)
run:
	-go run ./cmd/server $(ARGS)

## dev: Run in dev mode (port 3000, proxies to Nuxt on 3001)
dev:
	-DEV_MODE=true go run ./cmd/server $(ARGS)

## test: Run all tests
test:
	go test ./... -count=1

## test-v: Run all tests with verbose output
test-v:
	go test ./... -v -count=1

## test-race: Run tests with race detector
test-race:
	go test ./... -race -count=1

## coverage: Run tests with coverage report
coverage:
	go test ./... -coverprofile=coverage.out -count=1
	go tool cover -func=coverage.out
	@rm -f coverage.out

## lint: Run golangci-lint
lint:
	golangci-lint run ./...

## lint-fix: Run golangci-lint with auto-fix
lint-fix:
	golangci-lint run --fix ./...

## fmt: Format all Go files
fmt:
	gofumpt -w .

## vet: Run go vet
vet:
	go vet ./...

## tidy: Tidy go.mod
tidy:
	go mod tidy

## check: Run all checks (vet, lint, test)
check: vet lint test

## docker: Build and run Docker image locally
docker:
	cd .. && docker compose up --build

## docker-build: Build Docker image only
docker-build:
	cd .. && docker compose build

## clean: Remove build artifacts
clean:
	rm -f $(BINARY) coverage.out