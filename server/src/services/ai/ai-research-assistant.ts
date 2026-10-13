import { z } from 'zod';
import { env } from '../../config/env';
import { bharatStockProvider } from '../market-data/bharatstock.provider';
import { TechnicalCalculator } from '../indicators/technical-calculator';
import { recommendationEngine } from '../recommendations/recommendation-engine';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result?: any;
  }>;
}

export interface ChatResponse {
  message: string;
  toolsUsed: string[];
  symbol?: string;
  isAiEnabled: boolean;
  provider: string;
}

// Tool argument schemas with strict validation
const GetQuoteArgsSchema = z.object({
  symbol: z.string().min(1).max(20),
});

const GetFinancialsArgsSchema = z.object({
  symbol: z.string().min(1).max(20),
  periodType: z.enum(['quarterly', 'annual']).default('quarterly'),
});

const GetTechnicalsArgsSchema = z.object({
  symbol: z.string().min(1).max(20),
});

const GetRatiosArgsSchema = z.object({
  symbol: z.string().min(1).max(20),
});

const GetPeersArgsSchema = z.object({
  sector: z.string().min(1).max(50),
});

const GetRecommendationArgsSchema = z.object({
  symbol: z.string().min(1).max(20),
});

export class AiResearchAssistant {
  /**
   * Available read-only research tools
   */
  readonly tools = [
    {
      name: 'get_quote',
      description: 'Fetch the latest verified price, change, volume and trade date for an Indian stock ticker (NSE/BSE).',
      parameters: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Stock ticker e.g. RELIANCE, TCS' } },
        required: ['symbol'],
      },
    },
    {
      name: 'get_financials',
      description: 'Retrieve quarterly or annual income statement, balance sheet, and cash flow data.',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Stock ticker' },
          periodType: { type: 'string', enum: ['quarterly', 'annual'], description: 'Reporting period type' },
        },
        required: ['symbol'],
      },
    },
    {
      name: 'get_technicals',
      description: 'Calculate moving averages (SMA 20/50/200), RSI 14, MACD, and volatility from daily price action.',
      parameters: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Stock ticker' } },
        required: ['symbol'],
      },
    },
    {
      name: 'get_valuation_ratios',
      description: 'Retrieve P/E, P/B, ROE, ROCE, dividend yield, and 52-week price range.',
      parameters: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Stock ticker' } },
        required: ['symbol'],
      },
    },
    {
      name: 'get_peers',
      description: 'Compare valuation multiples (P/E, ROE, Market Cap) with competitors in the same sector.',
      parameters: {
        type: 'object',
        properties: { sector: { type: 'string', description: 'Sector name e.g. Information Technology' } },
        required: ['sector'],
      },
    },
    {
      name: 'get_recommendation_evidence',
      description: 'Retrieve explainable short-term and long-term research signals with positive factors, negative factors, and risks.',
      parameters: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Stock ticker' } },
        required: ['symbol'],
      },
    },
  ];

  /**
   * Executes a research tool safely with argument validation.
   */
  async executeTool(name: string, rawArgs: unknown): Promise<any> {
    switch (name) {
      case 'get_quote': {
        const { symbol } = GetQuoteArgsSchema.parse(rawArgs);
        return await bharatStockProvider.getQuote(symbol);
      }
      case 'get_financials': {
        const { symbol, periodType } = GetFinancialsArgsSchema.parse(rawArgs);
        const data = await bharatStockProvider.getFinancials(symbol, periodType);
        return data.slice(0, 5); // Return latest 5 periods
      }
      case 'get_technicals': {
        const { symbol } = GetTechnicalsArgsSchema.parse(rawArgs);
        const candles = await bharatStockProvider.getHistoricalPrices(symbol, { pageSize: 120 });
        const result = TechnicalCalculator.calculateAll(candles);
        return {
          indicators: result.indicators,
          trend: result.trend,
          volatility30d: result.volatility30d,
          relativeVolume: result.relativeVolume,
        };
      }
      case 'get_valuation_ratios': {
        const { symbol } = GetRatiosArgsSchema.parse(rawArgs);
        return await bharatStockProvider.getRatios(symbol);
      }
      case 'get_peers': {
        const { sector } = GetPeersArgsSchema.parse(rawArgs);
        return await bharatStockProvider.getPeerComparison(sector, 6);
      }
      case 'get_recommendation_evidence': {
        const { symbol } = GetRecommendationArgsSchema.parse(rawArgs);
        const [quote, profile, candles, financials, ratios, shareholding] = await Promise.all([
          bharatStockProvider.getQuote(symbol),
          bharatStockProvider.getStockProfile(symbol),
          bharatStockProvider.getHistoricalPrices(symbol, { pageSize: 120 }),
          bharatStockProvider.getFinancials(symbol, 'quarterly'),
          bharatStockProvider.getRatios(symbol),
          bharatStockProvider.getShareholding(symbol),
        ]);
        const tech = TechnicalCalculator.calculateAll(candles);
        return recommendationEngine.generateRecommendation(
          quote,
          profile,
          candles,
          tech.indicators,
          tech.volatility30d,
          tech.relativeVolume,
          financials,
          ratios,
          shareholding
        );
      }
      default:
        throw new Error(`Unknown tool "${name}"`);
    }
  }

  /**
   * Deterministic research answer generator when external LLM API is not configured.
   * Answers based on verified data and recommendation engine evidence.
   */
  async generateDeterministicResponse(query: string, symbol: string): Promise<ChatResponse> {
    const q = query.toLowerCase();
    const toolsUsed: string[] = [];

    const [quote, ratios, rec] = await Promise.all([
      this.executeTool('get_quote', { symbol }),
      this.executeTool('get_valuation_ratios', { symbol }),
      this.executeTool('get_recommendation_evidence', { symbol }),
    ]);
    toolsUsed.push('get_quote', 'get_valuation_ratios', 'get_recommendation_evidence');

    let answer = '';

    if (q.includes('risk') || q.includes('downside') || q.includes('threat') || q.includes('bear')) {
      const allRisks = [
        ...rec.shortTerm.importantRisks,
        ...rec.longTerm.importantRisks,
      ];
      answer = `### Key Risks for ${symbol} (${quote.companyName || symbol}):\n\n` +
        (allRisks.length > 0
          ? allRisks.map((r: string, idx: number) => `${idx + 1}. **${r}**`).join('\n')
          : `• No acute high-risk flags identified in recent disclosures.\n• Trailing Volatility is ${rec.shortTerm.allFactors.find((f: any) => f.id === 'volatility_risk')?.value || 'moderate'}.`) +
        `\n\n**Note on Invalidation:** Negative quarterly earnings contraction, breach of key moving averages (SMA20: ₹${rec.shortTerm.allFactors.find((f: any) => f.id === 'trend_strength')?.value?.split('SMA20: ')[1]?.split(',')[0] || 'N/A'}), or margin compression would weaken this thesis.`;
    } else if (q.includes('why') || q.includes('favorable') || q.includes('thesis') || q.includes('recommend') || q.includes('long term')) {
      const ltPos = rec.longTerm.positiveFactors.map((f: any) => `• **${f.name}:** ${f.interpretation} (${f.value})`);
      const stPos = rec.shortTerm.positiveFactors.map((f: any) => `• **${f.name}:** ${f.interpretation} (${f.value})`);

      answer = `### Investment Thesis for ${symbol} (Latest Price: ₹${quote.price})\n\n` +
        `**Long-Term Signal (${rec.longTerm.score}/100 - ${rec.longTerm.classification.toUpperCase()}):**\n` +
        `${rec.longTerm.explanation}\n\n` +
        `**Supporting Factors:**\n` +
        (ltPos.length > 0 ? ltPos.join('\n') : '• Balanced fundamental metrics without acute red flags.') +
        `\n\n**Short-Term Posture (${rec.shortTerm.score}/100 - ${rec.shortTerm.classification.toUpperCase()}):**\n` +
        `${rec.shortTerm.explanation}\n\n` +
        (stPos.length > 0 ? stPos.join('\n') : '');
    } else if (q.includes('revenue') || q.includes('quarter') || q.includes('earnings') || q.includes('profit')) {
      const fins = await this.executeTool('get_financials', { symbol, periodType: 'quarterly' });
      toolsUsed.push('get_financials');
      const finRows = fins
        .map(
          (f: any) =>
            `• **Period Ending ${f.periodEndDate}:** Revenue ₹${(f.revenue / 1e7).toFixed(1)} Cr, Net Profit ₹${(f.netProfit / 1e7).toFixed(1)} Cr, Operating Margin ${f.revenue > 0 && f.operatingProfit ? ((f.operatingProfit / f.revenue) * 100).toFixed(1) : 'N/A'}%`
        )
        .join('\n');
      answer = `### Financial Performance History for ${symbol}:\n\n${finRows}\n\n*Source: BharatStock Integrated Regulatory Filings*`;
    } else if (q.includes('valuation') || q.includes('pe') || q.includes('pb') || q.includes('peer')) {
      answer = `### Valuation Assessment for ${symbol}:\n\n` +
        `• **P/E Ratio:** ${ratios.peRatio ? `${ratios.peRatio.toFixed(1)}x` : 'N/A'}\n` +
        `• **Price to Book (P/B):** ${ratios.pbRatio ? `${ratios.pbRatio.toFixed(2)}x` : 'N/A'}\n` +
        `• **ROE:** ${ratios.roe ? `${ratios.roe.toFixed(1)}%` : 'N/A'}\n` +
        `• **ROCE:** ${ratios.roce ? `${ratios.roce.toFixed(1)}%` : 'N/A'}\n` +
        `• **52-Week Range:** ₹${ratios.week52Low || 'N/A'} - ₹${ratios.week52High || 'N/A'}\n\n` +
        `**Valuation Interpretation:** ${rec.longTerm.allFactors.find((f: any) => f.id === 'valuation')?.interpretation || 'Fairly priced relative to market standards.'}`;
    } else if (q.includes('technical') || q.includes('rsi') || q.includes('sma') || q.includes('macd')) {
      const tech = await this.executeTool('get_technicals', { symbol });
      toolsUsed.push('get_technicals');
      answer = `### Technical Analysis Summary for ${symbol}:\n\n` +
        `• **Trend:** ${tech.trend.toUpperCase()}\n` +
        `• **20-Day SMA:** ₹${tech.indicators.sma20 ?? 'N/A'}\n` +
        `• **50-Day SMA:** ₹${tech.indicators.sma50 ?? 'N/A'}\n` +
        `• **RSI (14):** ${tech.indicators.rsi14 ? `${tech.indicators.rsi14} (${tech.indicators.rsi14 > 70 ? 'Overbought' : tech.indicators.rsi14 < 30 ? 'Oversold' : 'Neutral expansion'})` : 'N/A'}\n` +
        `• **MACD:** ${tech.indicators.macd ?? 'N/A'} (Signal: ${tech.indicators.macdSignal ?? 'N/A'}, Histogram: ${tech.indicators.macdHistogram ?? 'N/A'})\n` +
        `• **Relative Volume:** ${tech.relativeVolume}x vs 20D SMA\n` +
        `• **30-Day Volatility:** ${tech.volatility30d}% Annualized`;
    } else {
      answer = `### Research Overview for ${symbol} (${quote.companyName || symbol}):\n\n` +
        `• **Current Price:** ₹${quote.price} (${quote.changePct >= 0 ? '+' : ''}${quote.changePct}%)\n` +
        `• **Short-Term Score (1-20 days):** ${rec.shortTerm.score}/100 (${rec.shortTerm.classification.toUpperCase()})\n` +
        `• **Long-Term Score (1-3 years):** ${rec.longTerm.score}/100 (${rec.longTerm.classification.toUpperCase()})\n\n` +
        `**Summary:** ${rec.overallSummary}\n\n` +
        `Feel free to ask specific questions about revenue growth, balance sheet risks, technical indicators, or valuation!`;
    }

    return {
      message: answer,
      toolsUsed,
      symbol,
      isAiEnabled: env.AI_PROVIDER !== 'none' && Boolean(env.AI_API_KEY),
      provider: env.AI_PROVIDER !== 'none' && env.AI_API_KEY ? env.AI_PROVIDER : 'deterministic-research-engine',
    };
  }

  /**
   * Main entry point for AI chat conversation
   */
  async handleChat(query: string, symbol = 'RELIANCE'): Promise<ChatResponse> {
    const cleanSymbol = symbol.trim().toUpperCase();

    // If external LLM provider is configured (e.g. Gemini, OpenAI) and has key
    if (env.AI_PROVIDER !== 'none' && env.AI_API_KEY) {
      try {
        // If Gemini is configured
        if (env.AI_PROVIDER === 'gemini') {
          return await this.callGemini(query, cleanSymbol);
        }
      } catch (err) {
        console.warn('[AiResearchAssistant] External LLM provider error, falling back to deterministic research:', (err as Error).message);
      }
    }

    // Default to verified deterministic research engine
    return await this.generateDeterministicResponse(query, cleanSymbol);
  }

  /**
   * Integration with Gemini API if configured
   */
  private async callGemini(query: string, symbol: string): Promise<ChatResponse> {
    const apiKey = env.AI_API_KEY!;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Gather grounded research context using our tools
    const [quote, rec, ratios] = await Promise.all([
      this.executeTool('get_quote', { symbol }),
      this.executeTool('get_recommendation_evidence', { symbol }),
      this.executeTool('get_valuation_ratios', { symbol }),
    ]);

    const context = `
Current Stock Under Research: ${symbol} (${quote.companyName || symbol})
Latest Verified Price: ₹${quote.price} (Change: ${quote.changePct}%)
Trade Date: ${quote.tradeDate}
Short-Term Heuristic Score: ${rec.shortTerm.score}/100 (${rec.shortTerm.classification})
Long-Term Heuristic Score: ${rec.longTerm.score}/100 (${rec.longTerm.classification})
Key Positive Factors: ${rec.longTerm.positiveFactors.map((f: any) => `${f.name}: ${f.value}`).join('; ')}
Key Negative Factors / Risks: ${[...rec.shortTerm.importantRisks, ...rec.longTerm.importantRisks].join('; ')}
Valuation Multiples: P/E: ${ratios.peRatio}x, P/B: ${ratios.pbRatio}x, ROE: ${ratios.roe}%, ROCE: ${ratios.roce}%
`;

    const prompt = `You are PickMyStock's financial research analyst for Indian stocks (NSE/BSE).
Answer the user's question accurately using ONLY the verified facts below. Do NOT make up numbers, targets, or forward predictions. Always highlight key risks and clarify that past data does not guarantee returns.

Context:
${context}

User Question:
${query}
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      message: text,
      toolsUsed: ['get_quote', 'get_recommendation_evidence', 'get_valuation_ratios'],
      symbol,
      isAiEnabled: true,
      provider: 'gemini',
    };
  }
}

export const aiResearchAssistant = new AiResearchAssistant();
