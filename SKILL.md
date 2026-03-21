---
name: ris-cli
version: 1.0.0
---

# ris-cli

`ris-cli` is a CLI wrapper for the Austrian RIS (Rechtsinformationssystem) API with a current focus on **Judikatur** workflows.

## Current scope

Today the implemented commands are centered on Judikatur:

- search Judikatur documents via the official RIS API
- sync matching Judikatur results into an Obsidian vault
- track processed items in SQLite to avoid duplicates
- generate optional summaries
- send Telegram or macOS notifications
- create runtime config via `onboard`

The repository also contains broader RIS endpoint documentation under `docs/`, but those areas are not yet fully exposed as first-class CLI commands.

## Install

```bash
pnpm install
pnpm build
pnpm link --global   # optional, for a global `ris-cli`
```

## Configuration

Primary config path:

```text
~/.config/ris-cli/config.json
```

Environment variables use the `RIS_CLI_*` prefix. Legacy `URTEIL_WATCH_*` variables and config paths are still supported for backward compatibility.

### Optional: AI summaries

```bash
export RIS_CLI_SUMMARY_PROVIDER=ollama
export RIS_CLI_SUMMARY_MODEL=llama3.1:8b
# or use OPENAI_API_KEY / RIS_CLI_SUMMARY_API_KEY for an OpenAI-compatible endpoint
```

## Usage

```bash
# dev
pnpm dev -- --help

# search Judikatur
ris-cli search "Cybermobbing" --limit 20

# sync default Judikatur queries
ris-cli sync

# sync custom queries
ris-cli sync --queries "OLG §111 StGB,OLG §283 StGB"

# dry-run
ris-cli sync --dry-run

# notify for recent synced items
ris-cli notify --hours 24

# create config interactively
ris-cli onboard
```

## Notes

- `ris-cli` is intended to grow into a broader RIS wrapper, but the current executable scope is Judikatur-first.
- See `README.md` and `docs/` for the wider RIS API coverage already documented in the repository.
