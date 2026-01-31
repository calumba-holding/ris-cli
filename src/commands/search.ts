// Search command - Search RIS for judgments

import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getRISAdapter } from '../adapters/ris.js';
import { formatOutput, parseOutputFormat } from '../lib/utils.js';
import type { SearchOptions } from '../types/index.js';

export function createSearchCommand(): Command {
  const cmd = new Command('search')
    .description('Search Austrian RIS for judgments')
    .argument('[query]', 'Search query')
    .option('-l, --limit <number>', 'Maximum results', '20')
    .option('-o, --offset <number>', 'Results offset', '0')
    .option('--from-date <date>', 'Filter from date (YYYY-MM-DD)')
    .option('--to-date <date>', 'Filter to date (YYYY-MM-DD)')
    .option('--json', 'Output as JSON')
    .option('--local', 'Search local Obsidian files instead of RIS')
    .action(async (query, options) => {
      await executeSearch(query, options);
    });

  return cmd;
}

async function executeSearch(query: string, options: any): Promise<void> {
  const outputFormat = parseOutputFormat(options.json);
  
  if (options.local) {
    await searchLocal(query, outputFormat);
    return;
  }

  if (!query) {
    // Default queries for cyberbullying/hate speech
    query = 'Cybermobbing OR Hassposting';
  }

  const searchOptions: SearchOptions = {
    limit: parseInt(options.limit, 10),
    offset: parseInt(options.offset, 10),
    fromDate: options.fromDate,
    toDate: options.toDate,
    output: outputFormat,
  };

  const adapter = getRISAdapter();
  const results = await adapter.search(query, searchOptions);

  if (outputFormat === 'json') {
    console.log(formatOutput({
      query,
      count: results.length,
      results,
    }, 'json'));
  } else {
    console.log(`\n🔍 Search results for: "${query}"\n`);
    
    if (results.length === 0) {
      console.log('No results found.\n');
      return;
    }

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   Court: ${result.court} | Date: ${result.date}`);
      console.log(`   URL: ${result.url}`);
      if (result.gz) console.log(`   GZ: ${result.gz}`);
      if (result.snippet) console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
      console.log('');
    });
  }
}

/**
 * Search local Obsidian files using ripgrep
 */
async function searchLocal(query: string, outputFormat: 'json' | 'text'): Promise<void> {
  const vaultPath = '/Users/lana/syncthing/obsidian/semir';
  const searchPath = `${vaultPath}/03_Resources/ris-watchdog/urteile`;

  try {
    // Use ripgrep to search markdown files
    const grepCmd = `grep -r -l "${query.replace(/"/g, '\\"')}" "${searchPath}"/*.mdx 2>/dev/null || echo ""`;
    const files = execSync(grepCmd, { encoding: 'utf-8' }).trim();

    if (!files) {
      console.log('No local results found.\n');
      return;
    }

    const fileList = files.split('\n').filter(f => f);
    const results = fileList.map(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = frontmatterMatch ? yaml.load(frontmatterMatch[1]) : {};
      
      // Get title from frontmatter or filename
      const title = frontmatter.title || path.basename(filePath);
      
      return {
        title,
        court: frontmatter.court || 'Unknown',
        date: frontmatter.date || 'Unknown',
        gz: frontmatter.gz || null,
        url: frontmatter.url || null,
        query,
        filePath,
        tags: frontmatter.tags || [],
      };
    });

    if (outputFormat === 'json') {
      console.log(JSON.stringify({
        query,
        count: results.length,
        results,
      }, null, 2));
    } else {
      console.log(`\n📚 Local search results for: "${query}"\n`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Court: ${result.court} | Date: ${result.date}`);
        console.log(`   File: ${result.filePath}`);
        if (result.tags?.length) console.log(`   Tags: ${result.tags.join(', ')}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Local search failed:', error);
    console.log('No local results found.\n');
  }
}
