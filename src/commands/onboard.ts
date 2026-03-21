// Onboard command - Collect config and write runtime config

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  DEFAULT_DATA_FOLDER,
  getPrimaryConfigPath,
  loadConfig,
  normalizeSummaryProvider,
  type LoadedConfig,
} from "../lib/config.js";
import type { SummaryProvider } from "../types/index.js";

interface OnboardOptions {
  vaultPath?: string;
  dataFolder?: string;
  summaryProvider?: string;
  summaryModel?: string;
  summaryBaseUrl?: string;
  summaryApiKey?: string;
  openaiApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramTopicId?: string;
  json?: boolean;
}

export function createOnboardCommand(): Command {
  return new Command("onboard")
    .description("Create runtime config for ris-cli")
    .option("--vault-path <path>", "Path to your Obsidian vault")
    .option("--data-folder <path>", "Folder inside the vault for synced data")
    .option(
      "--summary-provider <provider>",
      "Summary provider: extractive, openai-compatible, ollama, vllm, mlx-lm",
    )
    .option("--summary-model <model>", "Summary model name")
    .option("--summary-base-url <url>", "Summary provider base URL")
    .option("--summary-api-key <key>", "Optional summary provider API key")
    .option(
      "--openai-api-key <key>",
      "Backward-compatible alias for --summary-api-key",
    )
    .option(
      "--telegram-bot-token <token>",
      "Optional Telegram bot token for notifications",
    )
    .option(
      "--telegram-chat-id <id>",
      "Optional Telegram chat ID for notifications",
    )
    .option(
      "--telegram-topic-id <id>",
      "Optional Telegram topic/thread ID for notifications",
    )
    .option("--json", "Output the onboarding result as JSON")
    .action(async (options: OnboardOptions) => {
      await executeOnboard(options);
    });
}

