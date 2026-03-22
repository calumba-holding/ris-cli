/// <reference types="vitest" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const adapter = {
    searchBundesrecht: vi.fn(),
    fetchBundesrechtDetail: vi.fn(),
  };

  return { adapter };
});

vi.mock("../adapters/ris.js", () => ({
  getRISAdapter: () => mocks.adapter,
}));

import { executeBundesrecht } from "../commands/bundesrecht.js";

describe("bundesrecht command", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes JSON output for search results", async () => {
    mocks.adapter.searchBundesrecht.mockResolvedValue([
      {
        id: "NOR40271932",
        title: "Waffengesetz 1996 – § 44b",
        documentType: "Paragraph",
        section: "§ 44b",
        lawNumber: "10006016",
        effectiveDate: "9000-01-01",
        url: "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
      },
    ]);

    await executeBundesrecht("BDG § 3", {
      limit: "5",
      offset: "2",
      json: true,
    });

    expect(mocks.adapter.searchBundesrecht).toHaveBeenCalledWith("BDG § 3", {
      limit: 5,
      offset: 2,
    });
    expect(logSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(payload).toMatchObject({
      query: "BDG § 3",
      count: 1,
    });
    expect(payload.results[0]).toMatchObject({
      title: "Waffengesetz 1996 – § 44b",
      lawNumber: "10006016",
    });
  });

  it("fetches full text when --with-full-text is enabled", async () => {
    mocks.adapter.searchBundesrecht.mockResolvedValue([
      {
        id: "NOR40271932",
        title: "Waffengesetz 1996 – § 44b",
        documentType: "Paragraph",
        section: "§ 44b",
        lawNumber: "10006016",
        effectiveDate: "9000-01-01",
        url: "https://www.ris.bka.gv.at/eli/bgbl/i/1997/12/P44b/NOR40271932",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
      },
    ]);
    mocks.adapter.fetchBundesrechtDetail.mockResolvedValue({
      id: "NOR40271932",
      title: "Waffengesetz 1996 – § 44b",
      documentType: "Paragraph",
      section: "§ 44b",
      lawNumber: "10006016",
      effectiveDate: "9000-01-01",
      url: "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
      currentLawUrl:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
      fullText:
        "§ 3. Aktuelle konsolidierte Fassung des Bundesrechts mit dem gesuchten Paragraphen.",
      metadata: {
        lawNumber: "10006016",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10006016",
      },
    });

    await executeBundesrecht("BDG § 3", {
      withFullText: true,
    });

    expect(mocks.adapter.fetchBundesrechtDetail).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls.flat().join(" ")).toContain(
      "Aktuelle konsolidierte Fassung des Bundesrechts mit dem gesuchten Paragraphen.",
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("prints the matched BDG paragraph and its fetched full text", async () => {
    mocks.adapter.searchBundesrecht.mockResolvedValue([
      {
        id: "NOR40274148",
        title: "Beamten-Dienstrechtsgesetz 1979 – § 3",
        documentType: "Paragraph",
        section: "§ 3",
        lawNumber: "10008470",
        effectiveDate: "2025-04-01",
        url: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40274148/NOR40274148.html",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008470",
      },
    ]);
    mocks.adapter.fetchBundesrechtDetail.mockResolvedValue({
      id: "NOR40274148",
      title: "Beamten-Dienstrechtsgesetz 1979 – § 3",
      documentType: "Paragraph",
      section: "§ 3",
      lawNumber: "10008470",
      effectiveDate: "2025-04-01",
      url: "https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40274148/NOR40274148.html",
      currentLawUrl:
        "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008470",
      fullText:
        "Kurztitel Beamten-Dienstrechtsgesetz 1979 Text Besetzung von Planstellen § 3. Die Besetzung einer Planstelle bedarf der vorherigen Zustimmung.",
      metadata: {
        lawNumber: "10008470",
        currentLawUrl:
          "https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008470",
      },
    });

    await executeBundesrecht("BDG § 3", {
      withFullText: true,
    });

    const output = logSpy.mock.calls.flat().join(" ");
    expect(output).toContain("Beamten-Dienstrechtsgesetz 1979 – § 3");
    expect(output).toContain("§ 3.");
    expect(output).toContain(
      "Die Besetzung einer Planstelle bedarf der vorherigen Zustimmung.",
    );
  });
});
