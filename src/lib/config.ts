// Config loader (env + optional config file)

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { TelegramConfig } from '../types/index.js';

export interface LoadedConfig {
  telegram?: TelegramConfig;
}

function parseIntSafe(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

function loadConfigFile(): LoadedConfig | null {
  const explicitPath = process.env.URTEIL_WATCH_CONFIG;
  const defaultPath = path.join(os.homedir(), '.config', 'urteil-watchdog', 'config.json');
  const configPath = explicitPath || defaultPath;

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as LoadedConfig;
  } catch {
    // Don't hard-fail the whole CLI because someone typoed JSON.
    return null;
  }
}

/**
 * Resolve Telegram config from env or config file.
 *
 * Env vars take precedence:
 * - URTEIL_WATCH_TELEGRAM_BOT_TOKEN
 * - URTEIL_WATCH_TELEGRAM_CHAT_ID
 * - URTEIL_WATCH_TELEGRAM_TOPIC_ID
 */
export function getTelegramConfig(): TelegramConfig | undefined {
  const cfgFile = loadConfigFile();

  const botToken = process.env.URTEIL_WATCH_TELEGRAM_BOT_TOKEN || cfgFile?.telegram?.botToken;
  const chatId = process.env.URTEIL_WATCH_TELEGRAM_CHAT_ID || cfgFile?.telegram?.chatId;
  const topicId = parseIntSafe(process.env.URTEIL_WATCH_TELEGRAM_TOPIC_ID) ?? cfgFile?.telegram?.topicId;

  if (!botToken || !chatId) return undefined;

  return {
    botToken,
    chatId,
    topicId,
  };
}
