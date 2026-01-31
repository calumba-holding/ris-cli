// Notify command - Send notifications for new items

import { Command } from 'commander';
import { getObsidianAdapter } from '../adapters/obsidian.js';
import { notifyNewJudgments, notifyJudgmentList, notifySyncComplete, logToConsole } from '../lib/notifications.js';
import type { NotifyOptions } from '../types/index.js';

export function createNotifyCommand(): Command {
  const cmd = new Command('notify')
    .description('Send notifications for new items since last run')
    .option('--hours <number>', 'Check for new items within last N hours', '24')
    .option('--silent', 'Suppress notification sound')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await executeNotify(options);
    });

  return cmd;
}

async function executeNotify(options: any): Promise<void> {
  const hours = parseInt(options.hours, 10) || 24;
  const silent = options.silent || false;
  const outputJson = options.json || false;

  const obsidianAdapter = getObsidianAdapter();

  // Get recent judgments
  const recentJudgments = obsidianAdapter.getRecentJudgments(hours)
    .filter((j: any) => j && typeof j === 'object' && (j.query || j.url || j.id));

  if (outputJson) {
    console.log(JSON.stringify({
      hours,
      count: recentJudgments.length,
      judgments: recentJudgments,
      lastCheck: new Date().toISOString(),
    }, null, 2));
    return;
  }

  console.log(`\n🔔 Checking for new judgments (last ${hours} hours)...\n`);

  if (recentJudgments.length === 0) {
    logToConsole('No new judgments since last check.', 'info');
    
    // Still send notification that everything is up to date
    if (!silent) {
      notifyNewJudgments(0);
    }
    return;
  }

  // Group by query
  const byQuery = recentJudgments.reduce((acc: Record<string, number>, j: any) => {
    const q = j.query || 'unknown';
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  console.log(`Found ${recentJudgments.length} new judgment(s):\n`);
  
  // List recent judgments
  recentJudgments.forEach((judgment, index) => {
    const displayName = judgment.filePath
      ? judgment.filePath.split('/').pop()
      : (judgment.url || judgment.id);

    console.log(`${index + 1}. ${displayName}`);
    console.log(`   Query: "${judgment.query}"`);
    console.log(`   Processed: ${judgment.processedAt}`);
    if (!judgment.filePath) console.log('   (warn: missing filePath in DB row)');
    console.log('');
  });

  // Send notification
  if (!silent) {
    // Preferred: one Telegram message with the list (falls back to macOS summary)
    notifyJudgmentList(recentJudgments, hours);

    // Also send per-query count notifications (macOS -> fine, Telegram -> a bit noisy but OK)
    Object.entries(byQuery).forEach(([query, count]) => {
      notifyNewJudgments(count as number, query);
    });

    // Also send sync complete notification
    notifySyncComplete(recentJudgments.length);
  }

  console.log(`\n✅ Sent notifications for ${recentJudgments.length} new item(s)\n`);
}