async function executeOnboard(options: OnboardOptions): Promise<void> {
  const existingConfig = loadConfig() ?? {};
  const configPath = getPrimaryConfigPath();

  const vaultPath = await resolveRequiredValue({
    label: "Obsidian vault path",
    provided: options.vaultPath,
    fallback: existingConfig.obsidianVaultPath,
  });

  const dataFolder = await resolveOptionalValue({
    label: "Data folder inside the vault",
    provided: options.dataFolder,
    fallback: existingConfig.dataFolder ?? DEFAULT_DATA_FOLDER,
  });

  const summaryProvider = await resolveSummaryProvider(
    options.summaryProvider,
    existingConfig,
  );
  const summaryModel = await resolveOptionalValue({
    label: "Summary model (optional)",
    provided: options.summaryModel,
    fallback:
      existingConfig.summaryModel ??
      getDefaultSummaryModel(summaryProvider, existingConfig),
  });

  const summaryBaseUrl =
    summaryProvider === "extractive"
      ? undefined
      : await resolveOptionalValue({
          label: "Summary base URL (optional)",
          provided: options.summaryBaseUrl,
          fallback:
            existingConfig.summaryBaseUrl ??
            getDefaultSummaryBaseUrl(summaryProvider),
        });

  const summaryApiKey =
    summaryProvider === "extractive" || summaryProvider === "ollama"
      ? undefined
      : await resolveOptionalValue({
          label: "Summary API key (optional)",
          provided: options.summaryApiKey ?? options.openaiApiKey,
          fallback: existingConfig.summaryApiKey ?? existingConfig.openaiApiKey,
          maskValue: true,
        });

  const existingTelegram = existingConfig.telegram;
  const telegramBotToken = await resolveOptionalValue({
    label: "Telegram bot token (optional)",
    provided: options.telegramBotToken,
    fallback: existingTelegram?.botToken,
    maskValue: true,
  });

  const telegramChatId = await resolveOptionalValue({
    label: "Telegram chat ID (optional)",
    provided: options.telegramChatId,
    fallback: existingTelegram?.chatId,
  });

  const telegramTopicIdRaw = await resolveOptionalValue({
    label: "Telegram topic/thread ID (optional)",
    provided: options.telegramTopicId,
    fallback:
      existingTelegram?.topicId !== undefined
        ? String(existingTelegram.topicId)
        : undefined,
  });

  if (
    (telegramBotToken && !telegramChatId) ||
    (!telegramBotToken && telegramChatId)
  ) {
    throw new Error(
      "Telegram configuration requires both bot token and chat ID.",
    );
  }

  const telegramTopicId = telegramTopicIdRaw
    ? parseInt(telegramTopicIdRaw, 10)
    : undefined;
  if (telegramTopicIdRaw && Number.isNaN(telegramTopicId)) {
    throw new Error("Telegram topic/thread ID must be a number.");
  }

  const nextConfig: LoadedConfig = {
    obsidianVaultPath: vaultPath,
    dataFolder,
    summaryProvider,
  };

  if (summaryModel) nextConfig.summaryModel = summaryModel;
  if (summaryBaseUrl) nextConfig.summaryBaseUrl = summaryBaseUrl;
  if (summaryApiKey) nextConfig.summaryApiKey = summaryApiKey;

  if (telegramBotToken && telegramChatId) {
    nextConfig.telegram = {
      botToken: telegramBotToken,
      chatId: telegramChatId,
      ...(telegramTopicId !== undefined ? { topicId: telegramTopicId } : {}),
    };
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    `${JSON.stringify(nextConfig, null, 2)}\n`,
    "utf-8",
  );

  const result = {
    configPath,
    vaultPath,
    dataFolder,
    summaryProvider,
    summaryModel: summaryModel ?? null,
    summaryBaseUrl: summaryBaseUrl ?? null,
    summaryApiKeyConfigured: Boolean(summaryApiKey),
    summaryApiKeyMasked: summaryApiKey ? maskSecret(summaryApiKey) : null,
    telegramConfigured: Boolean(telegramBotToken && telegramChatId),
    telegramChatId: telegramChatId ?? null,
    telegramTopicId: telegramTopicId ?? null,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`✅ Wrote config: ${configPath}`);
  console.log(`📁 Vault: ${vaultPath}`);
  console.log(`🗂️ Data folder: ${dataFolder}`);
  console.log(`🧠 Summary provider: ${summaryProvider}`);
  console.log(`🧩 Summary model: ${summaryModel ?? "not configured"}`);
  console.log(`🌐 Summary base URL: ${summaryBaseUrl ?? "not configured"}`);
  console.log(
    `🔑 Summary API key: ${summaryApiKey ? maskSecret(summaryApiKey) : "not configured"}`,
  );
  console.log(`📣 Telegram: ${telegramChatId ?? "not configured"}`);
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

async function resolveSummaryProvider(
  provided: string | undefined,
  existingConfig: LoadedConfig,
): Promise<SummaryProvider> {
  const fallback =
    existingConfig.summaryProvider ??
    (existingConfig.summaryApiKey || existingConfig.openaiApiKey
      ? "openai-compatible"
      : "extractive");

  const immediate = normalizeSummaryProvider(normalize(provided) ?? fallback);
  if (immediate) return immediate;

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return "extractive";
  }

  while (true) {
    const answer = await resolveOptionalValue({
      label:
        "Summary provider (extractive, openai-compatible, ollama, vllm, mlx-lm)",
      fallback,
    });
    const provider = normalizeSummaryProvider(answer);
    if (provider) return provider;
  }
}

function getDefaultSummaryModel(
  provider: SummaryProvider,
  existingConfig: LoadedConfig,
): string | undefined {
  if (existingConfig.openaiApiKey && provider === "openai-compatible")
    return "gpt-4o";
  switch (provider) {
    case "ollama":
      return "llama3.1:8b";
    case "vllm":
    case "mlx-lm":
      return "local-model";
    case "openai-compatible":
      return undefined;
    default:
      return undefined;
  }
}

function getDefaultSummaryBaseUrl(
  provider: SummaryProvider,
): string | undefined {
  switch (provider) {
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

async function resolveRequiredValue(input: {
  label: string;
  provided?: string;
  fallback?: string;
}): Promise<string> {
  const immediate = normalize(input.provided) ?? normalize(input.fallback);
  if (immediate) return immediate;

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(`${input.label} is required.`);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (true) {
      const answer = normalize(await rl.question(`${input.label}: `));
      if (answer) return answer;
    }
  } finally {
    rl.close();
  }
}

async function resolveOptionalValue(input: {
  label: string;
  provided?: string;
  fallback?: string;
  maskValue?: boolean;
}): Promise<string | undefined> {
  const immediate = normalize(input.provided);
  if (immediate !== undefined) return immediate;

  const fallback = normalize(input.fallback);
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return fallback;
  }

  const displayDefault = fallback
    ? input.maskValue
      ? maskSecret(fallback)
      : fallback
    : undefined;

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const prompt = displayDefault
      ? `${input.label} [${displayDefault}]: `
      : `${input.label}: `;
    const answer = normalize(await rl.question(prompt));
    return answer ?? fallback;
  } finally {
    rl.close();
  }
}

function normalize(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
