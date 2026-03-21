# ris-cli

`ris-cli` is a Node.js CLI that aims to become a practical wrapper around the Austrian RIS (Rechtsinformationssystem) API.

Today, the implemented CLI surface is focused on **Judikatur**, specifically the RIS `Judikatur` endpoint currently used by this project. The broader RIS API surface is already documented in `docs/`, but not all of it is exposed as CLI commands yet.

## Current scope

Right now, `ris-cli` can:

- search RIS **judgments / Judikatur** via the official API
- sync matching Judikatur results into an Obsidian vault as Markdown/MDX files
- track already processed documents in SQLite to avoid duplicates
- run an interactive onboarding command that writes runtime config
- generate summaries via `extractive`, `ollama`, `vllm`, `mlx-lm`, or any OpenAI-compatible endpoint
- send optional Telegram notifications
- send native macOS notifications as a fallback when Telegram is not configured

## Project status

- **Vision:** a CLI wrapper for the broader RIS API, not only one narrow search workflow
- **Current implementation:** only the **Judikatur** part is wired into commands like `search`, `sync`, and `notify`
- **Documentation status:** `docs/` already contains researched material for additional RIS areas and endpoints

If you are evaluating the project, treat the current CLI as **"RIS wrapper with Judikatur-first support"**, not yet as a full wrapper for every RIS endpoint.

## Requirements

- Node.js 20+
- For sync/local search: an Obsidian vault path you can write to
- For generated summaries:
  - `ollama` running locally, or
  - a `vllm`/`mlx-lm`/OpenAI-compatible server, or
  - no model at all if you use the default `extractive` provider
- For Telegram notifications: a bot token and chat ID

## Installation

### Global install

```bash
pnpm add -g @calumba/ris-cli
# or
npm i -g @calumba/ris-cli
```

### One-off use with pnpm dlx

```bash
pnpm dlx @calumba/ris-cli --help
```

### Local development

```bash
pnpm install
pnpm build
node bin/ris-cli.js --help
```

## Configuration

`ris-cli` reads configuration in this order:

1. Environment variables
2. `RIS_CLI_CONFIG` file path
3. `~/.config/ris-cli/config.json`
4. Legacy fallback: `~/.config/urteil-watch/config.json` and `~/.config/urteil-watchdog/config.json`

### Example config

Create `~/.config/ris-cli/config.json`:

```json
{
  "obsidianVaultPath": "/path/to/your/obsidian-vault",
  "dataFolder": "ris-cli",
  "summaryProvider": "ollama",
  "summaryModel": "llama3.1:8b",
  "summaryBaseUrl": "http://127.0.0.1:11434",
  "summaryApiKey": "optional-if-needed",
  "telegram": {
    "botToken": "123456:ABCDEF...",
    "chatId": "-1001234567890",
    "topicId": 5
  }
}
```

### Environment variables

```bash
# Optional: generated summaries
RIS_CLI_SUMMARY_PROVIDER=ollama
RIS_CLI_SUMMARY_MODEL=llama3.1:8b
RIS_CLI_SUMMARY_BASE_URL=http://127.0.0.1:11434
RIS_CLI_SUMMARY_API_KEY=

# Backward-compatible OpenAI aliases
OPENAI_API_KEY=
RIS_CLI_OPENAI_API_KEY=

# Optional: explicit config path
RIS_CLI_CONFIG=/path/to/config.json

# Required for sync/local search if not set in config
RIS_CLI_OBSIDIAN_VAULT_PATH=/path/to/your/obsidian-vault
RIS_CLI_DATA_FOLDER=ris-cli

# Optional: Telegram notifications
RIS_CLI_TELEGRAM_BOT_TOKEN=...
RIS_CLI_TELEGRAM_CHAT_ID=...
RIS_CLI_TELEGRAM_TOPIC_ID=5
```

### Summary provider notes

- `extractive` — default fallback, no model required
- `ollama` — defaults to `http://127.0.0.1:11434`
- `vllm` — defaults to `http://127.0.0.1:8000/v1`
- `mlx-lm` — defaults to `http://127.0.0.1:8080/v1`
- `openai-compatible` — works with any OpenAI-style chat completions endpoint

Examples:

