// Search command - Search RIS for judgments

import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { getRISAdapter } from "../adapters/ris.js";
import { getDataFolder, requireObsidianVaultPath } from "../lib/config.js";
import { generateSummary } from "../lib/summary.js";
import { formatOutput, parseOutputFormat } from "../lib/utils.js";
import type { SearchOptions, SearchResult } from "../types/index.js";

export function createSearchCommand(): Command {
  const cmd = new Command("search")
    .description("Search Austrian RIS for judgments")
    .argument("[query]", "Search query")
    .option("-l, --limit <number>", "Maximum results", "20")
    .option("-o, --offset <number>", "Results offset", "0")
    .option("--from-date <date>", "Filter from date (YYYY-MM-DD)")
    .option("--to-date <date>", "Filter to date (YYYY-MM-DD)")
    .option(
      "--court <court>",
      "Filter by court, e.g. OGH, OLG Wien, LG Salzburg",
    )
    .option(
      "--with-summary",
      "Fetch full texts and generate summaries for search results",
    )
    .option("--json", "Output as JSON")
    .option("--local", "Search local Obsidian files instead of RIS")
    .action(async (query, options) => {
      await executeSearch(query, options);
    });

  return cmd;
}

async function executeSearch(query: string, options: any): Promise<void> {
  const outputFormat = parseOutputFormat(options.json);

  if (options.local) {
    if (!query) {
      console.error("❌ Local search requires a query.");
      return;
    }

    await searchLocal(query, outputFormat);
    return;
  }

  if (!query) {
    // Default queries for cyberbullying/hate speech
    query = "Cybermobbing OR Hassposting";
  }

  const searchOptions: SearchOptions = {
    limit: parseInt(options.limit, 10),
    offset: parseInt(options.offset, 10),
    fromDate: options.fromDate,
    toDate: options.toDate,
    gericht: options.court,
    output: outputFormat,
  };

  const adapter = getRISAdapter();
  const results = await adapter.search(query, searchOptions);
  const enrichedResults = options.withSummary
    ? await addSummaries(results, adapter)
    : results;

  if (outputFormat === "json") {
    console.log(
      formatOutput(
        {
          query,
          count: enrichedResults.length,
          results: enrichedResults,
        },
        "json",
      ),
    );
  } else {
    console.log(`\n🔍 Search results for: "${query}"\n`);

    if (enrichedResults.length === 0) {
      console.log("No results found.\n");
      return;
    }

    enrichedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   Court: ${result.court} | Date: ${result.date}`);
      console.log(`   URL: ${result.url}`);
      if (result.gz) console.log(`   GZ: ${result.gz}`);
      if (result.snippet)
        console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
      if (result.summary) {
        const compactSummary = result.summary.replace(/\s+/g, " ").trim();
        console.log(`   Summary: ${compactSummary}`);
      }
      console.log("");
    });
  }
}

async function addSummaries(
  results: SearchResult[],
  adapter: ReturnType<typeof getRISAdapter>,
): Promise<SearchResult[]> {
  const enriched: SearchResult[] = [];

  for (const result of results) {
    try {
      const detail = await adapter.fetchDetail(result);
      if (!detail) {
        enriched.push(result);
        continue;
      }

      const summaryResult = await generateSummary(detail);
      enriched.push({
        ...result,
        summary: summaryResult.summary,
        summaryMethod: summaryResult.method,
      });
    } catch (error) {
      console.warn(`Failed to generate summary for ${result.url}:`, error);
      enriched.push(result);
    }
  }

  return enriched;
}

/**
 * Search local Obsidian files using ripgrep
 */
async function searchLocal(
  query: string,
  outputFormat: "json" | "text",
): Promise<void> {
  const vaultPath = requireObsidianVaultPath();
  const dataFolder = getDataFolder();
  const searchPath = path.join(vaultPath, dataFolder, "urteile");

  try {
    // Use ripgrep to search markdown files
    const grepCmd = `grep -r -l "${query.replace(/"/g, '\\"')}" "${searchPath}"/*.mdx 2>/dev/null || echo ""`;
    const files = execSync(grepCmd, { encoding: "utf-8" }).trim();

    if (!files) {
      console.log("No local results found.\n");
      return;
    }

    const fileList = files.split("\n").filter((f) => f);
    const results = fileList.map((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = (
        frontmatterMatch ? yaml.load(frontmatterMatch[1]) : {}
      ) as Record<string, any>;

      // Get title from frontmatter or filename
      const title =
        typeof frontmatter.title === "string"
          ? frontmatter.title
          : path.basename(filePath);

      return {
        title,
        court:
          typeof frontmatter.court === "string" ? frontmatter.court : "Unknown",
        date:
          typeof frontmatter.date === "string" ? frontmatter.date : "Unknown",
        gz: typeof frontmatter.gz === "string" ? frontmatter.gz : null,
        url: typeof frontmatter.url === "string" ? frontmatter.url : null,
        query,
        filePath,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      };
    });

    if (outputFormat === "json") {
      console.log(
        JSON.stringify(
          {
            query,
            count: results.length,
            results,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(`\n📚 Local search results for: "${query}"\n`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Court: ${result.court} | Date: ${result.date}`);
        console.log(`   File: ${result.filePath}`);
        if (result.tags?.length)
          console.log(`   Tags: ${result.tags.join(", ")}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Local search failed:", error);
    console.log("No local results found.\n");
  }
}
