.DEFAULT_GOAL := help

.PHONY: help install install-ci build lint typecheck test test-watch test-ui smoke check format format-check clean release-doctor release

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
	@echo "  make release-doctor - Verify release prerequisites and publishing policy"
	@echo "  make release       - Run release-doctor, then tag and push a release"

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

release-doctor:
	@command -v gh >/dev/null 2>&1 || (echo "❌ gh CLI is required for release checks" && exit 1)
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
	@REPO_VISIBILITY="$$(gh repo view --json visibility -q .visibility | tr '[:upper:]' '[:lower:]')"; \
		PACKAGE_PROVENANCE="$$(node -p "String(Boolean(require('./package.json').publishConfig?.provenance))")"; \
		if [ "$$PACKAGE_PROVENANCE" = "true" ] && [ "$$REPO_VISIBILITY" != "public" ]; then \
			echo "❌ npm provenance requires a public GitHub repository (current visibility: $$REPO_VISIBILITY)"; \
			exit 1; \
		fi; \
		echo "✅ Release doctor passed for $(RELEASE_TAG) (visibility: $$REPO_VISIBILITY, provenance: $$PACKAGE_PROVENANCE)"

release: release-doctor
	@$(PNPM) check
	@$(PNPM) smoke
	@git tag -a "$(RELEASE_TAG)" -m "Release $(RELEASE_TAG)"
	@git push origin "$(RELEASE_TAG)"
	@echo "✅ Release tag $(RELEASE_TAG) pushed"
