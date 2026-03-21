/// <reference types="vitest" />

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { ObsidianAdapter } from "../adapters/obsidian.js";
import type { Judgment } from "../types/index.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ris-cli-obsidian-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("ObsidianAdapter", () => {
  it("persists judgments and marks them as processed", () => {
    const vaultPath = makeTempDir();
    const adapter = new ObsidianAdapter(vaultPath, "data");

    const judgment: Judgment = {
      id: "JJT_20260204_TEST",
      title: "6Bs275/25d",
      court: "OLG Innsbruck",
      date: "2026-02-04",
      gz: "6Bs275/25d",
      url: "https://example.test/judgment",
      query: "Beleidigung",
      fullText: "Volltext des Urteils.",
      summary: "Kurze Zusammenfassung.",
      retrievedAt: "2026-03-21T12:00:00.000Z",
      tags: ["ris-cli"],
    };

    const filePath = adapter.saveJudgment(judgment, judgment.summary);
    const content = fs.readFileSync(filePath, "utf-8");

    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("## Zusammenfassung");
    expect(content).toContain("Kurze Zusammenfassung.");
    expect(adapter.isProcessed(judgment.id)).toBe(true);
    expect(adapter.getProcessedCount()).toBe(1);
  });

  it("stores and retrieves sync state", () => {
    const vaultPath = makeTempDir();
    const adapter = new ObsidianAdapter(vaultPath, "data");

    adapter.setLastSuccessfulSync("2026-03-21T12:00:00.000Z");

    expect(adapter.getLastSuccessfulSync()).toBe("2026-03-21T12:00:00.000Z");
    expect(adapter.getSyncState("last_successful_sync")).toBe(
      "2026-03-21T12:00:00.000Z",
    );
  });
});
