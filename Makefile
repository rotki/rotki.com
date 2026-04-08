.PHONY: dev dev-go dev-web \
       build build-go build-web \
       test test-go test-web \
       lint lint-go lint-web lint-fix lint-fix-go lint-fix-web \
       fmt vet tidy check \
       coverage typecheck clean docker docker-build help

## help: Show this help message
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | column -t -s ':'

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

## dev: Run Go backend and Nuxt dev server in parallel
dev:
	@trap 'kill 0' INT TERM; \
	$(MAKE) dev-go & \
	$(MAKE) dev-web & \
	wait

## dev-go: Run Go backend in dev mode (port 3000, proxies to Nuxt on 3001)
dev-go:
	$(MAKE) -C backend dev

## dev-web: Run Nuxt dev server (accepts self-signed certs)
dev-web:
	NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm dev

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

## build: Build Go backend and frontend
build: build-go build-web

## build-go: Build Go backend binary
build-go:
	$(MAKE) -C backend build

## build-web: Build frontend (generate + card payment)
build-web:
	pnpm build

## docker: Build and run Docker image locally
docker:
	docker compose up --build

## docker-build: Build Docker image only
docker-build:
	docker compose build

# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------

## test: Run all tests (Go + frontend)
test: test-go test-web

## test-go: Run Go backend tests
test-go:
	$(MAKE) -C backend test

## test-race: Run Go backend tests with race detector
test-race:
	$(MAKE) -C backend test-race

## test-web: Run frontend tests
test-web:
	pnpm test

## coverage: Run Go tests with coverage report
coverage:
	$(MAKE) -C backend coverage

# ---------------------------------------------------------------------------
# Code quality
# ---------------------------------------------------------------------------

## lint: Run all linters (Go + frontend)
lint: lint-go lint-web

## lint-go: Run Go linter
lint-go:
	$(MAKE) -C backend lint

## lint-web: Run frontend linter
lint-web:
	pnpm lint

## lint-fix: Auto-fix all lint issues (Go + frontend)
lint-fix: lint-fix-go lint-fix-web

## lint-fix-go: Auto-fix Go lint issues
lint-fix-go:
	$(MAKE) -C backend lint-fix

## lint-fix-web: Auto-fix frontend lint issues
lint-fix-web:
	pnpm lint:fix

## fmt: Format Go files
fmt:
	$(MAKE) -C backend fmt

## vet: Run go vet
vet:
	$(MAKE) -C backend vet

## tidy: Tidy go.mod
tidy:
	$(MAKE) -C backend tidy

## typecheck: Run frontend type checking
typecheck:
	pnpm typecheck

## check: Run all checks (vet, lint, test)
check: vet lint test

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

## clean: Remove build artifacts
clean:
	$(MAKE) -C backend clean