```bash
# Ollama
RIS_CLI_SUMMARY_PROVIDER=ollama \
RIS_CLI_SUMMARY_MODEL=llama3.1:8b \
ris-cli search "Beleidigung" --with-summary --limit 3

# vLLM
RIS_CLI_SUMMARY_PROVIDER=vllm \
RIS_CLI_SUMMARY_MODEL=meta-llama/Llama-3.1-8B-Instruct \
RIS_CLI_SUMMARY_BASE_URL=http://127.0.0.1:8000/v1 \
ris-cli search "Beleidigung" --with-summary --limit 3

# mlx-lm server
RIS_CLI_SUMMARY_PROVIDER=mlx-lm \
RIS_CLI_SUMMARY_MODEL=mlx-community/Llama-3.2-3B-Instruct-4bit \
RIS_CLI_SUMMARY_BASE_URL=http://127.0.0.1:8080/v1 \
ris-cli search "Beleidigung" --with-summary --limit 3
```

## RIS coverage

The underlying RIS API exposes multiple top-level areas beyond Judikatur. This repository already tracks and documents that larger surface in:

- `docs/ris-api-overview.md`
- `docs/ris-api-endpoints-catalog.md`
- `docs/judikatur/`
- `docs/sonstige/`

However, the executable CLI currently wraps only the Judikatur workflow used in this project.

That means:

- `search` currently searches **Judikatur**
- `sync` currently syncs **Judikatur** documents into Obsidian
- `notify` currently reports on newly synced **Judikatur** items
- other documented RIS endpoint families are **not yet exposed as first-class CLI commands**

## Usage

### Show help

```bash
ris-cli --help
```

### Onboard interactively

Creates the runtime config file for `ris-cli`.

```bash
ris-cli onboard
ris-cli onboard --vault-path "/path/to/vault"
ris-cli onboard --summary-provider ollama --summary-model llama3.1:8b
ris-cli onboard --json
```

### Search RIS

At the moment this means: search the RIS **Judikatur** endpoint used by the project.

```bash
ris-cli search "Cybermobbing"
ris-cli search "Beleidigung" --from-date 2023-01-01 --to-date 2023-12-31
ris-cli search "Verhetzung" --limit 10
ris-cli search "Verhetzung" --court OGH --limit 10
ris-cli search "Verhetzung" --with-summary --limit 3
ris-cli search --json
```

Search results are requested from RIS as decision texts and sorted server-side by date descending (newest first). Add `--with-summary` to fetch the full text of each result and generate a summary.

### Search locally in synced files

Requires an Obsidian vault path via config or environment.

```bash
ris-cli search --local "StGB"
```

### Sync judgments into Obsidian

This currently syncs **Judikatur** results, not the full RIS API surface.

```bash
ris-cli sync
ris-cli sync --dry-run
ris-cli sync --queries "Cybermobbing,Hassposting"
ris-cli sync --court OGH --max-results-per-query 50
ris-cli sync --force
ris-cli sync --json
```

By default, incremental sync uses the last successful sync date as its lower bound when available; otherwise it falls back to the last 30 days.

Default sync queries:

- `üble Nachrede §111 StGB`
- `Beleidigung §115 StGB`
- `Verhetzung §283 StGB`
- `Cybermobbing`
- `Hassposting`

### Notify about recent judgments

Notifications currently operate on newly synced **Judikatur** items.

```bash
ris-cli notify
ris-cli notify --hours 48
ris-cli notify --silent
ris-cli notify --json
```

## Output

Synced **Judikatur** items are stored in your configured Obsidian vault under:

```text
<dataFolder>/
├── urteile/
└── state.sqlite
```

Each judgment is written as Markdown/MDX with YAML frontmatter containing metadata such as court, date, case number, source URL, query, tags, and retrieval time.

## Development

```bash
pnpm install
make help
make check
```

Common targets:

```bash
make build
make test
make smoke
make format
```

## Release

Versioned releases are published through GitHub Actions via `.github/workflows/release.yml`.

### Maintainer workflow

1. Ensure the working tree is clean and `main` is up to date.
2. Bump the package version locally.
3. Push the commit and version tag.
4. Let GitHub Actions run the release workflow.

Example:

```bash
git checkout main
git pull --ff-only
pnpm install
pnpm check
pnpm version patch
# or: pnpm version minor
# or: pnpm version major

git push origin main --follow-tags
```

That creates a tag like `v1.0.1`, which triggers the release workflow. The workflow then:

- verifies the tag matches `package.json`
- runs checks and smoke tests
- builds the package
- tests the packed tarball
- publishes to npm with provenance
- creates a GitHub Release

### Manual workflow dispatch

You can also start the release workflow manually from GitHub Actions with an explicit version input like `v1.0.1`. In that case, make sure:

- the tag already exists or the selected ref matches that version
- `package.json` already contains the same version without the `v` prefix

### Install a released version

```bash
pnpm add -g @calumba/ris-cli
# or
npm i -g @calumba/ris-cli
# or
pnpm dlx @calumba/ris-cli --help
```

## License

MIT
