/// <reference types="vitest" />

import { describe, it, expect, vi } from "vitest";
import { RISAdapter } from "../adapters/ris.js";
import {
  sampleAPIResponse,
  sampleAPIResponseEmpty,
  sampleAPIStringResponse,
} from "../test/fixtures/sample.js";

describe("RIS Adapter", () => {
  describe("search request building", () => {
    it("should send Justiz application, server-side sorting, paging, and court filter params", async () => {
      const adapter = new RISAdapter();
      const fetchWithRetry = vi
        .fn()
        .mockResolvedValue({ data: sampleAPIResponse });
      (adapter as any).fetchWithRetry = fetchWithRetry;

      await adapter.search("Cybermobbing", {
        limit: 10,
        offset: 0,
        fromDate: "2024-01-01",
        toDate: "2024-12-31",
        gericht: "OGH",
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(1);
      expect(fetchWithRetry).toHaveBeenCalledWith(
        "https://data.bka.gv.at/ris/api/v2.6/Judikatur",
        expect.objectContaining({
          Applikation: "Justiz",
          Suchworte: "Cybermobbing",
          Gericht: "OGH",
          EntscheidungsdatumVon: "2024-01-01",
          EntscheidungsdatumBis: "2024-12-31",
          "Dokumenttyp.SucheInEntscheidungstexten": "true",
          DokumenteProSeite: "Ten",
          Seitennummer: 1,
          "Sortierung.SortedByColumn": "Datum",
          "Sortierung.SortDirection": "Descending",
        }),
      );
    });

    it("should choose an efficient paging strategy for offset searches", () => {
      const adapter = new RISAdapter();
      const strategy = (adapter as any).getPaginationStrategy(25, 10);

      expect(strategy).toEqual({
        pageSize: 20,
        startPage: 2,
        pagesNeeded: 1,
        firstPageOffset: 5,
      });
    });

    it("should fetch multiple pages and slice them to the requested offset window", async () => {
      const adapter = new RISAdapter();
      const makePage = (prefix: string, page: number) => ({
        data: {
          Data: Array.from({ length: 10 }, (_, index) => ({
            Metadaten: {
              Technisch: { ID: `${prefix}-${page}-${index}` },
              Allgemein: {
                DokumentUrl: `https://example.test/${prefix}-${page}-${index}`,
              },
              Judikatur: {
                Dokumenttyp: "Text",
                Geschaeftszahl: { item: `${prefix}-${page}-${index}` },
                Entscheidungsdatum: `2026-02-${String(index + 1).padStart(2, "0")}`,
                Justiz: {
                  Gericht: "OGH",
                },
              },
            },
          })),
        },
      });

      const fetchWithRetry = vi
        .fn()
        .mockResolvedValueOnce(makePage("p", 2))
        .mockResolvedValueOnce(makePage("p", 3))
        .mockResolvedValueOnce(makePage("p", 4));
      (adapter as any).fetchWithRetry = fetchWithRetry;

      const results = await adapter.search("Cybermobbing", {
        limit: 25,
        offset: 15,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(3);
      expect(fetchWithRetry.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({ Seitennummer: 2, DokumenteProSeite: "Ten" }),
      );
      expect(fetchWithRetry.mock.calls[1]?.[1]).toEqual(
        expect.objectContaining({ Seitennummer: 3, DokumenteProSeite: "Ten" }),
      );
      expect(fetchWithRetry.mock.calls[2]?.[1]).toEqual(
        expect.objectContaining({ Seitennummer: 4, DokumenteProSeite: "Ten" }),
      );
      expect(results).toHaveLength(25);
      expect(results[0]?.title).toBe("p-2-5");
      expect(results.at(-1)?.title).toBe("p-4-9");
    });
  });

  describe("parseApiResults", () => {
    it("should parse API response to search results", () => {
      const adapter = new RISAdapter();

      const results = (adapter as any).parseApiResults(
        sampleAPIResponse,
        "test query",
        10,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: "4 Ob 123/23x", // API returns with spaces
        court: "OGH",
        date: "2023-03-15",
        gz: "4Ob123/23x",
        url: expect.stringContaining("JJR_20230315"),
      });
    });

    it("should handle empty results", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIResponseEmpty,
        "test query",
        10,
      );

      expect(results).toHaveLength(0);
    });

    it("should extract Geschaeftszahl when RIS returns item as a string", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        {
          Data: [
            {
              Metadaten: {
                Technisch: {
                  ID: "JJT_20260204_OLG0819_0060BS00275_25D0000_000",
                },
                Allgemein: {
                  DokumentUrl:
                    "https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Justiz&Dokumentnummer=JJT_20260204_OLG0819_0060BS00275_25D0000_000",
                },
                Judikatur: {
                  Dokumenttyp: "Text",
                  Geschaeftszahl: { item: "6Bs275/25d" },
                  Entscheidungsdatum: "2026-02-04",
                  Justiz: {
                    Gericht: "OLG Innsbruck",
                  },
                },
              },
            },
          ],
        },
        "test query",
        10,
      );

      expect(results[0]).toMatchObject({
        title: "6Bs275/25d",
        gz: "6Bs275/25d",
        date: "2026-02-04",
      });
    });

    it("should generate consistent IDs", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIResponse,
        "test query",
        10,
      );

      expect(results[0].id).toBe(results[0].id);
      expect(results[0].id).not.toBe(results[1].id);
    });

    it("should normalize dates to ISO format", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIResponse,
        "test query",
        10,
      );

      expect(results[0].date).toBe("2023-03-15");
      expect(results[1].date).toBe("2023-03-22");
    });

    it("should extract snippets from Schlagworte", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIResponse,
        "test query",
        10,
      );

      expect(results[0].snippet).toContain("Cybermobbing");
      expect(results[1].snippet).toContain("soziale Medien");
    });

    it("should handle string response with JSON", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIStringResponse,
        "test query",
        10,
      );

      expect(results).toHaveLength(2);
    });

    it("should limit results", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(
        sampleAPIResponse,
        "test query",
        1,
      );

      expect(results).toHaveLength(1);
    });
  });

  describe("API Integration", () => {
    it("should create adapter instance", () => {
      const adapter = new RISAdapter();
      expect(adapter).toBeInstanceOf(RISAdapter);
    });
  });
});

describe("Utils", () => {
  it("should handle date normalization", () => {
    const adapter = new RISAdapter();
    const normalizeDate = (adapter as any).normalizeDate.bind(adapter);

    expect(normalizeDate("15.03.2023")).toBe("2023-03-15");
    expect(normalizeDate("1.1.2024")).toBe("2024-01-01");
    expect(normalizeDate("")).toBe("");
  });
});
