// Types for urteil-watch CLI

export interface Judgment {
  id: string;
  title: string;
  court: string;
  date: string;
  gz?: string; // Geschäftszahl (case number)
  url: string;
  query: string;
  fullText?: string;
  summary?: string;
  retrievedAt: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  court: string;
  date: string;
  gz?: string;
  url: string;
  snippet?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  fromDate?: string;
  toDate?: string;
  output?: 'json' | 'text';
  gericht?: 'OGH' | 'OLG' | 'LG' | 'All';
}

export interface JudgmentDetail extends SearchResult {
  metadata: {
    court: string;
    date: string;
    gz?: string;
    decision?: string;
   ogiNumber?: string;
    legalBase?: string[];
  };
  fullText: string;
}

export interface SyncOptions {
  queries?: string[];
  dryRun?: boolean;
  force?: boolean;
  output?: 'json' | 'text';
}

export interface NotifyOptions {
  silent?: boolean;
  output?: 'json' | 'text';
}

export interface Config {
  obsidianVaultPath: string;
  dataFolder: string;
  defaultQueries: string[];
  openaiApiKey?: string;
  sqlitePath: string;
}

export interface ProcessedJudgment {
  id: string;
  url: string;
  query: string;
  processedAt: string;
  filePath: string;
}

export interface State {
  lastSync: string;
  lastNotify: string;
  processedCount: number;
}
