// Sync command - Run searches and persist to Obsidian

import { Command } from "commander";
import { getRISAdapter } from "../adapters/ris.js";
import { getObsidianAdapter } from "../adapters/obsidian.js";
import { generateSummary } from "../lib/summary.js";
import { parseOutputFormat } from "../lib/utils.js";
import type { Judgment, SyncOptions } from "../types/index.js";

// Default queries for cyberbullying and hate speech
export const DEFAULT_QUERIES = [
  "üble Nachrede §111 StGB",
  "Beleidigung §115 StGB",
  "Verhetzung §283 StGB",
  "Cybermobbing",
  "Hassposting",
];

const DEFAULT_SYNC_LOOKBACK_DAYS = 30;
const DEFAULT_MAX_RESULTS_PER_QUERY = 100;

export function createSyncCommand(): Command {
  const cmd = new Command("sync")
    .description(
      "Run searches for predefined keywords and persist new results to Obsidian",
    )
    .option(
      "-q, --queries <items>",
      "Comma-separated custom queries (overrides defaults)",
    )
    .option(
      "--from-date <date>",
      "Filter from date (YYYY-MM-DD) [default: last successful sync or last 30 days]",
    )
    .option("--to-date <date>", "Filter to date (YYYY-MM-DD) [default: today]")
    .option(
      "--court <court>",
      "Filter by court, e.g. OGH, OLG Wien, LG Salzburg",
    )
    .option(
      "--max-results-per-query <number>",
      "Maximum RIS results to process per query",
      String(DEFAULT_MAX_RESULTS_PER_QUERY),
    )
    .option("--dry-run", "Show what would be synced, but do not write files")
    .option(
      "--force",
      "Re-process items even if already processed (ignore duplicate detection)",
    )
    // Back-compat / power-user switch (prefer --dry-run / --force)
    .option(
      "--mode <mode>",
      "Sync mode: incremental (default), full, test",
      "incremental",
    )
    .option("--json", "Output as JSON")
    .action(async (options) => {
      await executeSync(options);
    });

  return cmd;
}

