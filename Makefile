# =============================================================================
# Makefile for redditx2md
# Production-ready build automation with cross-platform compatibility
# =============================================================================
.SHELLFLAGS := -e -u -c

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------
NODE := node
NPM := npm
DOCKER := docker
DOCKER_COMPOSE := docker-compose

# Application configuration
APP_NAME := redditx2md
IMAGE_NAME := $(APP_NAME):latest
IMAGE_TAG_TEST := $(APP_NAME):test

# Colors for output (disable with NO_COLOR=1)
ifndef NO_COLOR
    BLUE := \033[0;34m
    GREEN := \033[0;32m
    YELLOW := \033[0;33m
    RED := \033[0;31m
    RESET := \033[0m
endif

# -----------------------------------------------------------------------------
# Help Target (default)
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)redditx2md - Available Commands:$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Docker commands:$(RESET)"
	@grep -E '^##@' $(MAKEFILE_LIST) | awk 'BEGIN {FS = "##@ "}; {printf "  %s\n", $$2}'

# Default target
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Installation & Setup
# -----------------------------------------------------------------------------
.PHONY: install
install: ## Install dependencies using npm ci (ensures reproducible builds)
	@echo "$(BLUE)→ Installing dependencies...$(RESET)"
	@$(NPM) ci
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

.PHONY: install-dev
install-dev: ## Install all dependencies including devDependencies
	@echo "$(BLUE)→ Installing all dependencies (including dev)...$(RESET)"
	@$(NPM) install
	@echo "$(GREEN)✓ All dependencies installed$(RESET)"

.PHONY: setup
setup: install ## Full setup: install dependencies and prepare environment
	@echo "$(BLUE)→ Setting up project...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠ .env file not found, copying from .env.example$(RESET)"; \
		cp .env.example .env; \
		echo "$(YELLOW)⚠ Please edit .env with your API keys$(RESET)"; \
	fi
	@echo "$(GREEN)✓ Setup complete$(RESET)"

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------
.PHONY: test
test: ## Run all tests using Node.js native test runner
	@echo "$(BLUE)→ Running tests...$(RESET)"
	@$(NODE) --test
	@echo "$(GREEN)✓ Tests passed$(RESET)"

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "$(BLUE)→ Running tests (verbose)...$(RESET)"
	@$(NODE) --test --verbose
	@echo "$(GREEN)✓ Tests passed$(RESET)"

.PHONY: test-watch
test-watch: ## Run tests in watch mode (requires nodemon)
	@echo "$(BLUE)→ Watching for changes...$(RESET)"
	@if command -v nodemon >/dev/null 2>&1; then \
		nodemon --exec "node --test"; \
	else \
		echo "$(YELLOW)⚠ nodemon not installed. Install with: npm install -D nodemon$(RESET)"; \
		exit 1; \
	fi

# -----------------------------------------------------------------------------
# Linting & Code Quality
# -----------------------------------------------------------------------------
.PHONY: lint
lint: ## Run ESLint to check code quality
	@echo "$(BLUE)→ Linting code...$(RESET)"
	@if [ -f node_modules/.bin/eslint ]; then \
		./node_modules/.bin/eslint . --ext .js --report-unused-disable-directives; \
		echo "$(GREEN)✓ No linting errors$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ ESLint not installed. Install with: npm install -D eslint$(RESET)"; \
		echo "$(YELLOW)⚠ Skipping lint check...$(RESET)"; \
	fi

.PHONY: lint-fix
lint-fix: ## Fix linting issues automatically
	@echo "$(BLUE)→ Fixing linting issues...$(RESET)"
	@if [ -f node_modules/.bin/eslint ]; then \
		./node_modules/.bin/eslint . --ext .js --fix; \
		echo "$(GREEN)✓ Linting issues fixed$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ ESLint not installed$(RESET)"; \
		exit 1; \
	fi

.PHONY: format
format: ## Format code using Prettier (if installed)
	@echo "$(BLUE)→ Formatting code...$(RESET)"
	@if [ -f node_modules/.bin/prettier ]; then \
		./node_modules/.bin/prettier --write "**/*.js" "**/*.json" "**/*.md"; \
		echo "$(GREEN)✓ Code formatted$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ Prettier not installed. Install with: npm install -D prettier$(RESET)"; \
	fi

.PHONY: check
check: lint test-verbose ## Run full quality checks (lint + tests)
	@echo "$(GREEN)✓ All checks passed$(RESET)"

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------
.PHONY: docker-build
docker-build: ## Build Docker image (redditx2md:latest)
	@echo "$(BLUE)→ Building Docker image...$(RESET)"
	@$(DOCKER) build -t $(IMAGE_NAME) .
	@echo "$(GREEN)✓ Docker image built: $(IMAGE_NAME)$(RESET)"

.PHONY: docker-build-test
docker-build-test: ## Build Docker image with test target
	@echo "$(BLUE)→ Building Docker test image...$(RESET)"
	@$(DOCKER) build --target tester -t $(IMAGE_TAG_TEST) .
	@echo "$(GREEN)✓ Docker test image built: $(IMAGE_TAG_TEST)$(RESET)"

.PHONY: docker-run
docker-run: ## Run Docker container
	@echo "$(BLUE)→ Running Docker container...$(RESET)"
	@$(DOCKER) run --rm \
		--env-file .env \
		-v "$(CURDIR)/output:/usr/src/app/output" \
		$(IMAGE_NAME)

.PHONY: docker-test
docker-test: docker-build-test ## Run tests in Docker container
	@echo "$(BLUE)→ Running tests in Docker...$(RESET)"
	@$(DOCKER) run --rm $(IMAGE_TAG_TEST) npm test

.PHONY: docker-compose-build
docker-compose-build: ## Build using Docker Compose
	@echo "$(BLUE)→ Building with Docker Compose...$(RESET)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✓ Docker Compose build complete$(RESET)"

.PHONY: docker-compose-run
docker-compose-run: ## Run using Docker Compose
	@echo "$(BLUE)→ Running with Docker Compose...$(RESET)"
	@$(DOCKER_COMPOSE) run --rm app

.PHONY: docker-compose-test
docker-compose-test: ## Run tests using Docker Compose
	@echo "$(BLUE)→ Running tests with Docker Compose...$(RESET)"
	@$(DOCKER_COMPOSE) --profile test run --rm test

.PHONY: docker-clean
docker-clean: ## Remove Docker images and containers
	@echo "$(BLUE)→ Cleaning Docker resources...$(RESET)"
	@$(DOCKER) rmi $(IMAGE_NAME) $(IMAGE_TAG_TEST) 2>/dev/null || true
	@$(DOCKER_COMPOSE) down --rmi all 2>/dev/null || true
	@echo "$(GREEN)✓ Docker resources cleaned$(RESET)"

##@ Docker Commands

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------
.PHONY: run
run: ## Run the application locally
	@echo "$(BLUE)→ Starting redditx2md...$(RESET)"
	@if [ -f .env ]; then \
		$(NODE) index.js; \
	else \
		echo "$(RED)✗ Error: .env file not found$(RESET)"; \
		echo "$(YELLOW)⚠ Run 'make setup' to create .env file$(RESET)"; \
		exit 1; \
	fi

.PHONY: dev
dev: ## Run in development mode with hot reload (requires nodemon)
	@echo "$(BLUE)→ Starting development server...$(RESET)"
	@if command -v nodemon >/dev/null 2>&1; then \
		nodemon index.js; \
	else \
		echo "$(YELLOW)⚠ nodemon not installed. Install with: npm install -D nodemon$(RESET)"; \
		$(NODE) index.js; \
	fi

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------
.PHONY: clean
clean: ## Clean output directory and temporary files
	@echo "$(BLUE)→ Cleaning...$(RESET)"
	@# Clean output directory if exists
	@if [ -d "$(CURDIR)/output" ]; then \
		rm -rf "$(CURDIR)/output"/*.md 2>/dev/null || true; \
		echo "$(GREEN)✓ Output directory cleaned$(RESET)"; \
	fi
	@# Clean log files
	@rm -f *.log 2>/dev/null || true
	@# Clean DS_Store files
	@find . -name ".DS_Store" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(RESET)"

.PHONY: clean-all
clean-all: clean ## Deep clean: remove node_modules and all generated files
	@echo "$(BLUE)→ Deep cleaning...$(RESET)"
	@rm -rf "$(CURDIR)/node_modules" 2>/dev/null || true
	@echo "$(GREEN)✓ node_modules removed$(RESET)"
	@echo "$(YELLOW)⚠ Run 'make install' to reinstall dependencies$(RESET)"

.PHONY: distclean
distclean: clean-all clean-docker ## Complete clean: remove all generated files and Docker resources

.PHONY: clean-docker
clean-docker: docker-clean ## Alias for docker-clean

# -----------------------------------------------------------------------------
# CI/CD Utilities
# -----------------------------------------------------------------------------
.PHONY: ci
ci: install lint test ## CI pipeline: install, lint, and test
	@echo "$(GREEN)✓ CI pipeline passed$(RESET)"

.PHONY: ci-docker
ci-docker: docker-build docker-test ## CI pipeline with Docker: build and test
	@echo "$(GREEN)✓ Docker CI pipeline passed$(RESET)"

.PHONY: pre-commit
pre-commit: lint test-verbose ## Pre-commit hook: run quality checks
	@echo "$(GREEN)✓ Pre-commit checks passed$(RESET)"

# -----------------------------------------------------------------------------
# Information
# -----------------------------------------------------------------------------
.PHONY: info
info: ## Display project and environment information
	@echo "$(BLUE)Project Information:$(RESET)"
	@echo "  Name:        $(APP_NAME)"
	@echo "  Node:        $$($(NODE) --version)"
	@echo "  npm:         $$($(NPM) --version)"
	@echo "  Docker:      $$($(DOCKER) --version 2>/dev/null || echo 'not installed')"
	@echo "  Docker Com:  $$($(DOCKER_COMPOSE) --version 2>/dev/null | cut -d' ' -f3 || echo 'not installed')"
	@echo ""
	@echo "$(BLUE)Environment:$(RESET)"
	@echo "  NODE_ENV:    $${NODE_ENV:-not set}"
	@echo "  DEEPSEEK_API_KEY: $$( [ -n "$${DEEPSEEK_API_KEY:-}" ] && echo 'set' || echo 'not set' )"

.PHONY: version
version: ## Show version information
	@echo "$(APP_NAME) v$$(grep '"version"' package.json | head -1 | cut -d'"' -f4)"

# -----------------------------------------------------------------------------
# Development Utilities
# -----------------------------------------------------------------------------
.PHONY: watch
watch: ## Watch for file changes and restart (alias for dev)
	@$(MAKE) dev

.PHONY: rebuild
rebuild: clean-all install ## Clean and reinstall everything
	@echo "$(GREEN)✓ Rebuild complete$(RESET)"
