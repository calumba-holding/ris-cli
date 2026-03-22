// RIS API Adapter - Uses official data.bka.gv.at API

import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";
import type {
  SearchResult,
  SearchOptions,
  JudgmentDetail,
  LawSearchResult,
  LawDetail,
} from "../types/index.js";
import { backoff } from "../lib/utils.js";

const RIS_API_BASE = "https://data.bka.gv.at/ris/api/v2.6";

export interface RISSearchOptions extends SearchOptions {}

export interface APIJudgment {
  Geschaeftszahl: string;
  Dokumenttyp: string;
  Gericht: string;
  Entscheidungsdatum: string;
  Anmerkung?: string;
  DokumentUrl?: string;
}

export interface APIResponse {
  Data?: Array<{
    Metadaten?: {
      Technisch?: { ID?: string };
      Allgemein?: { DokumentUrl?: string };
      Judikatur?: {
        Geschaeftszahl?: string | { item?: string[] };
        Dokumenttyp?: string;
        Gericht?: string;
        Entscheidungsdatum?: string;
        EuropeanCaseLawIdentifier?: string;
        Schlagworte?: string;
        Entscheidungstexte?: { item?: APIJudgment[] };
      };
    };
  }>;
}

export class RISAdapter {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor(apiUrl: string = RIS_API_BASE) {
    this.apiUrl = apiUrl;
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 60000,
      headers: {
        "User-Agent": "ris-cli/1.0 (research tool)",
        Accept: "application/json",
        "Accept-Language": "de-AT,de;q=0.9,en;q=0.8",
      },
    });
  }

  /**
   * Search RIS API for judgments matching the query
   */
  async search(
    query: string,
    options: RISSearchOptions = {},
  ): Promise<SearchResult[]> {
    const normalizedLimit = this.normalizeLimit(options.limit);
    const normalizedOffset = this.normalizeOffset(options.offset);

    if (normalizedLimit <= 0) {
      return [];
    }

    try {
      const url = `${this.apiUrl}/Judikatur`;
      const strategy = this.getPaginationStrategy(
        normalizedOffset,
        normalizedLimit,
      );
      const baseParams = this.buildSearchParams(
        query,
        options,
        strategy.pageSize,
      );
      const results: SearchResult[] = [];

      for (let index = 0; index < strategy.pagesNeeded; index += 1) {
        const pageNumber = strategy.startPage + index;
        const response = await this.fetchWithRetry(url, {
          ...baseParams,
          Seitennummer: pageNumber,
        });

        const pageResults = this.parseApiResults(
          response.data,
          query,
          strategy.pageSize,
        );
        results.push(...pageResults);

        if (pageResults.length < strategy.pageSize) {
          break;
        }
      }

      return results.slice(
        strategy.firstPageOffset,
        strategy.firstPageOffset + normalizedLimit,
      );
    } catch (error) {
      console.error(`API search failed for query "${query}":`, error);
      return [];
    }
  }

  async searchBundesrecht(
    query: string,
    options: Pick<SearchOptions, "limit" | "offset"> = {},
  ): Promise<LawSearchResult[]> {
    const normalizedLimit = this.normalizeLimit(options.limit);
    const normalizedOffset = this.normalizeOffset(options.offset);

    if (normalizedLimit <= 0) {
      return [];
    }

    try {
      const url = `${this.apiUrl}/Bundesrecht`;
      const strategy = this.getPaginationStrategy(
        normalizedOffset,
        normalizedLimit,
      );
      const baseParams = this.buildBundesrechtSearchParams(
        query,
        strategy.pageSize,
      );
      const results: LawSearchResult[] = [];

      for (let index = 0; index < strategy.pagesNeeded; index += 1) {
        const pageNumber = strategy.startPage + index;
        const response = await this.fetchWithRetry(url, {
          ...baseParams,
          Seitennummer: pageNumber,
        });

        const pageResults = this.parseBundesrechtResults(
          response.data,
          strategy.pageSize,
        );
        results.push(...pageResults);

        if (pageResults.length < strategy.pageSize) {
          break;
        }
      }

      return results.slice(
        strategy.firstPageOffset,
        strategy.firstPageOffset + normalizedLimit,
      );
    } catch (error) {
      console.error(`Bundesrecht search failed for query "${query}":`, error);
      return [];
    }
  }

  async fetchBundesrechtDetail(
    result: LawSearchResult,
  ): Promise<LawDetail | null> {
    const candidateUrls = [
      result.contentUrls?.html,
      result.contentUrls?.xml,
      result.contentUrls?.rtf,
      result.currentLawUrl,
      result.url,
    ].filter((value, index, arr): value is string => {
      return (
        typeof value === "string" &&
        value.length > 0 &&
        arr.indexOf(value) === index
      );
    });

    try {
      for (const candidateUrl of candidateUrls) {
        const response = await axios.get(candidateUrl, {
          timeout: 30000,
          headers: {
            "User-Agent": "ris-cli/1.0 (research tool)",
            Accept: "text/html,application/xml,text/xml,*/*;q=0.8",
          },
          responseType: "text",
        });

        const extracted = await this.extractTextFromDocument(
          String(response.data),
          candidateUrl,
          response.headers?.["content-type"],
        );

        if (extracted.trim().length > 200) {
          return this.buildLawDetailFromExtractedText(
            result,
            extracted,
            candidateUrl,
          );
        }
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch Bundesrecht detail for ${result.url}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Fetch detailed information (incl. full text) for a specific judgment.
   *
   * Prefer the direct content URLs (XML/HTML/RTF) returned by the RIS API.
   * Falling back to scraping the human-facing HTML page is a last resort.
   */
  async fetchDetail(result: SearchResult): Promise<JudgmentDetail | null> {
    const url = result.url;

    try {
      // 1) Try content URLs first (best signal, no JS shell)
      const candidates: Array<{ kind: "xml" | "html" | "rtf"; url: string }> =
        [];
      if (result.contentUrls?.xml)
        candidates.push({ kind: "xml", url: result.contentUrls.xml });
      if (result.contentUrls?.html)
        candidates.push({ kind: "html", url: result.contentUrls.html });
      if (result.contentUrls?.rtf)
        candidates.push({ kind: "rtf", url: result.contentUrls.rtf });

      for (const c of candidates) {
        try {
          const response = await axios.get(c.url, {
            timeout: 30000,
            headers: {
              "User-Agent": "ris-cli/1.0 (research tool)",
              Accept:
                c.kind === "xml" ? "application/xml,text/xml,*/*;q=0.8" : "*/*",
            },
            responseType: "text",
          });

          const extracted = await this.extractTextFromDocument(
            String(response.data),
            c.url,
            response.headers?.["content-type"],
          );
          if (extracted && extracted.trim().length > 500) {
            return this.buildDetailFromExtractedText(result, extracted, c.url);
          }
        } catch {
          // try next candidate
        }
      }

      // 2) Fallback: scrape HTML document page
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "ris-cli/1.0 (research tool)",
          Accept: "text/html",
        },
        responseType: "text",
      });

      return this.parseDetailPage(String(response.data), url);
    } catch (error) {
      console.error(`Failed to fetch detail for ${url}:`, error);
      return null;
    }
  }

  /**
   * Fetch with retry
   */
  private async fetchWithRetry(
    url: string,
    params: Record<string, any>,
    maxRetries: number = 3,
  ): Promise<any> {
    return backoff(async () => {
      const response = await this.client.get(url, { params });
      return response;
    }, maxRetries);
  }

  private buildBundesrechtSearchParams(
    query: string,
    pageSize: number,
  ): Record<string, any> {
    const parsedQuery = this.parseBundesrechtQuery(query);
    const params: Record<string, any> = {
      Applikation: "BrKons",
      DokumenteProSeite: this.mapPageSizeToApiValue(pageSize),
      "Sortierung.SortedByColumn": "Inkrafttretensdatum",
      "Sortierung.SortDirection": "Descending",
    };

    if (parsedQuery.title) {
      params.Titel = parsedQuery.title;
    } else {
      params.Suchworte = query;
    }

    if (parsedQuery.sectionType) {
      params["Abschnitt.Typ"] = parsedQuery.sectionType;
    }
    if (parsedQuery.sectionFrom) {
      params["Abschnitt.Von"] = parsedQuery.sectionFrom;
    }
    if (parsedQuery.sectionTo) {
      params["Abschnitt.Bis"] = parsedQuery.sectionTo;
    }

    return params;
  }

  private buildSearchParams(
    query: string,
    options: RISSearchOptions,
    pageSize: number,
  ): Record<string, any> {
    const params: Record<string, any> = {
      Applikation: "Justiz",
      Suchworte: query,
      "Dokumenttyp.SucheInEntscheidungstexten": "true",
      DokumenteProSeite: this.mapPageSizeToApiValue(pageSize),
      "Sortierung.SortedByColumn": "Datum",
      "Sortierung.SortDirection": "Descending",
    };

    if (options.fromDate) params.EntscheidungsdatumVon = options.fromDate;
    if (options.toDate) params.EntscheidungsdatumBis = options.toDate;
    if (options.gericht && options.gericht !== "All")
      params.Gericht = options.gericht;

    return params;
  }

  private getPaginationStrategy(
    offset: number,
    limit: number,
  ): {
    pageSize: number;
    startPage: number;
    pagesNeeded: number;
    firstPageOffset: number;
  } {
    const allowedPageSizes = [10, 20, 50, 100];
    const candidates = allowedPageSizes.map((pageSize) => {
      const startPage = Math.floor(offset / pageSize) + 1;
      const firstPageOffset = offset % pageSize;
      const pagesNeeded = Math.ceil((firstPageOffset + limit) / pageSize);
      const fetchedItems = pagesNeeded * pageSize;

      return {
        pageSize,
        startPage,
        pagesNeeded,
        firstPageOffset,
        fetchedItems,
      };
    });

    candidates.sort((a, b) => {
      if (a.fetchedItems !== b.fetchedItems)
        return a.fetchedItems - b.fetchedItems;
      if (a.pagesNeeded !== b.pagesNeeded) return a.pagesNeeded - b.pagesNeeded;
      return a.pageSize - b.pageSize;
    });

    const best = candidates[0];
    return {
      pageSize: best.pageSize,
      startPage: best.startPage,
      pagesNeeded: best.pagesNeeded,
      firstPageOffset: best.firstPageOffset,
    };
  }

  private mapPageSizeToApiValue(
    pageSize: number,
  ): "Ten" | "Twenty" | "Fifty" | "OneHundred" {
    if (pageSize <= 10) return "Ten";
    if (pageSize <= 20) return "Twenty";
    if (pageSize <= 50) return "Fifty";
    return "OneHundred";
  }

  private normalizeLimit(limit: number | undefined): number {
    if (!Number.isFinite(limit) || typeof limit !== "number") return 20;
    return Math.max(0, Math.floor(limit));
  }

  private normalizeOffset(offset: number | undefined): number {
    if (!Number.isFinite(offset) || typeof offset !== "number") return 0;
    return Math.max(0, Math.floor(offset));
  }

  private extractDataArray(data: any): any[] {
    let cleanData = data;

    if (typeof data === "string") {
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          cleanData = JSON.parse(jsonMatch[0]);
        } catch {
          const dataMatch = data.match(/"Data"\s*:\s*\[([\s\S]*)\]/);
          if (dataMatch) {
            try {
              cleanData = { Data: JSON.parse(`[${dataMatch[1]}]`) };
            } catch {
              return [];
            }
          } else {
            return [];
          }
        }
      } else {
        return [];
      }
    }

    if (cleanData?.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
      cleanData =
        cleanData.OgdSearchResult.OgdDocumentResults.OgdDocumentReference.map(
          (item: any) => item.Data,
        );
    }

    let dataArray = cleanData?.Data || cleanData?.data;

    if (!Array.isArray(dataArray) && cleanData?.Data?.Data) {
      dataArray = cleanData.Data.Data;
    }

    if (!Array.isArray(dataArray) && Array.isArray(cleanData)) {
      dataArray = cleanData;
    }

    return Array.isArray(dataArray) ? dataArray : [];
  }

  /**
   * Parse API response to Bundesrecht search results.
   */
  private parseBundesrechtResults(data: any, limit: number): LawSearchResult[] {
    const results: LawSearchResult[] = [];
    const dataArray = this.extractDataArray(data);

    for (const item of dataArray) {
      if (results.length >= limit) break;

      const metadata = item?.Metadaten || item?.metadata;
      const bundesrecht = metadata?.Bundesrecht;
      const brKons = bundesrecht?.BrKons;

      if (!bundesrecht || !brKons) continue;

      const documentUrl =
        metadata?.Allgemein?.DokumentUrl || metadata?.DokumentUrl || "";
      const currentLawUrl = brKons?.GesamteRechtsvorschriftUrl;
      const shortTitle = this.readStringValue(bundesrecht?.Kurztitel);
      const section = this.readStringValue(brKons?.ArtikelParagraphAnlage);
      const title = [shortTitle, section].filter(Boolean).join(" – ");
      const lawNumber = this.readStringValue(brKons?.Gesetzesnummer);
      const documentType = this.readStringValue(brKons?.Dokumenttyp);
      const effectiveDate = this.normalizeDate(
        this.readStringValue(brKons?.Inkrafttretensdatum) || "",
      );

      if (!title) continue;

      const id =
        this.extractDokumentnummer(documentUrl) ||
        this.readStringValue(metadata?.Technisch?.ID) ||
        this.generateId(documentUrl || currentLawUrl || title);

      results.push({
        id,
        title,
        documentType,
        section,
        lawNumber,
        effectiveDate: effectiveDate || undefined,
        url: documentUrl || currentLawUrl || "",
        currentLawUrl,
        contentUrls: this.extractContentUrls(item),
        snippet: shortTitle,
      });
    }

    return results;
  }

  /**
   * Parse API response to SearchResult[]
   */
  private parseApiResults(
    data: any,
    _query: string,
    limit: number,
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const dataArray = this.extractDataArray(data);

    for (const item of dataArray) {
      if (results.length >= limit) break;

      // Navigate the nested structure - Data.Metadaten
      const metadata = item?.Metadaten || item?.metadata;
      const judikatur = metadata?.Judikatur || metadata?.Judikatur || metadata;

      if (!judikatur) continue;

      // Extract court - may be in different locations
      const courtData =
        judikatur?.Gericht ||
        metadata?.Technisch?.Organ ||
        metadata?.Organ ||
        "Unknown";
      const court = Array.isArray(courtData) ? courtData[0] : courtData;

      // Extract main fields
      const gz = this.extractGZ(judikatur.Geschaeftszahl);
      const date = judikatur.Entscheidungsdatum || "";

      // Prefer a real decision text (JJT_...) over a Rechtssatz (JJR_...), because only the
      // text document contains the actual judgment full text.
      const decisionTexts = judikatur?.Justiz?.Entscheidungstexte?.item;
      const preferredTextDoc = Array.isArray(decisionTexts)
        ? decisionTexts.find((t: any) => typeof t?.DokumentUrl === "string")
        : undefined;

      // Human-facing document page URL (Dokument.wxe)
      const docUrl =
        preferredTextDoc?.DokumentUrl ||
        metadata?.Allgemein?.DokumentUrl ||
        metadata?.DokumentUrl ||
        "";

      // Prefer decision metadata from the preferred text document, if present
      const effectiveDate = preferredTextDoc?.Entscheidungsdatum || date;
      const effectiveGz = preferredTextDoc?.Geschaeftszahl || gz;

      // Direct content URLs (XML/HTML/RTF/PDF) are usually present under Dokumentliste
      // (but these belong to the current API document - often a Rechtssatz JJR_...).
      // If we switched to a decision text document (JJT_...), we intentionally ignore those
      // and let fetchDetail() scrape the JJT page to find the correct content links.
      const contentUrls = preferredTextDoc
        ? undefined
        : this.extractContentUrls(item);

      // Generate title from Geschaeftszahl or use first decision text
      const title = this.extractTitle(judikatur);

      if (title) {
        const apiId = metadata?.Technisch?.ID;
        const docNo = this.extractDokumentnummer(docUrl);
        const id = docNo
          ? docNo
          : apiId
            ? String(apiId)
            : this.generateId(docUrl || `${gz}-${date}`);

        results.push({
          id,
          title,
          court: Array.isArray(court) ? court[0] : court,
          date: this.normalizeDate(effectiveDate),
          gz: effectiveGz,
          url: docUrl || "",
          contentUrls,
          snippet: this.extractSnippet(judikatur),
        });
      }
    }

    return results;
  }

  private readStringValue(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : undefined;
  }

  private parseBundesrechtQuery(query: string): {
    title?: string;
    sectionType?: "Paragraph";
    sectionFrom?: string;
    sectionTo?: string;
  } {
    const normalized = query.replace(/\s+/g, " ").trim();
    const paragraphMatch = normalized.match(
      /^(?<title>.+?)\s+§\s*(?<from>[0-9]+[a-zA-Z]?)(?:\s*[-–]\s*(?<to>[0-9]+[a-zA-Z]?))?$/,
    );

    if (!paragraphMatch?.groups) {
      return {};
    }

    return {
      title: paragraphMatch.groups.title.trim(),
      sectionType: "Paragraph",
      sectionFrom: paragraphMatch.groups.from,
      sectionTo: paragraphMatch.groups.to ?? paragraphMatch.groups.from,
    };
  }

  /**
   * Extract Geschäftszahl from API response
   */
  private extractGZ(
    gz: string | { item?: string[] | string } | undefined,
  ): string | undefined {
    if (!gz) return undefined;

    if (typeof gz === "string") return gz;
    if (Array.isArray(gz)) return gz[0];
    if (typeof gz?.item === "string") return gz.item;
    if (gz?.item && Array.isArray(gz.item)) return gz.item[0];

    return undefined;
  }

  /**
   * Extract title from judgment data
   */
  private extractTitle(judikatur: any): string {
    // Try to get from first Entscheidungstext
    const texts =
      judikatur?.Entscheidungstexte?.item ||
      judikatur?.Justiz?.Entscheidungstexte?.item;
    if (texts && Array.isArray(texts) && texts.length > 0) {
      const first = texts[0];
      if (first?.Geschaeftszahl) {
        return first.Geschaeftszahl;
      }
    }

    // Fallback to Geschaeftszahl (may be string or array)
    const gz = this.extractGZ(judikatur.Geschaeftszahl);
    if (gz) return gz;

    return "Unknown Judgment";
  }

  /**
   * Extract snippet/description
   */
  private extractSnippet(judikatur: any): string | undefined {
    // Try Schlagworte
    if (judikatur.Schlagworte) {
      return judikatur.Schlagworte.substring(0, 200);
    }

    // Try first Entscheidungstext Anmerkung
    const texts =
      judikatur?.Entscheidungstexte?.item ||
      judikatur?.Justiz?.Entscheidungstexte?.item;
    if (texts && Array.isArray(texts) && texts.length > 0) {
      const first = texts[0];
      if (first?.Anmerkung) {
        return first.Anmerkung.replace(/<[^>]*>/g, "").substring(0, 200);
      }
    }

    return undefined;
  }

  private extractDokumentnummer(url: string | undefined): string | undefined {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      const docNo = u.searchParams.get("Dokumentnummer");
      return docNo || undefined;
    } catch {
      // url might be relative; ignore
      return undefined;
    }
  }

  /**
   * Extract direct document content URLs (XML/HTML/RTF/PDF) from the RIS API payload.
   */
  private extractContentUrls(item: any): SearchResult["contentUrls"] {
    const urls: SearchResult["contentUrls"] = {};

    const list: any[] =
      item?.Dokumentliste?.ContentReference?.Urls?.ContentUrl ||
      item?.Dokumentliste?.ContentReference?.Urls?.contentUrl ||
      [];

    const arr = Array.isArray(list) ? list : [list];
    for (const entry of arr) {
      const u = entry?.Url || entry?.url;
      if (typeof u !== "string") continue;
      if (u.endsWith(".xml")) urls.xml = u;
      else if (u.endsWith(".html")) urls.html = u;
      else if (u.endsWith(".rtf")) urls.rtf = u;
      else if (u.endsWith(".pdf")) urls.pdf = u;
    }

    return Object.keys(urls).length ? urls : undefined;
  }

  /**
   * Parse HTML detail page for full text
   */
  private async parseDetailPage(
    html: string,
    url: string,
  ): Promise<JudgmentDetail | null> {
    const cheerio = await import("cheerio");
    // cheerio is ESM/CJS hybrid; use .load for a stable API
    const $ = cheerio.load(html);

    // Try to find document title
    const title =
      $("h1.dokument-titel, h1.dokumentTitle, h1").first().text().trim() ||
      $("title")
        .text()
        .replace(/\s*[--]\s*RIS.*$/i, "")
        .trim() ||
      "Unknown Title";

    // Extract metadata from page
    const pageText = $("body").text();

    const courtMatch = pageText.match(/\b(OGH|OLG|LG|BG|VfGH|VwGH)\b/);
    const dateMatch = pageText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
    const gzMatch = pageText.match(/([A-Z]{2,4}\s*[\d\/]+(?:\/\d{4})?)/);

    const court = courtMatch?.[1] || "Unknown";
    const date = dateMatch?.[1] || "";
    const gz = gzMatch?.[1];

    // Try to find full text in document links
    let fullText = "";
    const docLinks = $('a[href*="/Dokumente/Justiz/"]').toArray();

    // Look for XML/HTML/RTF links and try to fetch content
    for (const link of docLinks.slice(0, 6)) {
      const hrefRaw = $(link).attr("href");
      if (!hrefRaw) continue;

      const href = new URL(hrefRaw, url).toString();

      if (
        href.endsWith(".xml") ||
        href.endsWith(".html") ||
        href.endsWith(".rtf")
      ) {
        try {
          const response = await axios.get(href, {
            timeout: 20000,
            responseType: "text",
          });
          fullText = await this.extractTextFromDocument(
            String(response.data),
            href,
            response.headers?.["content-type"],
          );
          if (fullText.length > 500) break;
        } catch {
          // Continue trying other links
        }
      }
    }

    // If no document content, use page text as fallback
    if (!fullText || fullText.length < 100) {
      // Try to extract meaningful content from main content area
      const contentArea = $(
        ".dokument-text, .content, article, main, .document-body",
      ).first();
      fullText = contentArea.text().trim() || pageText.substring(0, 5000);
    }

    return {
      id: this.generateId(url),
      title,
      court,
      date: this.normalizeDate(date),
      gz,
      url,
      snippet: fullText.substring(0, 200) + "...",
      metadata: {
        court,
        date: this.normalizeDate(date),
        gz,
        decision: undefined,
        ogiNumber: undefined,
        legalBase: undefined,
      },
      fullText: this.cleanText(fullText),
    };
  }

  /**
   * Extract text from document (XML/HTML/RTF)
   */
  private async extractTextFromDocument(
    content: string,
    url: string,
    contentType?: string,
  ): Promise<string> {
    const lowerContentType = contentType?.toLowerCase() || "";
    const isXml =
      url.endsWith(".xml") ||
      lowerContentType.includes("xml") ||
      /^\s*<\?xml/i.test(content);
    const isHtml =
      url.endsWith(".html") ||
      lowerContentType.includes("text/html") ||
      /^\s*<!doctype html/i.test(content) ||
      /^\s*<html/i.test(content) ||
      content.includes('class="documentContent"') ||
      content.includes('class="contentBlock"');

    if (isXml || isHtml) {
      const cheerio = await import("cheerio");
      const $ = cheerio.load(content, { xmlMode: isXml && !isHtml });

      $("script, style, noscript, .sr-only, .onlyScreenreader").remove();

      if (isHtml) {
        const bundesrechtText = $(".documentContent .contentBlock")
          .toArray()
          .map((node) => $(node).text().trim())
          .filter((text) => text.length > 0)
          .join("\n\n");

        if (bundesrechtText.length > 0) {
          return bundesrechtText;
        }
      }

      const bodyText = $("body").text();
      const text = (
        bodyText && bodyText.trim().length > 0 ? bodyText : $.text()
      ).trim();
      return text;
    }

    if (url.endsWith(".rtf") || lowerContentType.includes("rtf")) {
      return this.rtfToText(content);
    }

    return content;
  }

  private rtfToText(rtf: string): string {
    // Strip RTF groups and control words; keep a rough plain-text.
    // This won't be perfect, but it's good enough for searchable notes.
    return rtf
      .replace(/\{\\\*[^}]*\}/g, "")
      .replace(/\{\s*\}/g, "")
      .replace(/\\par[d]?/g, "\n")
      .replace(/\\tab/g, "\t")
      .replace(/\\'[0-9a-fA-F]{2}/g, " ")
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
      .replace(/[{}]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  private buildDetailFromExtractedText(
    result: SearchResult,
    extractedText: string,
    _sourceUrl: string,
  ): JudgmentDetail {
    const fullText = this.cleanText(extractedText);

    return {
      id: result.id,
      title: result.title,
      court: result.court,
      date: result.date,
      gz: result.gz,
      url: result.url,
      snippet: fullText.substring(0, 200) + "...",
      metadata: {
        court: result.court,
        date: result.date,
        gz: result.gz,
        decision: undefined,
        ogiNumber: undefined,
        legalBase: undefined,
      },
      fullText,
    };
  }

  private buildLawDetailFromExtractedText(
    result: LawSearchResult,
    extractedText: string,
    sourceUrl: string,
  ): LawDetail {
    const fullText = this.cleanText(extractedText);

    return {
      ...result,
      url: sourceUrl || result.url,
      snippet: fullText.substring(0, 200) + "...",
      metadata: {
        documentType: result.documentType,
        section: result.section,
        lawNumber: result.lawNumber,
        effectiveDate: result.effectiveDate,
        currentLawUrl: result.currentLawUrl,
      },
      fullText,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(url: string): string {
    return crypto
      .createHash("md5")
      .update(url || Math.random().toString())
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Normalize date to ISO format
   */
  private normalizeDate(dateStr: string): string {
    if (!dateStr) return "";

    const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return dateStr;
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
  }
}

// Singleton instance
let adapterInstance: RISAdapter | null = null;

export function getRISAdapter(): RISAdapter {
  if (!adapterInstance) {
    adapterInstance = new RISAdapter();
  }
  return adapterInstance;
}