async function executeSync(rawOptions: any): Promise<void> {
  const outputFormat = parseOutputFormat(rawOptions.json);

  // Resolve mode
  const hasMode =
    typeof rawOptions.mode === "string" && rawOptions.mode.length > 0;
  const wantsDryRun = !!rawOptions.dryRun;
  const wantsForce = !!rawOptions.force;

  if (
    (wantsDryRun && wantsForce) ||
    ((wantsDryRun || wantsForce) &&
      hasMode &&
      rawOptions.mode !== "incremental")
  ) {
    console.error(
      "❌ Invalid options: use either --dry-run, --force, or --mode (not a mix).",
    );
    return;
  }

  const mode = wantsDryRun
    ? "test"
    : wantsForce
      ? "full"
      : rawOptions.mode || "incremental";

  // Validate mode
  const validModes = ["incremental", "full", "test"];
  if (!validModes.includes(mode)) {
    console.error(
      `❌ Invalid mode: ${mode}. Valid modes: ${validModes.join(", ")}`,
    );
    return;
  }

  const dryRun = mode === "test";
  const force = mode === "full";

  // Parse queries
  const queries = parseQueries(rawOptions.queries);

  const options: SyncOptions = {
    queries,
    fromDate: rawOptions.fromDate,
    toDate: rawOptions.toDate,
    dryRun,
    force,
    output: outputFormat,
    gericht: rawOptions.court,
    maxResultsPerQuery: parsePositiveInteger(
      rawOptions.maxResultsPerQuery,
      DEFAULT_MAX_RESULTS_PER_QUERY,
    ),
  };

  const risAdapter = getRISAdapter();
  const obsidianAdapter = getObsidianAdapter();
  const syncStartedAt = new Date();
  const lastSuccessfulSync = obsidianAdapter.getLastSuccessfulSync();
  const syncWindow = resolveSyncWindow({
    fromDate: options.fromDate,
    toDate: options.toDate,
    mode,
    lastSuccessfulSync,
    now: syncStartedAt,
  });

  const synced: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  const modeEmojiMap: Record<"incremental" | "full" | "test", string> = {
    incremental: "🔄",
    full: "🔁",
    test: "🧪",
  };
  const modeDescMap: Record<"incremental" | "full" | "test", string> = {
    incremental: "Syncing new items only",
    full: "Full re-sync (all items)",
    test: "Test mode (dry run)",
  };
  const typedMode = mode as "incremental" | "full" | "test";
  const modeEmoji = modeEmojiMap[typedMode];
  const modeDesc = modeDescMap[typedMode];

  console.log(
    `\n${modeEmoji} Starting sync (${modeDesc}) for ${queries.length} query/queries...\n`,
  );
  if (syncWindow.derivedFromLastSync) {
    console.log(
      `ℹ️ Using last successful sync as baseline: ${syncWindow.fromDate} (stored: ${lastSuccessfulSync})\n`,
    );
  }

  const perQueryStats: Array<{
    query: string;
    found: number;
    synced: number;
    skipped: number;
    errors: number;
  }> = [];

  for (const query of queries) {
    console.log(
      `📋 Searching: "${query}" (${syncWindow.fromDate} → ${syncWindow.toDate})`,
    );
    if (options.gericht) {
      console.log(`   Court filter: ${options.gericht}`);
    }

    const queryStats = { query, found: 0, synced: 0, skipped: 0, errors: 0 };

    try {
      const results = await risAdapter.search(query, {
        limit: options.maxResultsPerQuery,
        fromDate: syncWindow.fromDate,
        toDate: syncWindow.toDate,
        gericht: options.gericht,
      });
      queryStats.found = results.length;

      for (const result of results) {
        const id = result.id;

        // Check if already processed
        if (!force && obsidianAdapter.isProcessed(id)) {
          skipped.push(id);
          queryStats.skipped += 1;
          continue;
        }

        if (dryRun) {
          console.log(`   [DRY-RUN] Would process: ${result.title}`);
          continue;
        }

        // Fetch full details
        const detail = await risAdapter.fetchDetail(result);

        if (!detail) {
          errors.push(id);
          queryStats.errors += 1;
          continue;
        }

        const { summary } = await generateSummary(detail);

        const judgment: Judgment = {
          id,
          title: detail.title,
          court: detail.court,
          date: detail.date,
          gz: detail.gz,
          url: detail.url,
          query,
          fullText: detail.fullText,
          summary,
          retrievedAt: new Date().toISOString(),
          tags: extractTags(query),
        };

        obsidianAdapter.saveJudgment(judgment, summary);
        synced.push(id);
        queryStats.synced += 1;

        console.log(`   ✅ Saved: ${judgment.title}`);
      }

      console.log(`   Found ${results.length} result(s)\n`);
    } catch (error) {
      console.error(`   ❌ Error processing query "${query}":`, error);
      errors.push(query);
      queryStats.errors += 1;
    }

    perQueryStats.push(queryStats);
  }

  const processedCount = synced.length + skipped.length;
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

  if (!dryRun && errors.length === 0) {
    obsidianAdapter.setLastSuccessfulSync(syncStartedAt.toISOString());
  }

  console.log("\n📊 Sync Summary");
  console.log("───────────────");
  console.log(`Mode: ${modeLabel}`);
  console.log(`Window: ${syncWindow.fromDate} → ${syncWindow.toDate}`);
  console.log(`Max results per query: ${options.maxResultsPerQuery}`);
  if (options.gericht) console.log(`Court: ${options.gericht}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`  - New: ${synced.length}`);
  console.log(`  - Skipped (duplicates): ${skipped.length}`);
  console.log(`  - Errors: ${errors.length}`);
  console.log(`Total in database: ${obsidianAdapter.getProcessedCount()}`);
  if (!dryRun) {
    console.log(
      `Last successful sync: ${obsidianAdapter.getLastSuccessfulSync() || "not recorded"}`,
    );
  }
  console.log("");

  if (outputFormat === "json") {
    console.log(
      JSON.stringify(
        {
          mode,
          queries,
          fromDate: syncWindow.fromDate,
          toDate: syncWindow.toDate,
          court: options.gericht ?? null,
          maxResultsPerQuery: options.maxResultsPerQuery,
          derivedFromLastSync: syncWindow.derivedFromLastSync,
          lastSuccessfulSync: obsidianAdapter.getLastSuccessfulSync() ?? null,
          results: {
            synced: synced.length,
            skipped: skipped.length,
            errors: errors.length,
            totalInDb: obsidianAdapter.getProcessedCount(),
          },
          perQuery: perQueryStats,
        },
        null,
        2,
      ),
    );
  }

  if (mode === "test") {
    console.log("🧪 This was a test run. No files were saved.\n");
  }
}

export function resolveSyncWindow(input: {
  fromDate?: string;
  toDate?: string;
  mode: string;
  lastSuccessfulSync?: string;
  now?: Date;
}): { fromDate: string; toDate: string; derivedFromLastSync: boolean } {
  const now = input.now ?? new Date();
  const toDate = input.toDate ?? now.toISOString().slice(0, 10);

  if (input.fromDate) {
    return { fromDate: input.fromDate, toDate, derivedFromLastSync: false };
  }

  const shouldUseLastSync =
    input.mode === "incremental" && Boolean(input.lastSuccessfulSync);
  if (shouldUseLastSync && input.lastSuccessfulSync) {
    return {
      fromDate: input.lastSuccessfulSync.slice(0, 10),
      toDate,
      derivedFromLastSync: true,
    };
  }

  return {
    fromDate: new Date(
      now.getTime() - DEFAULT_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10),
    toDate,
    derivedFromLastSync: false,
  };
}

function parseQueries(rawQueries: string | undefined): string[] {
  if (!rawQueries) return DEFAULT_QUERIES;
  return rawQueries
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean);
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

/**
 * Extract tags from query
 */
function extractTags(query: string): string[] {
  const tags: string[] = ["ris-cli"];

  if (
    query.toLowerCase().includes("mobbing") ||
    query.toLowerCase().includes("cyber")
  ) {
    tags.push("cybermobbing");
  }
  if (
    query.toLowerCase().includes("hass") ||
    query.toLowerCase().includes("posting")
  ) {
    tags.push("hassposting");
  }
  if (query.includes("§111")) tags.push("stgb-111", "üble-nachrede");
  if (query.includes("§115")) tags.push("stgb-115", "beleidigung");
  if (query.includes("§283")) tags.push("stgb-283", "verhetzung");

  return tags;
}
