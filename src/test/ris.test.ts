/// <reference types="vitest" />

import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { RISAdapter } from "../adapters/ris.js";
import {
  sampleAPIResponse,
  sampleAPIResponseEmpty,
  sampleAPIStringResponse,
  sampleBundesrechtAPIResponse,
  sampleBundesrechtAPIStringResponse,
} from "../test/fixtures/sample.js";

describe("RIS Adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe("Bundesrecht", () => {
    it("should send BrKons params and default to current consolidated sorting", async () => {
      const adapter = new RISAdapter();
      const fetchWithRetry = vi
        .fn()
        .mockResolvedValue({ data: sampleBundesrechtAPIResponse });
      (adapter as any).fetchWithRetry = fetchWithRetry;

      await adapter.searchBundesrecht("Datenschutz", {
        limit: 10,
        offset: 0,
      });

      expect(fetchWithRetry).toHaveBeenCalledTimes(1);
      expect(fetchWithRetry).toHaveBeenCalledWith(
        "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht",
        expect.objectContaining({
          Applikation: "BrKons",
          Suchworte: "Datenschutz",
          DokumenteProSeite: "Ten",
          Seitennummer: 1,
          "Sortierung.SortedByColumn": "Inkrafttretensdatum",
          "Sortierung.SortDirection": "Descending",
        }),
      );
    });

    it("should map a paragraph query to Titel plus Abschnitt filters", async () => {
      const adapter = new RISAdapter();
      const fetchWithRetry = vi
        .fn()
        .mockResolvedValue({ data: sampleBundesrechtAPIResponse });
      (adapter as any).fetchWithRetry = fetchWithRetry;

      await adapter.searchBundesrecht("BDG § 3", {
        limit: 10,
        offset: 0,
      });

      expect(fetchWithRetry).toHaveBeenCalledWith(
        "https://data.bka.gv.at/ris/api/v2.6/Bundesrecht",
        expect.objectContaining({
          Applikation: "BrKons",
          Titel: "BDG",
          "Abschnitt.Typ": "Paragraph",
          "Abschnitt.Von": "3",
          "Abschnitt.Bis": "3",
          DokumenteProSeite: "Ten",
          Seitennummer: 1,
        }),
      );
    });

    it("should parse Bundesrecht results", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseBundesrechtResults(
        sampleBundesrechtAPIResponse,
        10,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: "NOR40271932",
        title: "Waffengesetz 1996 – § 44b",
        documentType: "Paragraph",
        section: "§ 44b",
        lawNumber: "10006016",
        effectiveDate: "9000-01-01",
        url: "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
        contentUrls: {
          html: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40271932/NOR40271932.html",
        },
      });
    });

    it("should handle Bundesrecht string responses", () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseBundesrechtResults(
        sampleBundesrechtAPIStringResponse,
        10,
      );

      expect(results).toHaveLength(2);
      expect(results[1]?.title).toBe("Datenschutzgesetz – § 1");
    });

    it("should fetch Bundesrecht detail from the current-law URL by default", async () => {
      const adapter = new RISAdapter();
      const law = {
        id: "NOR40271932",
        title: "Waffengesetz 1996 – § 44b",
        documentType: "Paragraph",
        section: "§ 44b",
        lawNumber: "10006016",
        effectiveDate: "9000-01-01",
        url: "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
        contentUrls: {
          html: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40271932/NOR40271932.html",
        },
      };

      const axiosGet = vi.spyOn(axios, "get").mockResolvedValue({
        data: '<!DOCTYPE html><html><body><div id="header">Header</div><div class="documentContent"><div class="contentBlock"><h5><span aria-hidden="true">§&nbsp;3.</span></h5><div class="content"><span>Der Beamte hat seine dienstlichen Aufgaben treu zu besorgen. Dieser Bundesrecht-Text stammt aus der aktuellen konsolidierten Fassung und ist absichtlich lang genug, damit die Detailabfrage nicht auf die Fallback-URL wechseln muss.</span></div></div></div></body></html>',
        headers: { "content-type": "text/html; charset=utf-8" },
      } as any);

      const detail = await adapter.fetchBundesrechtDetail(law);

      expect(axiosGet).toHaveBeenCalledTimes(1);
      expect(axiosGet).toHaveBeenCalledWith(
        law.contentUrls.html,
        expect.objectContaining({ responseType: "text" }),
      );
      expect(detail).toMatchObject({
        title: law.title,
        url: law.contentUrls.html,
        metadata: {
          lawNumber: "10006016",
          currentLawUrl: law.currentLawUrl,
        },
      });
      expect(detail?.fullText).toContain("§ 3.");
      expect(detail?.fullText).toContain(
        "Der Beamte hat seine dienstlichen Aufgaben treu zu besorgen.",
      );
      expect(detail?.fullText).not.toContain("<!DOCTYPE html>");
      expect(detail?.fullText).not.toContain("Header");
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
