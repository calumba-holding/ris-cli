---
name: urteil-watchdog
version: 0.1.0
---

# urteil-watchdog

CLI tool for monitoring Austrian RIS (Rechtsinformationssystem) judgments and syncing them into Obsidian.

## What it does

- Searches RIS via the official API (`data.bka.gv.at/ris/api/v2.6`).
- Fetches details (HTML) for full text when possible.
- Writes results as `.mdx` files into an Obsidian vault folder.
- Tracks already processed documents in SQLite to avoid duplicates.
- Can send macOS notifications.

## Install

```bash
npm install
npm run build
npm link   # optional, for global `urteil-watch`
```

## Configuration

### Obsidian path

Configure via `config.json` (see `config.example.json`).

### Optional: AI summaries

```bash
export OPENAI_API_KEY=...
```

## Usage

```bash
# dev
npm run dev -- --help

# search
urteil-watch search "Cybermobbing" --limit 20

# sync default queries
urteil-watch sync

# sync custom queries
urteil-watch sync --queries "OLG §111 StGB,OLG §283 StGB"

# dry-run
urteil-watch sync --dry-run

# notify
urteil-watch notify --hours 24
```

## Notes

- This repo is intended for internal use (paths/config are tailored to our environment).
- Before adding new features, check existing `pasogott/*` repos to avoid duplicates.
