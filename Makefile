.DEFAULT_GOAL := help

.PHONY: help install install-ci build lint typecheck test test-watch test-ui smoke check format format-check clean release

PNPM ?= pnpm
VERSION ?= $(shell node -p "require('./package.json').version")
RELEASE_TAG := v$(VERSION)

help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies for local development"
	@echo "  make install-ci    - Install dependencies with a frozen lockfile"
	@echo "  make build         - Build the CLI"
	@echo "  make lint          - Run formatting checks"
	@echo "  make typecheck     - Run TypeScript checks"
	@echo "  make test          - Run Vitest test suite"
	@echo "  make test-watch    - Run Vitest in watch mode"
	@echo "  make test-ui       - Run Vitest UI"
	@echo "  make smoke         - Run CLI smoke checks"
	@echo "  make check         - Run lint + typecheck + test + smoke"
	@echo "  make format        - Format source and root docs/config files"
	@echo "  make format-check  - Verify formatting"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make release       - Verify main/package version, then tag and push a release"

install:
	@$(PNPM) install

install-ci:
	@$(PNPM) install --frozen-lockfile

build:
	@$(PNPM) build

lint:
	@$(PNPM) lint

typecheck:
	@$(PNPM) typecheck

test:
	@$(PNPM) test

test-watch:
	@$(PNPM) test:watch

test-ui:
	@$(PNPM) test:ui

smoke:
	@$(PNPM) smoke

check:
	@$(PNPM) lint
	@$(PNPM) typecheck
	@$(PNPM) test
	@$(PNPM) smoke

format:
	@$(PNPM) format

format-check:
	@$(PNPM) format:check

clean:
	@$(PNPM) clean

release:
	@test -n "$(VERSION)" || (echo "❌ VERSION is required" && exit 1)
	@test "$$(git branch --show-current)" = "main" || (echo "❌ Release must be created from the main branch" && exit 1)
	@git diff --quiet && git diff --cached --quiet || (echo "❌ Working tree must be clean before release" && exit 1)
	@PACKAGE_VERSION="$$(node -p "require('./package.json').version")"; \
		if [ "$$PACKAGE_VERSION" != "$(VERSION)" ]; then \
			echo "❌ package.json version $$PACKAGE_VERSION does not match VERSION=$(VERSION)"; \
			exit 1; \
		fi
	@git fetch origin main --tags
	@test "$$(git rev-parse HEAD)" = "$$(git rev-parse origin/main)" || (echo "❌ Local main must match origin/main before tagging" && exit 1)
	@if git rev-parse "$(RELEASE_TAG)" >/dev/null 2>&1 || git rev-parse "refs/tags/$(RELEASE_TAG)" >/dev/null 2>&1; then \
		echo "❌ Tag $(RELEASE_TAG) already exists"; \
		exit 1; \
	fi
	@$(PNPM) check
	@$(PNPM) smoke
	@git tag -a "$(RELEASE_TAG)" -m "Release $(RELEASE_TAG)"
	@git push origin "$(RELEASE_TAG)"
	@echo "✅ Release tag $(RELEASE_TAG) pushed"
