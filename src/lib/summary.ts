// Summary generator using OpenAI or naive fallback

import type { JudgmentDetail } from '../types/index.js';

// Lazy initialization of OpenAI
let openaiClient: ReturnType<typeof import('openai').OpenAI> | null = null;

async function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    const OpenAI = (await import('openai')).default;
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface SummaryResult {
  summary: string;
  method: 'openai' | 'naive' | 'none';
}

/**
 * Generate a summary for a judgment
 */
export async function generateSummary(
  judgment: JudgmentDetail,
  options: { preferNaive?: boolean } = {}
): Promise<SummaryResult> {
  // Check if OpenAI is available
  if (!process.env.OPENAI_API_KEY || options.preferNaive) {
    return generateNaiveSummary(judgment);
  }

  try {
    return await generateOpenAISummary(judgment);
  } catch (error) {
    console.warn('OpenAI summary failed, falling back to naive summary:', error);
    return generateNaiveSummary(judgment);
  }
}

/**
 * Generate summary using OpenAI
 */
async function generateOpenAISummary(judgment: JudgmentDetail): Promise<SummaryResult> {
  const client = await getOpenAIClient();
  if (!client) {
    return generateNaiveSummary(judgment);
  }

  const prompt = `Analysiere das folgende österreichische Gerichtsurteil und erstelle eine prägnante Zusammenfassung auf Deutsch:

**Titel:** ${judgment.title}
**Gericht:** ${judgment.court}
**Datum:** ${judgment.date}
**Aktenzeichen:** ${judgment.gz || 'N/A'}

**Volltext:**
${judgment.fullText.substring(0, 8000)}

Bitte fasse das Urteil in 3-5 Sätzen zusammen, einschließlich:
- Sachverhalt (was war der Kern des Falls)
- Entscheidung des Gerichts
- Relevante rechtliche Aspekte`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein juristischer Assistent, der österreichische Gerichtsurteile analysiert und zusammenfasst. Antworte immer auf Deutsch.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const summary = response.choices[0]?.message?.content || '';

  return {
    summary,
    method: 'openai',
  };
}

/**
 * Generate a naive summary (first N sentences)
 */
function generateNaiveSummary(judgment: JudgmentDetail): SummaryResult {
  const fullText = judgment.fullText || '';
  
  if (!fullText) {
    return {
      summary: 'Kein Volltext verfügbar für Zusammenfassung.',
      method: 'none',
    };
  }

  // Split into sentences and take first 5
  const sentences = fullText
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const summarySentences = sentences.slice(0, 5);
  
  const summary = `**Automatische Zusammenfassung (keine KI):**
  
Gericht: ${judgment.court}
Datum: ${judgment.date}
Aktenzeichen: ${judgment.gz || 'N/A'}

${summarySentences.join('. ')}${summarySentences.length > 0 ? '.' : ''}

*Hinweis: Diese Zusammenfassung wurde automatisch generiert ohne KI-Unterstützung. Für eine detailliertere Analyse kann eine KI-Zusammenfassung aktiviert werden (OPENAI_API_KEY setzen).*`;

  return {
    summary,
    method: 'naive',
  };
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
