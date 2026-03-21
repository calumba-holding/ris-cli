// Summary generator using configured providers or extractive fallback

import { getSummaryConfig } from "./config.js";
import type { JudgmentDetail, SummaryProvider } from "../types/index.js";

export interface SummaryResult {
  summary: string;
  method: "generated" | "extractive" | "none";
}

const SUMMARY_SYSTEM_PROMPT =
  "Du bist ein juristischer Assistent, der österreichische Gerichtsurteile analysiert und prägnant auf Deutsch zusammenfasst.";

/**
 * Generate a summary for a judgment
 */
export async function generateSummary(
  judgment: JudgmentDetail,
  options: { preferExtractive?: boolean } = {},
): Promise<SummaryResult> {
  if (options.preferExtractive) {
    return generateExtractiveSummary(judgment);
  }

  const config = getSummaryConfig();
  if (config.provider === "extractive") {
    return generateExtractiveSummary(judgment);
  }

  try {
    switch (config.provider) {
      case "ollama":
        return await generateOllamaSummary(judgment, config);
      case "openai-compatible":
      case "vllm":
      case "mlx-lm":
        return await generateOpenAICompatibleSummary(judgment, config);
      default:
        return generateExtractiveSummary(judgment);
    }
  } catch (error) {
    console.warn(
      `Summary generation via ${config.provider} failed, falling back to extractive summary:`,
      error,
    );
    return generateExtractiveSummary(judgment);
  }
}

async function generateOpenAICompatibleSummary(
  judgment: JudgmentDetail,
  config: ReturnType<typeof getSummaryConfig>,
): Promise<SummaryResult> {
  const OpenAI = (await import("openai")).default;

  const client = new OpenAI({
    apiKey: config.apiKey || "not-needed",
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

  const response = await client.chat.completions.create({
    model: resolveModelName(config.provider, config.model, config.baseUrl),
    messages: [
      {
        role: "system",
        content: SUMMARY_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildSummaryPrompt(judgment),
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const summary = response.choices[0]?.message?.content?.trim() || "";
  if (!summary) {
    return generateExtractiveSummary(judgment);
  }

  return {
    summary,
    method: "generated",
  };
}

async function generateOllamaSummary(
  judgment: JudgmentDetail,
  config: ReturnType<typeof getSummaryConfig>,
): Promise<SummaryResult> {
  const model = config.model ?? "llama3.1:8b";
  const baseUrl = (config.baseUrl ?? "http://127.0.0.1:11434").replace(
    /\/$/,
    "",
  );

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryPrompt(judgment) },
      ],
      options: {
        temperature: 0.3,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { message?: { content?: string } };
  const summary = json.message?.content?.trim() || "";
  if (!summary) {
    return generateExtractiveSummary(judgment);
  }

  return {
    summary,
    method: "generated",
  };
}

function resolveModelName(
  provider: SummaryProvider,
  configuredModel: string | undefined,
  baseUrl: string | undefined,
): string {
  if (configuredModel) return configuredModel;

  if (provider === "openai-compatible" && baseUrl?.includes("api.openai.com")) {
    return "gpt-4o";
  }

  return "local-model";
}

function buildSummaryPrompt(judgment: JudgmentDetail): string {
  return `Analysiere das folgende österreichische Gerichtsurteil und erstelle eine prägnante Zusammenfassung auf Deutsch:

Titel: ${judgment.title}
Gericht: ${judgment.court}
Datum: ${judgment.date}
Aktenzeichen: ${judgment.gz || "N/A"}

Volltext:
${judgment.fullText.substring(0, 8000)}

Bitte fasse das Urteil in 3-5 Sätzen zusammen. Gehe dabei auf Sachverhalt, Entscheidung und rechtlich relevante Aspekte ein.`;
}

/**
 * Generate an extractive summary (first N sentences)
 */
function generateExtractiveSummary(judgment: JudgmentDetail): SummaryResult {
  const fullText = judgment.fullText || "";

  if (!fullText) {
    return {
      summary: "Kein Volltext verfügbar für Zusammenfassung.",
      method: "none",
    };
  }

  const sentences = fullText
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10);

  const summarySentences = sentences.slice(0, 5);
  const content = summarySentences.join(". ");
  const summary = [
    `Gericht: ${judgment.court}`,
    `Datum: ${judgment.date}`,
    `Aktenzeichen: ${judgment.gz || "N/A"}`,
    content ? `\n${content}${content.endsWith(".") ? "" : "."}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary,
    method: "extractive",
  };
}

export function isGeneratedSummaryConfigured(): boolean {
  return getSummaryConfig().provider !== "extractive";
}
