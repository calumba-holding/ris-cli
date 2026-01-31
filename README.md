# urteil-watch

CLI tool for monitoring Austrian RIS (Rechtsinformationssystem) judgments related to cyberbullying, hate speech, and related offenses.

## Features

- **Search**: Query the Austrian RIS API for judgments
- **Sync**: Automatically monitor predefined keywords and save results to Obsidian
- **Notify**: Get native macOS notifications for new judgments
- **API-first**: Uses official data.bka.gv.at RIS API v2.6
- **Full-text search**: Search local Obsidian files with ripgrep
- **AI summaries**: Optional OpenAI integration for judgment summaries

## Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd urteil-watchdog
npm install

# Build the project
npm run build

# Make CLI available globally (optional)
npm link
```

## Configuration

### Environment Variables

Create a `.env` file or set these variables:

```bash
# Optional: Enable AI summaries via OpenAI
OPENAI_API_KEY=sk-your-api-key
```

### Obsidian Vault

The tool expects an Obsidian vault at:
```
/Users/lana/syncthing/obsidian/semir
```

It will create its own folder structure:
```
03_Resources/
└── ris-watchdog/
    ├── urteile/          # Saved judgments as .mdx files
    └── state.sqlite      # Tracking database
```

## Usage

### Search for judgments

```bash
# Search with default cyberbullying keywords
urteil-watch search

# Custom query
urteil-watch search "Cybermobbing"

# Search with date filters
urteil-watch search "Beleidigung" --from-date 2023-01-01 --to-date 2023-12-31

# Limit results
urteil-watch search "Verhetzung" --limit 10

# JSON output
urteil-watch search --json

# Search local Obsidian files
urteil-watch search --local "StGB"
```

### Sync judgments to Obsidian

```bash
# Run with default queries
urteil-watch sync

# Dry run (show what would be synced)
urteil-watch sync --dry-run

# (Advanced / back-compat) mode switch
urteil-watch sync --mode test

# Custom queries
urteil-watch sync --queries "Cybermobbing,Hassposting"

# Force re-process all results
urteil-watch sync --force

# JSON output
urteil-watch sync --json
```

### Default Queries

The sync command uses these default search queries:
- `üble Nachrede §111 StGB`
- `Beleidigung §115 StGB`
- `Verhetzung §283 StGB`
- `Cybermobbing`
- `Hassposting`

### Send notifications

```bash
# Check last 24 hours and notify
urteil-watch notify

# Custom time range
urteil-watch notify --hours 48

# Silent mode (no sound)
urteil-watch notify --silent

# JSON output
urteil-watch notify --json
```

## Output Format

### Saved Judgment (.mdx)

Each judgment is saved as a markdown file with YAML frontmatter:

```yaml
---
title: Entscheidung des Obersten Gerichtshofs
court: Oberster Gerichtshof
date: 2023-03-15
gz: 4Ob123/23x
url: https://www.ris.bka.gv.at/...
query: üble Nachrede §111 StGB
tags:
  - ris-watchdog
  - stgb-111
  - üble-nachrede
retrieved_at: 2024-01-15T10:30:00.000Z
---

# Entscheidung des Obersten Gerichtshofs

## Zusammenfassung (AI-generiert)

...AI summary...

## Volltext

...full judgment text...
```

## How It Works

## RIS API

The tool uses the official [RIS API v2.6](https://data.bka.gv.at/ris/api/v2.6/Help/Api/GET-Judikatur) for querying judgments:

```
https://data.bka.gv.at/ris/api/v2.6/Judikatur?Suchworte=SEARCH_TERM
```

### How It Works

1. **Search**: Query the RIS API with `Suchworte` parameter
2. **Parse**: Extract judgment metadata (Geschäftszahl, court, date, URL)
3. **Fetch details**: For full text, fetch the document detail page
4. **Save**: Write judgment to Obsidian vault as MDX with YAML frontmatter

### Duplicate Detection

Processed judgments are tracked in a SQLite database using:
- MD5 hash of the URL as unique ID
- Indexed by URL and query for fast lookups

### AI Summaries

If `OPENAI_API_KEY` is set, judgments are summarized using GPT-4o. Otherwise, a naive summary is generated from the first few sentences.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests (non-interactive)
npm test

# Watch mode
npm run test:watch

# Build for production
npm run build
```

## Project Structure

```
urteil-watchdog/
├── bin/
│   └── urteil-watch.js      # Binary entry point
├── src/
│   ├── adapters/
│   │   ├── ris.ts           # RIS scraping adapter
│   │   └── obsidian.ts      # Obsidian integration
│   ├── commands/
│   │   ├── search.ts        # Search command
│   │   ├── sync.ts          # Sync command
│   │   └── notify.ts        # Notify command
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   ├── summary.ts       # AI summary generation
│   │   └── notifications.ts # macOS notifications
│   ├── test/
│   │   └── ris.test.ts      # Unit tests
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── cli.ts               # CLI entry point
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## License

MIT
