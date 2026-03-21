/// <reference types="vitest" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSummary } from "../lib/summary.js";
import type { JudgmentDetail } from "../types/index.js";

const ENV_KEYS = [
  "RIS_CLI_CONFIG",
  "RIS_CLI_SUMMARY_PROVIDER",
  "RIS_CLI_SUMMARY_MODEL",
  "RIS_CLI_SUMMARY_BASE_URL",
  "RIS_CLI_SUMMARY_API_KEY",
  "RIS_CLI_OPENAI_API_KEY",
  "OPENAI_API_KEY",
] as const;

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const ORIGINAL_FETCH = global.fetch;

const judgment: JudgmentDetail = {
  id: "doc-1",
  title: "6Bs275/25d",
  court: "OLG Innsbruck",
  date: "2026-02-04",
  gz: "6Bs275/25d",
  url: "https://example.test/judgment",
  fullText:
    "Erster Satz. Zweiter Satz. Dritter Satz. Vierter Satz. Fünfter Satz. Sechster Satz.",
  metadata: {
    court: "OLG Innsbruck",
    date: "2026-02-04",
    gz: "6Bs275/25d",
  },
};

function resetEnv(): void {
  process.env.RIS_CLI_CONFIG = `/tmp/ris-cli-summary-${Date.now()}-${Math.random()}.json`;
  delete process.env.RIS_CLI_SUMMARY_PROVIDER;
  delete process.env.RIS_CLI_SUMMARY_MODEL;
  delete process.env.RIS_CLI_SUMMARY_BASE_URL;
  delete process.env.RIS_CLI_SUMMARY_API_KEY;
  delete process.env.RIS_CLI_OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  global.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("generateSummary", () => {
  it("returns extractive summaries by default", async () => {
    resetEnv();

    const result = await generateSummary(judgment);

    expect(result.method).toBe("extractive");
    expect(result.summary).toContain("Gericht: OLG Innsbruck");
    expect(result.summary).toContain("Erster Satz");
    expect(result.summary).toContain("Fünfter Satz");
  });

  it("uses the Ollama provider when configured", async () => {
    resetEnv();
    process.env.RIS_CLI_SUMMARY_PROVIDER = "ollama";
    process.env.RIS_CLI_SUMMARY_MODEL = "llama3.1:8b";
    process.env.RIS_CLI_SUMMARY_BASE_URL = "http://127.0.0.1:11434";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { content: "Kurze Zusammenfassung aus Ollama." },
      }),
    });
    global.fetch = fetchMock as typeof global.fetch;

    const result = await generateSummary(judgment);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/chat",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      summary: "Kurze Zusammenfassung aus Ollama.",
      method: "generated",
    });
  });

  it("falls back to extractive summary when a provider fails", async () => {
    resetEnv();
    process.env.RIS_CLI_SUMMARY_PROVIDER = "ollama";
    process.env.RIS_CLI_SUMMARY_BASE_URL = "http://127.0.0.1:11434";
    vi.spyOn(console, "warn").mockImplementation(() => {});

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "boom",
    }) as typeof global.fetch;

    const result = await generateSummary(judgment);

    expect(result.method).toBe("extractive");
    expect(result.summary).toContain("Aktenzeichen: 6Bs275/25d");
  });
});
