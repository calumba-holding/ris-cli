// Obsidian integration - Save judgments to vault

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Database from 'better-sqlite3';
import type { Judgment, ProcessedJudgment } from '../types/index.js';

export const OBSIDIAN_VAULT_PATH = '/Users/lana/syncthing/obsidian/semir';
export const RIS_WATCHDOG_FOLDER = '03_Resources/ris-watchdog';
export const URTEILE_FOLDER = 'urteile';
export const DB_FILENAME = 'state.sqlite';

export class ObsidianAdapter {
  private vaultPath: string;
  private dataPath: string;
  private db: Database.Database;

  constructor(vaultPath: string = OBSIDIAN_VAULT_PATH) {
    this.vaultPath = vaultPath;
    this.dataPath = path.join(vaultPath, RIS_WATCHDOG_FOLDER);
    this.db = this.initDatabase();
    this.ensureFolders();
  }

  /**
   * Initialize SQLite database for tracking processed judgments
   */
  private initDatabase(): Database.Database {
    const dbPath = path.join(this.dataPath, DB_FILENAME);
    const db = new Database(dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS processed_judgments (
        id TEXT PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        query TEXT NOT NULL,
        file_path TEXT NOT NULL,
        processed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_processed_url ON processed_judgments(url);
      CREATE INDEX IF NOT EXISTS idx_processed_query ON processed_judgments(query);
    `);

    return db;
  }

  /**
   * Ensure required folders exist
   */
  private ensureFolders(): void {
    const folders = [
      this.dataPath,
      path.join(this.dataPath, URTEILE_FOLDER),
    ];

    for (const folder of folders) {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
    }
  }

  /**
   * Check if a judgment has already been processed
   */
  isProcessed(id: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM processed_judgments WHERE id = ?');
    return stmt.get(id) !== undefined;
  }

  /**
   * Mark a judgment as processed
   */
  markProcessed(judgment: Judgment, filePath: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO processed_judgments (id, url, query, file_path, processed_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      judgment.id,
      judgment.url,
      judgment.query,
      filePath,
      judgment.retrievedAt
    );
  }

  /**
   * Get all processed judgment IDs
   */
  getProcessedIds(): string[] {
    const stmt = this.db.prepare('SELECT id FROM processed_judgments');
    return stmt.all().map((row: any) => row.id);
  }

  /**
   * Save a judgment to a markdown file
   */
  saveJudgment(judgment: Judgment, summary?: string): string {
    const filename = this.generateFilename(judgment);
    const filePath = path.join(this.dataPath, URTEILE_FOLDER, filename);

    const frontmatter = {
      title: judgment.title,
      court: judgment.court,
      date: judgment.date,
      gz: judgment.gz || null,
      url: judgment.url,
      query: judgment.query,
      tags: judgment.tags || ['ris-watchdog', 'judgment'],
      retrieved_at: judgment.retrievedAt,
    };

    const content = this.formatMarkdown(frontmatter, judgment.fullText || '', summary);

    fs.writeFileSync(filePath, content, 'utf-8');
    this.markProcessed(judgment, filePath);

    return filePath;
  }

  /**
   * Generate a safe filename from judgment
   */
  private generateFilename(judgment: Judgment): string {
    const date = judgment.date.replace(/-/g, '');
    const safeTitle = judgment.title
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    return `urteile_${date}_${judgment.court}_${safeTitle}.mdx`;
  }

  /**
   * Format judgment as markdown with YAML frontmatter
   */
  private formatMarkdown(frontmatter: Record<string, any>, fullText: string, summary?: string): string {
    const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
    
    let content = `---\n${yamlStr}---\n\n`;
    content += `# ${frontmatter.title}\n\n`;
    
    if (summary) {
      content += `## Zusammenfassung (AI-generiert)\n\n${summary}\n\n`;
    } else {
      content += `## Zusammenfassung\n\n*Keine KI-Zusammenfassung verfügbar.*\n\n`;
    }
    
    content += `## Volltext\n\n${fullText}\n\n`;
    content += `---\n*Abgerufen am: ${frontmatter.retrieved_at}*\n`;
    content += `*Suchbegriff: ${frontmatter.query}*\n`;

    return content;
  }

  /**
   * Get recent judgments (for notification)
   */
  getRecentJudgments(hours: number = 24): ProcessedJudgment[] {
    const stmt = this.db.prepare(`
      SELECT * FROM processed_judgments
      WHERE processed_at > datetime('now', ?)
      ORDER BY processed_at DESC
    `);
    
    const result = stmt.all(`-${hours} hours`);
    return result as ProcessedJudgment[];
  }

  /**
   * Get judgment by ID
   */
  getJudgmentById(id: string): ProcessedJudgment | undefined {
    const stmt = this.db.prepare('SELECT * FROM processed_judgments WHERE id = ?');
    return stmt.get(id) as ProcessedJudgment | undefined;
  }

  /**
   * Get total processed count
   */
  getProcessedCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM processed_judgments');
    return (stmt.get() as any).count;
  }

  /**
   * Get data path for external access
   */
  getDataPath(): string {
    return this.dataPath;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Singleton instance
let adapterInstance: ObsidianAdapter | null = null;

export function getObsidianAdapter(): ObsidianAdapter {
  if (!adapterInstance) {
    adapterInstance = new ObsidianAdapter();
  }
  return adapterInstance;
}
