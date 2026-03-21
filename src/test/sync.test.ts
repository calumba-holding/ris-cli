/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { resolveSyncWindow } from "../commands/sync.js";

describe("sync window resolution", () => {
  it("prefers explicit from-date over stored sync state", () => {
    expect(
      resolveSyncWindow({
        fromDate: "2025-01-01",
        toDate: "2025-01-31",
        mode: "incremental",
        lastSuccessfulSync: "2025-02-15T10:00:00.000Z",
        now: new Date("2025-03-01T12:00:00.000Z"),
      }),
    ).toEqual({
      fromDate: "2025-01-01",
      toDate: "2025-01-31",
      derivedFromLastSync: false,
    });
  });

  it("uses last successful sync for incremental mode", () => {
    expect(
      resolveSyncWindow({
        mode: "incremental",
        lastSuccessfulSync: "2025-02-15T10:00:00.000Z",
        now: new Date("2025-03-01T12:00:00.000Z"),
      }),
    ).toEqual({
      fromDate: "2025-02-15",
      toDate: "2025-03-01",
      derivedFromLastSync: true,
    });
  });

  it("falls back to last 30 days when no prior sync exists", () => {
    expect(
      resolveSyncWindow({
        mode: "incremental",
        now: new Date("2025-03-01T12:00:00.000Z"),
      }),
    ).toEqual({
      fromDate: "2025-01-30",
      toDate: "2025-03-01",
      derivedFromLastSync: false,
    });
  });

  it("does not use last successful sync for full mode", () => {
    expect(
      resolveSyncWindow({
        mode: "full",
        lastSuccessfulSync: "2025-02-15T10:00:00.000Z",
        now: new Date("2025-03-01T12:00:00.000Z"),
      }),
    ).toEqual({
      fromDate: "2025-01-30",
      toDate: "2025-03-01",
      derivedFromLastSync: false,
    });
  });
});
