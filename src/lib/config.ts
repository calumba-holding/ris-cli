// Config loader (env + optional config file)

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { SummaryProvider, TelegramConfig } from "../types/index.js";

export interface LoadedConfig {
  obsidianVaultPath?: string;
  dataFolder?: string;
  summaryProvider?: SummaryProvider;
  summaryModel?: string;
  summaryBaseUrl?: string;
  summaryApiKey?: string;
  openaiApiKey?: string;
  telegram?: TelegramConfig;
}

export interface SummaryRuntimeConfig {
  provider: SummaryProvider;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

export const DEFAULT_DATA_FOLDER = "ris-cli";

function parseIntSafe(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = readString(process.env[name]);
    if (value) return value;
  }
  return undefined;
}

function getLegacyConfigPaths(): string[] {
  return [
    path.join(os.homedir(), ".config", "urteil-watch", "config.json"),
    path.join(os.homedir(), ".config", "urteil-watchdog", "config.json"),
  ];
}

export function getPrimaryConfigPath(): string {
  return (
    readEnv("RIS_CLI_CONFIG", "URTEIL_WATCH_CONFIG") ??
    path.join(os.homedir(), ".config", "ris-cli", "config.json")
  );
}

function getConfigPaths(): string[] {
  const explicitPath = readEnv("RIS_CLI_CONFIG", "URTEIL_WATCH_CONFIG");
  if (explicitPath) return [explicitPath];

  return [getPrimaryConfigPath(), ...getLegacyConfigPaths()];
}

export function loadConfig(): LoadedConfig | null {
  for (const configPath of getConfigPaths()) {
    if (!fs.existsSync(configPath)) continue;

    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw) as LoadedConfig;
    } catch {
      // Don't hard-fail the whole CLI because someone typoed JSON.
      return null;
    }
  }

  return null;
}

export function getObsidianVaultPath(): string | undefined {
  const cfgFile = loadConfig();
  return (
    readEnv(
      "RIS_CLI_OBSIDIAN_VAULT_PATH",
      "URTEIL_WATCH_OBSIDIAN_VAULT_PATH",
    ) ?? readString(cfgFile?.obsidianVaultPath)
  );
}

export function requireObsidianVaultPath(): string {
  const vaultPath = getObsidianVaultPath();

  if (!vaultPath) {
    throw new Error(
      'Obsidian vault path is not configured. Set RIS_CLI_OBSIDIAN_VAULT_PATH or add "obsidianVaultPath" to ~/.config/ris-cli/config.json.',
    );
  }

  return vaultPath;
}

export function getDataFolder(): string {
  const cfgFile = loadConfig();
  return (
    readEnv("RIS_CLI_DATA_FOLDER", "URTEIL_WATCH_DATA_FOLDER") ??
    readString(cfgFile?.dataFolder) ??
    DEFAULT_DATA_FOLDER
  );
}

export function normalizeSummaryProvider(
  value: string | undefined,
): SummaryProvider | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "extractive":
      return "extractive";
    case "openai":
    case "openai-compatible":
      return "openai-compatible";
    case "ollama":
      return "ollama";
    case "vllm":
      return "vllm";
    case "mlx":
    case "mlx-lm":
      return "mlx-lm";
    default:
      return undefined;
  }
}

export function getSummaryProvider(): SummaryProvider {
  const cfgFile = loadConfig();

  const explicitProvider = normalizeSummaryProvider(
    readEnv("RIS_CLI_SUMMARY_PROVIDER", "URTEIL_WATCH_SUMMARY_PROVIDER") ??
      cfgFile?.summaryProvider,
  );
  if (explicitProvider) return explicitProvider;

  if (getSummaryApiKey()) return "openai-compatible";
  if (
    readEnv("RIS_CLI_SUMMARY_BASE_URL", "URTEIL_WATCH_SUMMARY_BASE_URL") ??
    readString(cfgFile?.summaryBaseUrl)
  ) {
    return "openai-compatible";
  }

  return "extractive";
}

export function getSummaryModel(): string | undefined {
  const cfgFile = loadConfig();
  const explicitModel =
    readEnv("RIS_CLI_SUMMARY_MODEL", "URTEIL_WATCH_SUMMARY_MODEL") ??
    readString(cfgFile?.summaryModel);
  if (explicitModel) return explicitModel;

  const provider = getSummaryProvider();
  if (
    provider === "openai-compatible" &&
    getSummaryBaseUrl()?.includes("api.openai.com")
  ) {
    return "gpt-4o";
  }

  return undefined;
}

export function getSummaryBaseUrl(): string | undefined {
  const cfgFile = loadConfig();
  const explicitBaseUrl =
    readEnv("RIS_CLI_SUMMARY_BASE_URL", "URTEIL_WATCH_SUMMARY_BASE_URL") ??
    readString(cfgFile?.summaryBaseUrl);
  if (explicitBaseUrl) return explicitBaseUrl;

  switch (getSummaryProvider()) {
    case "ollama":
      return "http://127.0.0.1:11434";
    case "vllm":
      return "http://127.0.0.1:8000/v1";
    case "mlx-lm":
      return "http://127.0.0.1:8080/v1";
    case "openai-compatible":
      return "https://api.openai.com/v1";
    default:
      return undefined;
  }
}

export function getSummaryApiKey(): string | undefined {
  const cfgFile = loadConfig();
  return (
    readEnv(
      "RIS_CLI_SUMMARY_API_KEY",
      "RIS_CLI_OPENAI_API_KEY",
      "URTEIL_WATCH_SUMMARY_API_KEY",
      "URTEIL_WATCH_OPENAI_API_KEY",
      "OPENAI_API_KEY",
    ) ??
    readString(cfgFile?.summaryApiKey) ??
    readString(cfgFile?.openaiApiKey)
  );
}

export function getSummaryConfig(): SummaryRuntimeConfig {
  return {
    provider: getSummaryProvider(),
    model: getSummaryModel(),
    baseUrl: getSummaryBaseUrl(),
    apiKey: getSummaryApiKey(),
  };
}

/**
 * Resolve Telegram config from env or config file.
 *
 * Env vars take precedence:
 * - RIS_CLI_TELEGRAM_BOT_TOKEN
 * - RIS_CLI_TELEGRAM_CHAT_ID
 * - RIS_CLI_TELEGRAM_TOPIC_ID
 */
export function getTelegramConfig(): TelegramConfig | undefined {
  const cfgFile = loadConfig();

  const botToken =
    readEnv("RIS_CLI_TELEGRAM_BOT_TOKEN", "URTEIL_WATCH_TELEGRAM_BOT_TOKEN") ||
    cfgFile?.telegram?.botToken;
  const chatId =
    readEnv("RIS_CLI_TELEGRAM_CHAT_ID", "URTEIL_WATCH_TELEGRAM_CHAT_ID") ||
    cfgFile?.telegram?.chatId;
  const topicId =
    parseIntSafe(process.env.RIS_CLI_TELEGRAM_TOPIC_ID) ??
    parseIntSafe(process.env.URTEIL_WATCH_TELEGRAM_TOPIC_ID) ??
    cfgFile?.telegram?.topicId;

  if (!botToken || !chatId) return undefined;

  return {
    botToken,
    chatId,
    topicId,
  };
}
