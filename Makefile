.DEFAULT_GOAL := help

.PHONY: help install install-ci build lint typecheck test test-watch test-ui smoke check format format-check clean

PNPM ?= pnpm

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
