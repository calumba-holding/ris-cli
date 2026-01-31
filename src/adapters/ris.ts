// RIS API Adapter - Uses official data.bka.gv.at API

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import type { SearchResult, SearchOptions, JudgmentDetail } from '../types/index.js';
import { backoff } from '../lib/utils.js';

const RIS_API_BASE = 'https://data.bka.gv.at/ris/api/v2.6';

export interface RISSearchOptions extends SearchOptions {
  gericht?: 'OGH' | 'OLG' | 'LG' | 'All';
}

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
        'User-Agent': 'urteil-watch/1.0 (research tool)',
        'Accept': 'application/json',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
      },
    });
  }

  /**
   * Search RIS API for judgments matching the query
   */
  async search(query: string, options: RISSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 20, offset = 0 } = options;

    try {
      const url = `${this.apiUrl}/Judikatur`;
      const params = { Suchworte: query };

      const response = await this.fetchWithRetry(url, params);
      const results = this.parseApiResults(response.data, query, limit * 2); // Fetch more, then sort
      // Sort by date descending (newest first)
      results.sort((a, b) => {
        const dateA = a.date || '1900-01-01';
        const dateB = b.date || '1900-01-01';
        return dateB.localeCompare(dateA);
      });
      return results.slice(0, limit);
    } catch (error) {
      console.error(`API search failed for query "${query}":`, error);
      return [];
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
      const candidates: Array<{ kind: 'xml' | 'html' | 'rtf'; url: string }> = [];
      if (result.contentUrls?.xml) candidates.push({ kind: 'xml', url: result.contentUrls.xml });
      if (result.contentUrls?.html) candidates.push({ kind: 'html', url: result.contentUrls.html });
      if (result.contentUrls?.rtf) candidates.push({ kind: 'rtf', url: result.contentUrls.rtf });

      for (const c of candidates) {
        try {
          const response = await axios.get(c.url, {
            timeout: 30000,
            headers: {
              'User-Agent': 'urteil-watch/1.0 (research tool)',
              'Accept': c.kind === 'xml' ? 'application/xml,text/xml,*/*;q=0.8' : '*/*',
            },
            responseType: 'text',
          });

          const extracted = await this.extractTextFromDocument(String(response.data), c.url);
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
          'User-Agent': 'urteil-watch/1.0 (research tool)',
          'Accept': 'text/html',
        },
        responseType: 'text',
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
  private async fetchWithRetry(url: string, params: Record<string, any>, maxRetries: number = 3): Promise<any> {
    return backoff(async () => {
      const response = await this.client.get(url, { params });
      return response;
    }, maxRetries);
  }

  /**
   * Parse API response to SearchResult[]
   */
  private parseApiResults(data: any, query: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];

    // Handle response - it may be a string or object with wrapped data
    let cleanData = data;

    if (typeof data === 'string') {
      // Try to find and extract the JSON object
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          cleanData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Try to find Data array directly in string
          const dataMatch = data.match(/"Data"\s*:\s*\[([\s\S]*)\]/);
          if (dataMatch) {
            try {
              cleanData = { Data: JSON.parse(`[${dataMatch[1]}]`) };
            } catch {
              return results;
            }
          } else {
            return results;
          }
        }
      } else {
        return results;
      }
    }

    // Handle OgdSearchResult wrapper structure from RIS API
    if (cleanData?.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference) {
      // OgdSearchResult structure - data is in .Data.Metadaten
      cleanData = cleanData.OgdSearchResult.OgdDocumentResults.OgdDocumentReference.map((item: any) => item.Data);
    }

    // Navigate to the Data array
    let dataArray = cleanData?.Data || cleanData?.data;

    // Handle nested data structure
    if (!Array.isArray(dataArray) && cleanData?.Data?.Data) {
      dataArray = cleanData.Data.Data;
    }

    // Handle OgdSearchResult already processed above
    if (!Array.isArray(dataArray) && Array.isArray(cleanData)) {
      // cleanData is already the array of Data objects
      dataArray = cleanData;
    }

    if (!dataArray || !Array.isArray(dataArray)) return results;

    for (const item of dataArray) {
      if (results.length >= limit) break;

      // Navigate the nested structure - Data.Metadaten
      const metadata = item?.Metadaten || item?.metadata;
      const judikatur = metadata?.Judikatur || metadata?.Judikatur || metadata;

      if (!judikatur) continue;

      // Extract court - may be in different locations
      const courtData = judikatur?.Gericht ||
                   metadata?.Technisch?.Organ ||
                   metadata?.Organ ||
                   'Unknown';
      const court = Array.isArray(courtData) ? courtData[0] : courtData;

      // Extract main fields
      const gz = this.extractGZ(judikatur.Geschaeftszahl);
      const date = judikatur.Entscheidungsdatum || '';

      // Human-facing document page URL (Dokument.wxe)
      const docUrl = metadata?.Allgemein?.DokumentUrl ||
                  metadata?.DokumentUrl ||
                  judikatur?.Entscheidungstexte?.item?.[0]?.DokumentUrl ||
                  '';

      // Direct content URLs (XML/HTML/RTF/PDF) are usually present under Dokumentliste
      const contentUrls = this.extractContentUrls(item);

      // Generate title from Geschaeftszahl or use first decision text
      const title = this.extractTitle(judikatur);

      if (title) {
        const apiId = metadata?.Technisch?.ID;
        const id = apiId ? String(apiId) : this.generateId(docUrl || `${gz}-${date}`);

        results.push({
          id,
          title,
          court: Array.isArray(court) ? court[0] : court,
          date: this.normalizeDate(date),
          gz,
          url: docUrl || '',
          contentUrls,
          snippet: this.extractSnippet(judikatur),
        });
      }
    }

    return results;
  }

  /**
   * Extract Geschäftszahl from API response
   */
  private extractGZ(gz: string | { item?: string[] } | undefined): string | undefined {
    if (!gz) return undefined;

    if (typeof gz === 'string') return gz;
    if (Array.isArray(gz)) return gz[0];
    if (gz?.item && Array.isArray(gz.item)) return gz.item[0];

    return undefined;
  }

  /**
   * Extract title from judgment data
   */
  private extractTitle(judikatur: any): string {
    // Try to get from first Entscheidungstext
    const texts = judikatur?.Entscheidungstexte?.item;
    if (texts && Array.isArray(texts) && texts.length > 0) {
      const first = texts[0];
      if (first?.Geschaeftszahl) {
        return first.Geschaeftszahl;
      }
    }

    // Fallback to Geschaeftszahl (may be string or array)
    const gz = this.extractGZ(judikatur.Geschaeftszahl);
    if (gz) return gz;

    return 'Unknown Judgment';
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
    const texts = judikatur?.Entscheidungstexte?.item;
    if (texts && Array.isArray(texts) && texts.length > 0) {
      const first = texts[0];
      if (first?.Anmerkung) {
        return first.Anmerkung.replace(/<[^>]*>/g, '').substring(0, 200);
      }
    }

    return undefined;
  }

  /**
   * Extract direct document content URLs (XML/HTML/RTF/PDF) from the RIS API payload.
   */
  private extractContentUrls(item: any): SearchResult['contentUrls'] {
    const urls: SearchResult['contentUrls'] = {};

    const list: any[] =
      item?.Dokumentliste?.ContentReference?.Urls?.ContentUrl ||
      item?.Dokumentliste?.ContentReference?.Urls?.contentUrl ||
      [];

    const arr = Array.isArray(list) ? list : [list];
    for (const entry of arr) {
      const u = entry?.Url || entry?.url;
      if (typeof u !== 'string') continue;
      if (u.endsWith('.xml')) urls.xml = u;
      else if (u.endsWith('.html')) urls.html = u;
      else if (u.endsWith('.rtf')) urls.rtf = u;
      else if (u.endsWith('.pdf')) urls.pdf = u;
    }

    return Object.keys(urls).length ? urls : undefined;
  }

  /**
   * Parse HTML detail page for full text
   */
  private async parseDetailPage(html: string, url: string): Promise<JudgmentDetail | null> {
    const cheerio = await import('cheerio');
    // cheerio is ESM/CJS hybrid; use .load for a stable API
    const $ = cheerio.load(html);

    // Try to find document title
    const title =
      $('h1.dokument-titel, h1.dokumentTitle, h1').first().text().trim() ||
      $('title').text().replace(/\s*[--]\s*RIS.*$/i, '').trim() ||
      'Unknown Title';

    // Extract metadata from page
    const pageText = $('body').text();

    const courtMatch = pageText.match(/\b(OGH|OLG|LG|BG|VfGH|VwGH)\b/);
    const dateMatch = pageText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
    const gzMatch = pageText.match(/([A-Z]{2,4}\s*[\d\/]+(?:\/\d{4})?)/);

    const court = courtMatch?.[1] || 'Unknown';
    const date = dateMatch?.[1] || '';
    const gz = gzMatch?.[1];

    // Try to find full text in document links
    let fullText = '';
    const docLinks = $('a[href*="/Dokumente/Justiz/"]').toArray();

    // Look for XML/HTML/RTF links and try to fetch content
    for (const link of docLinks.slice(0, 3)) {
      const href = $(link).attr('href');
      if (href && (href.endsWith('.html') || href.endsWith('.rtf'))) {
        try {
          const axios = await import('axios');
          const response = await axios.default.get(href, { timeout: 10000 });
          fullText = await this.extractTextFromDocument(response.data, href);
          if (fullText.length > 500) break;
        } catch {
          // Continue trying other links
        }
      }
    }

    // If no document content, use page text as fallback
    if (!fullText || fullText.length < 100) {
      // Try to extract meaningful content from main content area
      const contentArea = $('.dokument-text, .content, article, main, .document-body').first();
      fullText = contentArea.text().trim() || pageText.substring(0, 5000);
    }

    return {
      id: this.generateId(url),
      title,
      court,
      date: this.normalizeDate(date),
      gz,
      url,
      snippet: fullText.substring(0, 200) + '...',
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
  private async extractTextFromDocument(content: string, url: string): Promise<string> {
    // HTML / XML
    if (url.endsWith('.html') || url.endsWith('.xml')) {
      const cheerio = await import('cheerio');
      const xmlMode = url.endsWith('.xml');
      const $ = cheerio.load(content, { xmlMode });

      // Drop scripts/styles if present (HTML)
      $('script, style, noscript').remove();

      const bodyText = $('body').text();
      const text = (bodyText && bodyText.trim().length > 0 ? bodyText : $.text()).trim();
      return text;
    }

    // RTF (very naive, but better than dumping control codes)
    if (url.endsWith('.rtf')) {
      return this.rtfToText(content);
    }

    // Unknown / PDF etc.
    return content;
  }

  private rtfToText(rtf: string): string {
    // Strip RTF groups and control words; keep a rough plain-text.
    // This won't be perfect, but it's good enough for searchable notes.
    return rtf
      .replace(/\{\\\*[^}]*\}/g, '')
      .replace(/\{\s*\}/g, '')
      .replace(/\\par[d]?/g, '\n')
      .replace(/\\tab/g, '\t')
      .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, '')
      .replace(/[{}]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  private buildDetailFromExtractedText(result: SearchResult, extractedText: string, sourceUrl: string): JudgmentDetail {
    const fullText = this.cleanText(extractedText);

    return {
      id: result.id,
      title: result.title,
      court: result.court,
      date: result.date,
      gz: result.gz,
      url: result.url,
      snippet: fullText.substring(0, 200) + '...',
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

  /**
   * Generate unique ID
   */
  private generateId(url: string): string {
    return crypto.createHash('md5').update(url || Math.random().toString()).digest('hex').substring(0, 16);
  }

  /**
   * Normalize date to ISO format
   */
  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';

    const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return dateStr;
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
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
