// Sync command - Run searches and persist to Obsidian

import { Command } from 'commander';
import { getRISAdapter } from '../adapters/ris.js';
import { getObsidianAdapter } from '../adapters/obsidian.js';
import { generateSummary } from '../lib/summary.js';
import { formatOutput, parseOutputFormat } from '../lib/utils.js';
import type { Judgment, SearchResult } from '../types/index.js';

// Default queries for cyberbullying and hate speech
export const DEFAULT_QUERIES = [
  'üble Nachrede §111 StGB',
  'Beleidigung §115 StGB',
  'Verhetzung §283 StGB',
  'Cybermobbing',
  'Hassposting',
];

export function createSyncCommand(): Command {
  const cmd = new Command('sync')
    .description('Run searches for predefined keywords and persist new results to Obsidian')
    .option('-q, --queries <items>', 'Comma-separated custom queries (overrides defaults)')
    .option('--dry-run', 'Show what would be synced, but do not write files')
    .option('--force', 'Re-process items even if already processed (ignore duplicate detection)')
    // Back-compat / power-user switch (prefer --dry-run / --force)
    .option('--mode <mode>', 'Sync mode: incremental (default), full, test', 'incremental')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await executeSync(options);
    });

  return cmd;
}

async function executeSync(options: any): Promise<void> {
  const outputFormat = parseOutputFormat(options.json);

  // Resolve mode
  const hasMode = typeof options.mode === 'string' && options.mode.length > 0;
  const wantsDryRun = !!options.dryRun;
  const wantsForce = !!options.force;

  if ((wantsDryRun && wantsForce) || ((wantsDryRun || wantsForce) && hasMode && options.mode !== 'incremental')) {
    console.error('❌ Invalid options: use either --dry-run, --force, or --mode (not a mix).');
    return;
  }

  const mode = wantsDryRun ? 'test' : wantsForce ? 'full' : (options.mode || 'incremental');

  // Validate mode
  const validModes = ['incremental', 'full', 'test'];
  if (!validModes.includes(mode)) {
    console.error(`❌ Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
    return;
  }

  const dryRun = mode === 'test';
  const force = mode === 'full';

  // Parse queries
  let queries: string[];
  if (options.queries) {
    queries = options.queries.split(',').map((q: string) => q.trim());
  } else {
    queries = DEFAULT_QUERIES;
  }

  const risAdapter = getRISAdapter();
  const obsidianAdapter = getObsidianAdapter();

  const synced: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  const modeEmoji = {
    incremental: '🔄',
    full: '🔁',
    test: '🧪',
  }[mode];

  const modeDesc = {
    incremental: 'Syncing new items only',
    full: 'Full re-sync (all items)',
    test: 'Test mode (dry run)',
  }[mode];

  console.log(`\n${modeEmoji} Starting sync (${modeDesc}) for ${queries.length} query/queries...\n`);

  for (const query of queries) {
    console.log(`📋 Searching: "${query}"`);

    try {
      const results = await risAdapter.search(query, { limit: 10 });

      for (const result of results) {
        const id = result.id;

        // Check if already processed
        if (!force && obsidianAdapter.isProcessed(id)) {
          skipped.push(id);
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
          continue;
        }

        // Generate summary (if OpenAI available)
        const { summary } = await generateSummary(detail);

        // Create judgment object
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

        // Save to Obsidian
        const filePath = obsidianAdapter.saveJudgment(judgment, summary);
        synced.push(id);
        
        console.log(`   ✅ Saved: ${judgment.title}`);
      }

      console.log(`   Found ${results.length} result(s)\n`);
    } catch (error) {
      console.error(`   ❌ Error processing query "${query}":`, error);
      errors.push(query);
    }
  }

  // Summary
  const processedCount = synced.length + skipped.length;
  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  
  console.log('\n📊 Sync Summary');
  console.log(`───────────────`);
  console.log(`Mode: ${modeLabel}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`  - New: ${synced.length}`);
  console.log(`  - Skipped (duplicates): ${skipped.length}`);
  console.log(`  - Errors: ${errors.length}`);
  console.log(`Total in database: ${obsidianAdapter.getProcessedCount()}\n`);

  if (outputFormat === 'json') {
    console.log(JSON.stringify({
      mode,
      queries,
      results: {
        synced: synced.length,
        skipped: skipped.length,
        errors: errors.length,
        totalInDb: obsidianAdapter.getProcessedCount(),
      },
    }, null, 2));
  }

  if (mode === 'test') {
    console.log('🧪 This was a test run. No files were saved.\n');
  }
}

/**
 * Extract tags from query
 */
function extractTags(query: string): string[] {
  const tags: string[] = ['ris-watchdog'];

  // Tag based on content
  if (query.toLowerCase().includes('mobbing') || query.toLowerCase().includes('cyber')) {
    tags.push('cybermobbing');
  }
  if (query.toLowerCase().includes('hass') || query.toLowerCase().includes('posting')) {
    tags.push('hassposting');
  }
  if (query.includes('§111')) tags.push('stgb-111', 'üble-nachrede');
  if (query.includes('§115')) tags.push('stgb-115', 'beleidigung');
  if (query.includes('§283')) tags.push('stgb-283', 'verhetzung');

  return tags;
}
