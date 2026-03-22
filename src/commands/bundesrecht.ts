// Bundesrecht command - Search RIS Bundesrecht (BrKons)

import { Command } from "commander";
import { getRISAdapter } from "../adapters/ris.js";
import type { LawDetail, LawSearchResult } from "../types/index.js";

interface BundesrechtOptions {
  limit?: string;
  offset?: string;
  withFullText?: boolean;
  json?: boolean;
}

export function createBundesrechtCommand(): Command {
  return new Command("bundesrecht")
    .description(
      "Search RIS Bundesrecht (BrKons) and optionally fetch the matched provision full text",
    )
    .argument("<query>", "Search query, e.g. 'BDG § 3'")
    .option("-l, --limit <number>", "Maximum results", "20")
    .option("-o, --offset <number>", "Results offset", "0")
    .option(
      "--with-full-text",
      "Fetch the matched provision full text via RIS content URLs and page fallbacks",
    )
    .option("--json", "Output as JSON")
    .action(async (query: string, options: BundesrechtOptions) => {
      await executeBundesrecht(query, options);
    });
}

export async function executeBundesrecht(
  query: string,
  options: BundesrechtOptions,
): Promise<void> {
  const adapter = getRISAdapter();
  const results = await adapter.searchBundesrecht(query, {
    limit: parseIntegerOption(options.limit, 20),
    offset: parseIntegerOption(options.offset, 0),
  });

  const output = options.withFullText
    ? await fetchFullTextResults(results)
    : results;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          query,
          count: output.length,
          results: output,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`\n📚 Bundesrecht results for: "${query}"\n`);

  if (output.length === 0) {
    console.log("No results found.\n");
    return;
  }

  output.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    if (result.documentType) console.log(`   Type: ${result.documentType}`);
    if (result.effectiveDate)
      console.log(`   Effective date: ${result.effectiveDate}`);
    if (result.lawNumber) console.log(`   Law number: ${result.lawNumber}`);
    console.log(`   URL: ${result.url}`);
    if (result.currentLawUrl && result.currentLawUrl !== result.url) {
      console.log(`   Current law URL: ${result.currentLawUrl}`);
    }

    if (options.withFullText && "fullText" in result) {
      console.log("");
      console.log(result.fullText);
    }

    console.log("");
  });
}

async function fetchFullTextResults(
  results: LawSearchResult[],
): Promise<LawDetail[]> {
  const adapter = getRISAdapter();
  const enriched: LawDetail[] = [];

  for (const result of results) {
    const detail = await adapter.fetchBundesrechtDetail(result);

    if (!detail) {
      throw new Error(
        `Failed to fetch full text for ${result.title} (${result.url}).`,
      );
    }

    enriched.push(detail);
  }

  return enriched;
}

function parseIntegerOption(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
