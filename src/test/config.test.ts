/// <reference types="vitest" />

import { afterEach, describe, expect, it } from "vitest";
import { getSummaryConfig, normalizeSummaryProvider } from "../lib/config.js";

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

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

function isolateConfig(): void {
  process.env.RIS_CLI_CONFIG = `/tmp/ris-cli-test-${Date.now()}-${Math.random()}.json`;
  delete process.env.RIS_CLI_SUMMARY_PROVIDER;
  delete process.env.RIS_CLI_SUMMARY_MODEL;
  delete process.env.RIS_CLI_SUMMARY_BASE_URL;
  delete process.env.RIS_CLI_SUMMARY_API_KEY;
  delete process.env.RIS_CLI_OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
}

describe("summary config", () => {
  it("normalizes provider aliases", () => {
    expect(normalizeSummaryProvider("openai")).toBe("openai-compatible");
    expect(normalizeSummaryProvider("mlx")).toBe("mlx-lm");
    expect(normalizeSummaryProvider("ollama")).toBe("ollama");
  });

  it("defaults to extractive without summary configuration", () => {
    isolateConfig();

    expect(getSummaryConfig()).toEqual({
      provider: "extractive",
      model: undefined,
      baseUrl: undefined,
      apiKey: undefined,
    });
  });

  it("uses provider defaults for ollama", () => {
    isolateConfig();
    process.env.RIS_CLI_SUMMARY_PROVIDER = "ollama";

    expect(getSummaryConfig()).toEqual({
      provider: "ollama",
      model: undefined,
      baseUrl: "http://127.0.0.1:11434",
      apiKey: undefined,
    });
  });

  it("maps legacy OpenAI env vars to openai-compatible config", () => {
    isolateConfig();
    process.env.OPENAI_API_KEY = "sk-test";

    expect(getSummaryConfig()).toEqual({
      provider: "openai-compatible",
      model: "gpt-4o",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test",
    });
  });

  it("uses mlx-lm default local server URL", () => {
    isolateConfig();
    process.env.RIS_CLI_SUMMARY_PROVIDER = "mlx-lm";
    process.env.RIS_CLI_SUMMARY_MODEL =
      "mlx-community/Llama-3.2-3B-Instruct-4bit";

    expect(getSummaryConfig()).toEqual({
      provider: "mlx-lm",
      model: "mlx-community/Llama-3.2-3B-Instruct-4bit",
      baseUrl: "http://127.0.0.1:8080/v1",
      apiKey: undefined,
    });
  });
});
